import { beforeAll, describe, expect, it } from '@jest/globals';

let usersService: any;

beforeAll(async () => {
  process.env.DB_CLIENT = 'sqlite3';
  process.env.DB_FILENAME = ':memory:';

  const { default: getDatabase } = await import('@directus/api/database/index');
  const { default: install } = await import('@directus/api/database/seeds/run');
  const { default: migrate } = await import('@directus/api/database/migrations/run');
  const { getSchema } = await import('@directus/api/utils/get-schema');
  const { ItemsService } = await import('@directus/api/services/items');

  const db = getDatabase();
  await install(db);
  await migrate(db);
  const schema = await getSchema({ database: db });
  usersService = new ItemsService('directus_users', { schema, knex: db });
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
