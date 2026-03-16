#!/usr/bin/env node
/**
 * LinkedIn OAuth token fetcher.
 * Run: node scripts/get-linkedin-token.mjs
 * Requires: LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in .env
 */

import http from 'http';
import { exec } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env manually (no dotenv needed)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
const env = {};
try {
  readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) env[key.trim()] = rest.join('=').trim();
  });
} catch {
  console.error('.env file not found — create one with LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET');
  process.exit(1);
}

const CLIENT_ID = env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPE = 'w_member_social w_organization_social';
const STATE = Math.random().toString(36).slice(2);

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to your .env file');
  process.exit(1);
}

const authUrl =
  `https://www.linkedin.com/oauth/v2/authorization` +
  `?response_type=code` +
  `&client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${encodeURIComponent(SCOPE)}` +
  `&state=${STATE}`;

// Start local server to catch the callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');
  if (url.pathname !== '/callback') return;

  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    res.end(`<h2>Error: ${error}</h2><p>${url.searchParams.get('error_description')}</p>`);
    server.close();
    process.exit(1);
  }

  if (returnedState !== STATE) {
    res.end('<h2>State mismatch — possible CSRF. Try again.</h2>');
    server.close();
    process.exit(1);
  }

  // Exchange code for token
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await tokenRes.json();

  if (!data.access_token) {
    console.error('Token exchange failed:', JSON.stringify(data));
    console.error('client_id:', CLIENT_ID);
    console.error('client_secret length:', CLIENT_SECRET?.length);
    res.end(`<h2>Token exchange failed</h2><pre>${JSON.stringify(data, null, 2)}</pre>`);
    server.close();
    return;
  }

  // Fetch person URN using versioned API
  const meRes = await fetch('https://api.linkedin.com/v2/me', {
    headers: {
      Authorization: `Bearer ${data.access_token}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202304',
    },
  });
  const me = await meRes.json();
  console.log('LinkedIn /v2/me response:', JSON.stringify(me));
  const personId = me.id || me.sub;
  const personUrn = personId ? `urn:li:person:${personId}` : 'COULD_NOT_FETCH_SEE_TERMINAL';

  res.end(`
    <h2>Success!</h2>
    <p>Add these to your <code>.env</code> file:</p>
    <pre>
LINKEDIN_ACCESS_TOKEN=${data.access_token}
LINKEDIN_PERSON_URN=${personUrn}
    </pre>
    <p>Token expires in ${Math.round(data.expires_in / 86400)} days.</p>
    <p>You can close this window.</p>
  `);

  console.log('\n✓ Got your LinkedIn credentials:\n');
  console.log(`LINKEDIN_ACCESS_TOKEN=${data.access_token}`);
  console.log(`LINKEDIN_PERSON_URN=${personUrn}`);
  console.log('\nCopy these into your .env file.\n');

  server.close();
});

server.listen(3000, () => {
  console.log('Opening LinkedIn authorization in your browser...');
  console.log('If it does not open, visit:\n', authUrl);

  // Open browser
  const cmd = process.platform === 'darwin' ? `open "${authUrl}"` : `xdg-open "${authUrl}"`;
  exec(cmd);
});
