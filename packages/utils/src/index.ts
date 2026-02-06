/**
 * Simple log utility for the website monorepo.
 * Prefixes messages with a timestamp and the source identifier.
 */
export function log(
  level: 'debug' | 'info' | 'warn' | 'error',
  source: string,
  message: string
): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] [${source}] ${message}`);
}
