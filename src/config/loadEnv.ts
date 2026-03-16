import 'dotenv/config';
import type { Env } from '../types/index.js';

const REQUIRED: (keyof Env)[] = [
  'ANTHROPIC_API_KEY',
  'LINKEDIN_ACCESS_TOKEN',
  'LINKEDIN_PERSON_URN',
  'BLUESKY_HANDLE',
  'BLUESKY_APP_PASSWORD',
];

export function loadEnv(): Env {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  return {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
    LINKEDIN_ACCESS_TOKEN: process.env.LINKEDIN_ACCESS_TOKEN!,
    LINKEDIN_PERSON_URN: process.env.LINKEDIN_PERSON_URN!,
    BLUESKY_HANDLE: process.env.BLUESKY_HANDLE!,
    BLUESKY_APP_PASSWORD: process.env.BLUESKY_APP_PASSWORD!,
  };
}
