import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import getDatabase from '@directus/api/database/index';
import install from '@directus/api/database/seeds/run';
import migrate from '@directus/api/database/migrations/run';
import { getSchema } from '@directus/api/utils/get-schema';
import { ItemsService } from '@directus/api/services/items';

let usersService: any;
let db: any;

beforeAll(async () => {
  process.env.DB_CLIENT = 'sqlite3';
  process.env.DB_FILENAME = ':memory:';

  db = getDatabase();
  await install(db);
  await migrate(db);
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
