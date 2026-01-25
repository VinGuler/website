type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private logs: Array<{ level: LogLevel; message: string; timestamp: Date }> = [];

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  info(message: string): void {
    const formatted = this.formatMessage('info', message);
    console.log(formatted);
    this.logs.push({ level: 'info', message, timestamp: new Date() });
  }

  warn(message: string): void {
    const formatted = this.formatMessage('warn', message);
    console.warn(formatted);
    this.logs.push({ level: 'warn', message, timestamp: new Date() });
  }

  error(message: string): void {
    const formatted = this.formatMessage('error', message);
    console.error(formatted);
    this.logs.push({ level: 'error', message, timestamp: new Date() });
  }

  debug(message: string): void {
    const formatted = this.formatMessage('debug', message);
    console.debug(formatted);
    this.logs.push({ level: 'debug', message, timestamp: new Date() });
  }

  getLogs(): Array<{ level: LogLevel; message: string; timestamp: Date }> {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new Logger();
