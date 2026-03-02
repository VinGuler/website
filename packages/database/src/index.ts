import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/** Minimal interface for any PrismaClient instance (base or app-specific). */
export interface PrismaClientLike {
  $queryRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
  $disconnect: () => Promise<void>;
}

/**
 * Loads the base database URL from environment variables.
 * The base URL contains host, port, user, and password but no database name.
 * Falls back to the DATABASE_URL environment variable.
 */
export function loadBaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
        'Set it in packages/database/.env or in your environment.'
    );
  }
  return url;
}

/**
 * Builds a full database connection URL by appending the database name
 * to the base connection string.
 *
 * @param dbName - The database name (e.g., "client_server_database_db")
 * @param baseUrl - Optional base URL override. Defaults to DATABASE_URL env var.
 * @returns Full PostgreSQL connection string
 */
export function getDatabaseUrl(dbName: string, baseUrl?: string): string {
  const base = baseUrl ?? loadBaseUrl();
  // Strip trailing slash if present, then append database name
  const cleanBase = base.replace(/\/+$/, '');
  return `${cleanBase}/${dbName}`;
}

// Store client instances per database URL for singleton pattern
 
const clients = new Map<string, any>();

/**
 * Creates or retrieves a singleton PrismaClient for the given database URL.
 * Uses the Prisma PostgreSQL driver adapter (Prisma 7+).
 *
 * Pass an app-specific PrismaClient class (generated with a custom `output` path)
 * to get full model type safety. When omitted, falls back to the base @prisma/client.
 *
 * @param databaseUrl - Full PostgreSQL connection string including database name
 * @param ClientClass - Optional app-specific PrismaClient constructor
 * @returns A PrismaClient instance
 */
export function createClient<T extends PrismaClientLike = PrismaClient>(
  databaseUrl: string,
   
  ClientClass?: new (opts: any) => T
): T {
  const existing = clients.get(databaseUrl);
  if (existing) {
    return existing as T;
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const Cls = ClientClass ?? PrismaClient;
  const client = new Cls({ adapter });

  clients.set(databaseUrl, client);
  return client as T;
}

/**
 * Disconnects a specific PrismaClient and removes it from the singleton cache.
 *
 * @param client - The PrismaClient instance to disconnect
 */
export async function disconnect(client: PrismaClientLike): Promise<void> {
  await client.$disconnect();

  for (const [url, cached] of clients.entries()) {
    if (cached === client) {
      clients.delete(url);
      break;
    }
  }
}

/**
 * Disconnects all cached PrismaClient instances.
 * Useful for graceful shutdown.
 */
export async function disconnectAll(): Promise<void> {
  const promises = Array.from(clients.values()).map((client: PrismaClientLike) =>
    client.$disconnect()
  );
  await Promise.all(promises);
  clients.clear();
}

/**
 * Checks if the database is reachable by executing a simple query.
 *
 * @param client - The PrismaClient instance to check
 * @returns true if the database is reachable, false otherwise
 */
export async function checkHealth(client: PrismaClientLike): Promise<boolean> {
  try {
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears all cached client instances without disconnecting.
 * Useful for testing to reset state between tests.
 */
export function clearClientCache(): void {
  clients.clear();
}

// Re-export PrismaClient type for convenience
export { PrismaClient };
// Re-export adapter for apps that create their own client
export { PrismaPg };
