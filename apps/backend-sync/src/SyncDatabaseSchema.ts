import {DirectusDatabaseSync} from './DirectusDatabaseSync';
import {DockerDirectusHelper} from './DockerDirectusHelper';
import {ServerHelper} from 'repo-depkit-common';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import {DockerContainerManager} from './DockerContainerManager';

enum SyncOperation {
  NONE = 'none',
  PUSH = 'push',
  PULL = 'pull',
}

async function findFileUpwards(startDir: string, filename: string): Promise<string | null> {
  let currentDir = startDir;

  while (true) {
    const potentialPath = path.join(currentDir, filename);
    if (fs.existsSync(potentialPath)) {
      return potentialPath;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached the root directory
    }
    currentDir = parentDir;
  }

  return null;
}

async function findEnvFile(): Promise<string | null> {
  const startDir = process.cwd();
  return findFileUpwards(startDir, '.env');
}

export type SyncDatabaseOptions = {
    adminEmail?: string;
    adminPassword?: string;
    directusUrl?: string;
    pathToDataDirectusSync?: string;
    dockerDirectusRestart?: boolean;
    push?: boolean;
    pull?: boolean;
    dockerPush?: boolean;
    pullFromTestSystem?: boolean;
    pushToTestSystem?: boolean;
}

export const SyncDataBaseOptionDockerPush: SyncDatabaseOptions = {
  dockerPush: true,
}

export async function syncDatabase(options: SyncDatabaseOptions): Promise<boolean> {
  console.log("Starting Backend Sync Service...");
  console.log("Options:");
  console.log(JSON.stringify(options, null, 2));

  let adminEmail = options.adminEmail || process.env.ADMIN_EMAIL;
  let adminPassword = options.adminPassword || process.env.ADMIN_PASSWORD;
  let directusInstanceUrl = options.directusUrl;
  let pathToDataDirectusSync = options.pathToDataDirectusSync;
  let dockerDirectusRestart = options.dockerDirectusRestart || false;

  let syncOperation = SyncOperation.NONE;
  if (options.push || options.dockerPush || options.pushToTestSystem) {
    syncOperation = SyncOperation.PUSH;
  }

  if (options.dockerPush) {
    dockerDirectusRestart = true;
  }

  if (options.pull || options.pullFromTestSystem) {
    syncOperation = SyncOperation.PULL;
  }

  if (options.dockerPush) {
    directusInstanceUrl = DockerDirectusHelper.getDirectusServerUrl();
    pathToDataDirectusSync = DockerDirectusHelper.getDataPathToDirectusSyncData();
  }

  if (options.pullFromTestSystem || options.pushToTestSystem) {
    directusInstanceUrl = ServerHelper.TEST_SERVER_CONFIG.server_url;
    let envFilePath = await findEnvFile();
    if (envFilePath) {
      console.log(`🔍 Gefundene .env Datei für Pull vom Testsystem: ${envFilePath}`);
      dotenv.config({ path: envFilePath });
      adminEmail = process.env.ADMIN_EMAIL;
      adminPassword = process.env.ADMIN_PASSWORD;

      if (!pathToDataDirectusSync) {
        let folderOfEnvFile = path.dirname(envFilePath || '');
        pathToDataDirectusSync = path.join(folderOfEnvFile, DockerDirectusHelper.getRelativePathToDirectusSyncFromProjectRoot());
      }
    }
  }

  let errors = false;
  if (!directusInstanceUrl) {
    console.error('❌ Fehler: Directus URL muss angegeben werden (--directus-url) oder Docker Push muss aktiviert sein (--docker-push)');
    errors = true;
  }
  if (!pathToDataDirectusSync) {
    console.error('❌ Fehler: Pfad zu den Sync-Daten muss angegeben werden (--path-to-data-directus-sync)');
    errors = true;
  }
  if (!adminEmail) {
    console.error('❌ Fehler: Admin Email muss angegeben werden (--admin-email) oder über Umgebungsvariablen ADMIN_EMAIL gesetzt sein');
    errors = true;
  }
  if (!adminPassword) {
    console.error('❌ Fehler: Admin Password muss angegeben werden (--admin-password) oder über Umgebungsvariablen ADMIN_PASSWORD gesetzt sein');
    errors = true;
  }
  if (syncOperation === SyncOperation.NONE) {
    console.error('❌ Fehler: Ungültige Operation. Wählen Sie entweder --push, --pull oder --docker-push');
    errors = true;
  }

  if (errors) {
    return false;
  }

  try {
    console.log('🚀 Starte Backend Sync Service...');
    console.log(`📡 Directus URL: ${directusInstanceUrl}`);

    const syncHelper = new DirectusDatabaseSync({
      directusInstanceUrl: directusInstanceUrl as string,
      adminEmail: adminEmail as string,
      adminPassword: adminPassword as string,
      pathToDataDirectusSyncData: pathToDataDirectusSync as string,
    });

    switch (syncOperation) {
      case SyncOperation.PUSH:
        console.log('🔄 Führe initiale Push-Operation durch...');
        await syncHelper.push();
        console.log('✅ Initiale Push-Operation erfolgreich abgeschlossen!');
        break;
      case SyncOperation.PULL:
        console.log('🔄 Führe initiale Pull-Operation durch...');
        await syncHelper.pull();
        console.log('✅ Initiale Pull-Operation erfolgreich abgeschlossen!');
        break;
      case SyncOperation.NONE:
        // Sollte nie erreicht werden, da oben validiert
        break;
    }

    if (dockerDirectusRestart) {
      console.log('🔄 Starte Directus Docker Container neu...');
      const restartSuccess = await DockerContainerManager.restartDirectusContainers(directusInstanceUrl as string);
      if (restartSuccess) {
        console.log('✅ Directus Docker Container erfolgreich neu gestartet!');
      } else {
        console.error('❌ Fehler: Directus Docker Container Neustart fehlgeschlagen!');
        return false;
      }
    }

    /**
    // Ensure Apple client secret is present/rotated before restarting containers
    try {
      const result = await ensureAppleClientSecret();
      if (result.changed) {
        console.log(`🔁 Apple client secret was changed (reason=${result.reason}).`);
        if (dockerDirectusRestart) {
          console.log('🔄 Neustart der Directus Docker Container aufgrund geänderten Apple-Secrets...');
          const restartSuccess = await DockerContainerManager.restartDirectusContainers(directusInstanceUrl as string);
          if (restartSuccess) {
            console.log('✅ Directus Docker Container erfolgreich neu gestartet nach Secret-Rotation!');
            didRestartDueToSecret = true;
          } else {
            console.error('❌ Fehler: Directus Docker Container Neustart nach Secret-Rotation fehlgeschlagen!');
            process.exit(1);
          }
        } else {
          console.log('ℹ️ Apple-Secret geändert, aber --docker-push/--docker-directus-restart nicht gesetzt. Bitte Container manuell neu starten.');
        }
      }
    } catch (err) {
      console.error('Fehler beim Prüfen/Roten des Apple Secrets:', err);
    }
    */

  } catch (error) {
    console.error('💥 Fehler im Backend Sync Service:', error);
    return false;
  }
    return true;
}