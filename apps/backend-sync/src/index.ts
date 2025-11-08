import {syncDatabase, SyncDataBaseOptionDockerPush} from "./SyncDatabaseSchema";
import * as cron from 'node-cron';

// Kurze Contract-Beschreibung:
// - Inputs: keine (Jobs werden intern oder über registerCronJob() registriert)
// - Outputs: lang laufender Prozess, Cron-Jobs werden zu festen Zeiten ausgeführt
// - Fehler: Sync-Aufruf führt bei Fehlern zu exit(1)

// Kleines API zum Registrieren von Cron-Jobs
export type CronTask = {
  name: string;
  schedule: string; // cron expression
  task: () => Promise<void> | void;
};

const registeredTasks: Map<string, cron.ScheduledTask> = new Map();

export function registerCronJob(task: CronTask) {
  if (registeredTasks.has(task.name)) {
    console.warn(`Cron-Job mit Namen ${task.name} existiert bereits. Überspringe Registrierung.`);
    return;
  }

  // Validierung der Cron-Expression
  if (!cron.validate(task.schedule)) {
    console.error(`Ungültige Cron-Expression für Job ${task.name}: ${task.schedule}`);
    return;
  }

  const scheduled = cron.schedule(task.schedule, async () => {
    console.log(`Starte Cron-Job: ${task.name} (${new Date().toISOString()})`);
    try {
      await task.task();
      console.log(`Fertig Cron-Job: ${task.name} (${new Date().toISOString()})`);
    } catch (err) {
      console.error(`Fehler im Cron-Job ${task.name}:`, err);
    }
  }, {
    scheduled: true,
  });

  registeredTasks.set(task.name, scheduled);
  console.log(`Cron-Job registriert: ${task.name} -> ${task.schedule}`);
}

export function stopAllCronJobs() {
  for (const [name, scheduled] of registeredTasks.entries()) {
    try {
      scheduled.stop();
      console.log(`Cron-Job gestoppt: ${name}`);
    } catch (err) {
      console.warn(`Fehler beim Stoppen von Cron-Job ${name}:`, err);
    }
  }
}

async function main() {
  // start sync-database schema service
  console.log("Starting Backend-Sync Service...");
  
  // Halteprozess offen, sichere Beendigung bei SIGINT / SIGTERM
  const shutdown = async () => {
    console.log('Beende Backend-Sync Service...');
    stopAllCronJobs();
    // Warte kurz, damit laufende Tasks sauber enden können
    setTimeout(() => process.exit(0), 500);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Beispiel-Registrierung: Ein Job, der alle 10 Sekunden läuft
  registerCronJob({
    name: 'sync-database-every-10-seconds',
    schedule: '*/10 * * * * *', // alle 10 Sekunden
    task: async () => {
      console.log("Beispiel-Cron-Job: Synchronisiere Datenbankschema (alle 10 sekunden)...");
    }
  });

  console.log("Syncing database schema with Docker Push option...");
  let errors = await syncDatabase(SyncDataBaseOptionDockerPush);
  if (errors) {
      console.error('❌ Fehler beim Synchronisieren des Datenbankschemas mit Docker Push Option.');
      process.exit(1);
  }


  console.log('Backend-Sync Service läuft. Cron-Jobs sind aktiv.');
  // keep process alive: never-resolving promise ist besser als while(true) für TS
  await new Promise<never>(() => {});
}

// Starte den Service
main();
