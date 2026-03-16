import 'dotenv/config';
import type { Env } from '../types/index.js';
import { loadConfig } from './loadConfig.js';

export function loadEnv(): Env {
  const config = loadConfig();

  const required: (keyof Env)[] = ['ANTHROPIC_API_KEY'];

  if (config.platforms.linkedin) {
    required.push('LINKEDIN_ACCESS_TOKEN', 'LINKEDIN_PERSON_URN');
  }
  if (config.platforms.bluesky) {
    required.push('BLUESKY_HANDLE', 'BLUESKY_APP_PASSWORD');
  }

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
    LINKEDIN_ACCESS_TOKEN: process.env.LINKEDIN_ACCESS_TOKEN ?? '',
    LINKEDIN_PERSON_URN: process.env.LINKEDIN_PERSON_URN ?? '',
    BLUESKY_HANDLE: process.env.BLUESKY_HANDLE ?? '',
    BLUESKY_APP_PASSWORD: process.env.BLUESKY_APP_PASSWORD ?? '',
  };
}
