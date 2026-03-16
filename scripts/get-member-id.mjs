#!/usr/bin/env node
/**
 * Finds the LinkedIn member ID associated with your current access token.
 * Run: node scripts/get-member-id.mjs
 * Requires: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_ACCESS_TOKEN in .env
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
const env = {};
readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const { LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_ACCESS_TOKEN } = env;

if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET || !LINKEDIN_ACCESS_TOKEN) {
  console.error('Missing LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, or LINKEDIN_ACCESS_TOKEN in .env');
  process.exit(1);
}

// Try introspection
const introRes = await fetch('https://www.linkedin.com/oauth/v2/introspectToken', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    token: LINKEDIN_ACCESS_TOKEN,
    client_id: LINKEDIN_CLIENT_ID,
    client_secret: LINKEDIN_CLIENT_SECRET,
  }).toString(),
});
const introData = await introRes.json();
console.log('\nIntrospection:', JSON.stringify(introData, null, 2));

// Try userinfo
const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
  headers: { Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}` },
});
const userData = await userRes.json();
console.log('\nUserinfo:', JSON.stringify(userData, null, 2));

// Try /v2/me with version header
const meRes = await fetch('https://api.linkedin.com/v2/me', {
  headers: {
    Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
    'LinkedIn-Version': '202504',
    'X-Restli-Protocol-Version': '2.0.0',
  },
});
const meData = await meRes.json();
console.log('\n/v2/me:', JSON.stringify(meData, null, 2));
