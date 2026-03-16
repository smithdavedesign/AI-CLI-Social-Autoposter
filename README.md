# AI CLI Social Autoposter

A personal CLI tool that generates and posts AI-written content to LinkedIn and Bluesky on a schedule. Built with TypeScript, powered by Claude Haiku.

Posts are generated in your own voice using a persona file — not generic AI slop.

## How it works

1. Claude generates a topic based on your configured interests
2. Claude writes a post in your persona voice
3. The post is formatted for each platform and published
4. A Bluesky-length summary is generated separately (under 290 chars)

Two Claude API calls per run. Total cost: ~$0.001 per post.

## Stack

- TypeScript + Node.js
- Anthropic SDK (claude-haiku-4-5)
- Axios for platform API calls
- Winston for logging
- GitHub Actions for scheduling

## Setup

### 1. Install

```bash
npm install
npm run build
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `BLUESKY_HANDLE` | e.g. `yourname.bsky.social` |
| `BLUESKY_APP_PASSWORD` | Settings → App Passwords in bsky.app |
| `LINKEDIN_ACCESS_TOKEN` | See LinkedIn setup below |
| `LINKEDIN_PERSON_URN` | e.g. `urn:li:person:ABC123` |

### 3. Configure persona and topics

Edit `persona.md` to define your voice, beliefs, and style rules.

Edit `config.yaml` to set platforms, tone, and topics:

```yaml
platforms:
  linkedin: false   # requires OIDC approval — see below
  bluesky: true

tone: thoughtful and professional
topic: AI tooling, agents, infrastructure, developer workflows, automation
```

### 4. Run

```bash
# Dry run — generates posts, prints to console, does not publish
node dist/index.js run --dry-run

# Live run
node dist/index.js run
```

## Scheduling

Posts automatically via GitHub Actions — 5x per week at varied times with a random 0–45 min delay per run.

Add your keys as GitHub Secrets (Settings → Secrets and variables → Actions):

- `ANTHROPIC_API_KEY`
- `BLUESKY_HANDLE`
- `BLUESKY_APP_PASSWORD`
- `LINKEDIN_ACCESS_TOKEN`
- `LINKEDIN_PERSON_URN`

Trigger a manual run anytime: **Actions → Social Post → Run workflow**

## LinkedIn setup

LinkedIn's API requires the **Sign In with LinkedIn using OpenID Connect** product to post as a personal member via the `/rest/posts` endpoint. This requires LinkedIn approval.

Until approved:
1. Set `linkedin: false` in `config.yaml`
2. Use the helper script to get an access token when ready: `node scripts/get-linkedin-token.mjs`
3. Your Person URN can be found in your LinkedIn profile page source — search for `urn:li:member:`

## Project structure

```
src/
  config/       # env and config loaders
  llm/          # Claude client, topic + post generators
  platforms/    # LinkedIn and Bluesky adapters
  formatters/   # platform-specific post formatting
  cache/        # prevents duplicate posts
  orchestrator/ # pipeline runner
  logger/       # Winston logger with token redaction
  utils/        # retry logic
scripts/
  get-linkedin-token.mjs   # OAuth helper for LinkedIn token
.github/workflows/
  post.yml      # GitHub Actions scheduler
persona.md      # your voice and style rules
config.yaml     # platform and topic config
```

## Logs

Logs are written to `logs/social-agent.log`. Sensitive tokens are redacted automatically.
