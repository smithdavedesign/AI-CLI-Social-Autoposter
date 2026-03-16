import logger from '../logger/logger.js';

export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 1,
  delayMs = 5000
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (maxRetries <= 0) throw err;
    const message = err instanceof Error ? err.message : String(err);
    logger.info(`retrying after error: ${message}`);
    await new Promise((r) => setTimeout(r, delayMs));
    return retry(fn, maxRetries - 1, delayMs);
  }
}
