import Anthropic from '@anthropic-ai/sdk';
import { loadEnv } from '../config/loadEnv.js';

let _client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!_client) {
    const env = loadEnv();
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export const MODEL = 'claude-haiku-4-5-20251001';
