import { createLogger, format, transports } from 'winston';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const logsDir = join(__dirname, '..', '..', 'logs');

mkdirSync(logsDir, { recursive: true });

function redactTokens(message: string): string {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/g, 'Bearer [REDACTED]')
    .replace(/(ACCESS_TOKEN|APP_PASSWORD|API_KEY)\s*[:=]\s*\S+/gi, '$1=[REDACTED]');
}

const redactFormat = format((info) => {
  if (typeof info.message === 'string') {
    info.message = redactTokens(info.message);
  }
  return info;
});

const logger = createLogger({
  level: 'info',
  format: format.combine(
    redactFormat(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: join(logsDir, 'social-agent.log') }),
  ],
});

export default logger;
