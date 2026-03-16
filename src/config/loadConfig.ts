import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import type { AppConfig } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

export function loadConfig(): AppConfig {
  const raw = yaml.load(readFileSync(join(ROOT, 'config.yaml'), 'utf8')) as Record<string, unknown>;

  if (!raw.platforms || !raw.tone || !raw.topic || raw.max_posts_per_day === undefined) {
    throw new Error('config.yaml is missing required fields: platforms, tone, topic, max_posts_per_day');
  }

  return raw as unknown as AppConfig;
}

export function loadPersona(): string {
  try {
    return readFileSync(join(ROOT, 'persona.md'), 'utf8').trim();
  } catch {
    return [
      'Write a casual technical thought-leadership post.',
      'Voice: thoughtful developer, curious, observational, not preachy, not salesy.',
      'Style: short paragraphs, casual tone, imperfect grammar allowed, occasionally ask a question, avoid corporate buzzwords, avoid hype.',
      'Topics: AI tooling, agents, infrastructure, developer workflows, automation.',
      'Max length: 150 words.',
      'Always open with a curiosity hook — e.g. "been wondering about this lately", "not sure if anyone else is seeing this".',
    ].join('\n');
  }
}
