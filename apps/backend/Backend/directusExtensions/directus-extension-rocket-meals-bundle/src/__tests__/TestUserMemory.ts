import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

// These modules from Directus are ESM-only. Import them dynamically inside the
// test setup to avoid issues with Jest's CommonJS execution environment.
let getDatabase: any;
let install: any;
let migrate: any;
let getSchema: any;
let ItemsService: any;

let usersService: any;
let db: any;

beforeAll(async () => {
  process.env.DB_CLIENT = 'sqlite3';
  process.env.DB_FILENAME = ':memory:';

  // Dynamically import Directus modules to work around Jest ESM limitations.
  // Use string-typed variables so TypeScript doesn't attempt to resolve the
  // modules at compile time, preventing TS2307 errors.
  const dbModule: string = '@directus/api/database/index';
  const seedsModule: string = '@directus/api/database/seeds/run';
  const migrationsModule: string = '@directus/api/database/migrations/run';
  const schemaModule: string = '@directus/api/utils/get-schema';
  const itemsModule: string = '@directus/api/services/items';

  ({ default: getDatabase } = await import(dbModule));
  ({ default: install } = await import(seedsModule));
  ({ default: migrate } = await import(migrationsModule));
  ({ getSchema } = await import(schemaModule));
  ({ ItemsService } = await import(itemsModule));

  db = getDatabase();
  await install(db);
  await migrate(db, 'latest');
  const schema = await getSchema({ database: db });
  usersService = new ItemsService('directus_users', { schema, knex: db });
});

afterAll(async () => {
  await db.destroy();
});

describe('in-memory database with ItemService', () => {
  it('creates and reads a user', async () => {
    const email = 'user@example.com';
    const password = 'secret';
    const id = await usersService.createOne({ email, password });
    const user = await usersService.readOne(id);
    expect(user.email).toBe(email);
  });
});
