/**
 * Simple log utility for the website monorepo.
 * Prefixes messages with a timestamp and the source identifier.
 */
export function log(source: string, message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${source}] ${message}`);
}
