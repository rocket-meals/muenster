import {syncDatabase, SyncDataBaseOptionDockerPush} from "./SyncDatabaseSchema";


async function main() {
  // start sync-database schema service
  console.log("Starting Backend-Sync Service...");

  console.log("Syncing database schema with Docker Push option...");
  let errors = await syncDatabase(SyncDataBaseOptionDockerPush);
    if (errors) {
        console.error('❌ Fehler beim Synchronisieren des Datenbankschemas mit Docker Push Option.');
        process.exit(1);
    }
}

// Starte den Service
main();
