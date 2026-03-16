import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { GeneratedContent, PostCache } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '..', '..', '.cache');
const CACHE_FILE = join(CACHE_DIR, 'last-post.json');

export function savePost(content: GeneratedContent): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  const cache: PostCache = { generatedContent: content, cachedAt: new Date().toISOString() };
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

export function loadLastPost(): GeneratedContent | null {
  try {
    const raw = readFileSync(CACHE_FILE, 'utf8');
    const cache = JSON.parse(raw) as PostCache;
    return cache.generatedContent;
  } catch {
    return null;
  }
}
