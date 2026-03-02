import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  loadBaseUrl,
  getDatabaseUrl,
  createClient,
  disconnect,
  disconnectAll,
  checkHealth,
  clearClientCache,
} from '../index';

// Use a real test database for integration tests
// Falls back to a local dev URL if DATABASE_URL is not set
const TEST_DB_URL =
  process.env.DATABASE_URL ??
  'postgresql://workspace:workspace_dev@localhost:5432/client_server_database_db';

beforeEach(() => {
  clearClientCache();
});

afterAll(async () => {
  await disconnectAll();
});

describe('loadBaseUrl', () => {
  it('should return DATABASE_URL from environment', () => {
    const original = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432';

    const url = loadBaseUrl();
    expect(url).toBe('postgresql://test:test@localhost:5432');

    if (original) {
      process.env.DATABASE_URL = original;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  it('should throw when DATABASE_URL is not set', () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    expect(() => loadBaseUrl()).toThrow('DATABASE_URL environment variable is not set');

    if (original) {
      process.env.DATABASE_URL = original;
    }
  });
});

describe('getDatabaseUrl', () => {
  it('should append database name to base URL', () => {
    const url = getDatabaseUrl('my_app_db', 'postgresql://user:pass@localhost:5432');
    expect(url).toBe('postgresql://user:pass@localhost:5432/my_app_db');
  });

  it('should handle base URL with trailing slash', () => {
    const url = getDatabaseUrl('my_app_db', 'postgresql://user:pass@localhost:5432/');
    expect(url).toBe('postgresql://user:pass@localhost:5432/my_app_db');
  });

  it('should use DATABASE_URL env var when no baseUrl provided', () => {
    const original = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://env:env@localhost:5432';

    const url = getDatabaseUrl('test_db');
    expect(url).toBe('postgresql://env:env@localhost:5432/test_db');

    if (original) {
      process.env.DATABASE_URL = original;
    } else {
      delete process.env.DATABASE_URL;
    }
  });
});

class MockClient {
  constructor(public opts: any) {}
  $queryRaw = async () => [1];
  $disconnect = async () => {};
}

describe('createClient', () => {
  it('should create a client instance', () => {
    const client = createClient(TEST_DB_URL, MockClient);
    expect(client).toBeDefined();
    expect(client instanceof MockClient).toBe(true);
  });

  it('should return the same instance for the same URL (singleton)', () => {
    const client1 = createClient(TEST_DB_URL, MockClient);
    const client2 = createClient(TEST_DB_URL, MockClient);
    expect(client1).toBe(client2);
  });

  it('should return different instances for different URLs', () => {
    const client1 = createClient(TEST_DB_URL, MockClient);
    const client2 = createClient(TEST_DB_URL + '?schema=other', MockClient);
    expect(client1).not.toBe(client2);
  });
});

describe('checkHealth', () => {
  it('should return true for a healthy database', async () => {
    const client = createClient(TEST_DB_URL, MockClient);
    const healthy = await checkHealth(client);
    expect(healthy).toBe(true);
  });
});

describe('disconnect', () => {
  it('should disconnect a client and remove it from cache', async () => {
    const client = createClient(TEST_DB_URL, MockClient);
    await disconnect(client);

    // After disconnect, creating again should return a new instance
    const newClient = createClient(TEST_DB_URL, MockClient);
    expect(newClient).not.toBe(client);
  });
});

describe('disconnectAll', () => {
  it('should disconnect all cached clients', async () => {
    createClient(TEST_DB_URL, MockClient);
    createClient(TEST_DB_URL + '?schema=test', MockClient);

    await disconnectAll();

    // After disconnectAll, new clients should be created
    const fresh = createClient(TEST_DB_URL, MockClient);
    expect(fresh).toBeDefined();
  });
});
