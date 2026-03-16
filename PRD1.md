# PRD: AI CLI Social Autoposter

## 1. Overview

**Product Name:** SocialAgent CLI
**Type:** Server-side CLI automation tool
**Purpose:** Automatically generate and post social media content once every 24 hours using an LLM and platform APIs.

The system runs as a **cron-scheduled CLI program** that:

1. Generates a social media post using an LLM.
2. Adapts the post to each platform.
3. Posts to configured platforms.
4. Logs success/failure.

No UI is required. All configuration happens through **environment variables and CLI config files**.

---

# 2. Goals

### Primary Goal

Enable fully automated **daily AI-generated posts** to multiple platforms using a CLI tool.

### Secondary Goals

* Extremely simple architecture
* Platform modularity
* Agent-style "skills"
* Runs on cheap infrastructure ($5 server)
* Fully headless operation

---

# 3. Non-Goals

The first version will NOT include:

* Web dashboard
* Analytics
* Multi-user accounts
* Scheduling UI
* Media generation
* Post approval workflows

These can be added later.

---

# 4. Target Platforms

Initial integrations:

* LinkedIn
* Twitter/X
* Facebook

Future integrations:

* Instagram
* Reddit
* Mastodon

---

# 5. User Personas

### Indie Developer

Wants to grow social presence automatically.

### Founder

Wants automated thought leadership posts.

### Content Marketer

Wants automated daily brand presence.

---

# 6. System Architecture

### High Level

```
cron
 ↓
social-agent run
 ↓
generate post
 ↓
platform adapters
 ↓
API post requests
 ↓
logs
```

---

### Components

```
/social-agent
  /skills
    linkedin_post.sh
    twitter_post.sh
    facebook_post.sh

  /llm
    generate_post.py

  /core
    orchestrator.py
    formatter.py

  config.yaml
  tokens.json
```

---

# 7. CLI Commands

### Main Command

```
social-agent run
```

Runs full pipeline.

---

### Generate Content

```
social-agent generate
```

Outputs generated post to stdout.

---

### Post to Platform

```
social-agent post linkedin
social-agent post twitter
social-agent post facebook
```

---

### Dry Run

```
social-agent run --dry-run
```

No posting occurs.

---

# 8. Agent Pipeline

### Step 1 — Topic Generation

Prompt example:

```
Generate a short professional social media idea
for a tech founder discussing AI or startups.
```

---

### Step 2 — Post Generation

Example prompt:

```
Write a professional LinkedIn post.

Constraints:
- thoughtful
- engaging
- under 250 words
- no emojis
```

---

### Step 3 — Platform Formatting

Content is adapted per platform.

| Platform  | Rule           |
| --------- | -------------- |
| LinkedIn  | full post      |
| Twitter/X | 280 characters |
| Facebook  | full post      |

---

### Step 4 — Posting

Each platform skill executes an API request.

---

# 9. LLM Requirements

The LLM must support:

* Short text generation
* <1000 tokens/day usage

### Option 1 (Recommended Free Option)

Run a local model using Ollama.

Model options:

* Llama 3
* Mistral

Advantages:

* Free
* Unlimited tokens
* Local inference
* No API costs

---

### Option 2 (Low Cost Cloud)

Use a small hosted LLM.

Estimated daily tokens:

```
500–1500 tokens/day
```

Estimated monthly cost:

```
$1–5
```

---

# 10. Cron Scheduling

Cron job runs every 24 hours.

Example:

```
0 9 * * * /usr/local/bin/social-agent run
```

Post time: 9AM server time.

---

# 11. Configuration

### config.yaml

```
platforms:
  linkedin: true
  twitter: true
  facebook: false

tone: professional
topic: ai startups

max_posts_per_day: 1
```

---

### tokens.json

```
{
 "linkedin": "ACCESS_TOKEN",
 "twitter": "ACCESS_TOKEN",
 "facebook": "ACCESS_TOKEN"
}
```

---

# 12. Logging

Logs written to:

```
logs/social-agent.log
```

Example log:

```
2026-03-15 09:00:02 generating post
2026-03-15 09:00:04 post generated
2026-03-15 09:00:05 posting to linkedin
2026-03-15 09:00:06 success
2026-03-15 09:00:07 posting to twitter
2026-03-15 09:00:08 success
```

---

# 13. Error Handling

Failures should:

* Log error
* Retry once
* Continue to next platform

Example configuration:

```
retry_delay = 5 seconds
max_retries = 1
```

---

# 14. Security

Tokens stored with restricted permissions:

```
chmod 600 tokens.json
```

Tokens must never be written to logs.

---

# 15. Rate Limiting

Platform safety delays:

| Platform  | Delay     |
| --------- | --------- |
| LinkedIn  | 5 seconds |
| Twitter/X | 2 seconds |
| Facebook  | 2 seconds |

---

# 16. MVP Scope

MVP should support:

* CLI runner
* Cron automation
* AI post generation
* LinkedIn posting
* Twitter posting
* Logging

Estimated development time:

```
8–12 hours
```

---

# 17. Future Enhancements

### Content Intelligence

Automatically discover trending topics.

### Image Generation

Add AI-generated images using Stable Diffusion.

### Analytics

Track engagement metrics.

### Smart Scheduling

Post at optimal engagement times.

---

# 18. Success Metrics

System is successful if:

* Runs daily without failure
* Posts appear on platforms
* Generation cost < $5/month

---

# 19. Risks

### API Restrictions

Some platforms restrict aggressive automation.

### Token Expiration

OAuth tokens may require refresh.

### Spam Detection

Posting frequency must remain low.

---

# 20. MVP Timeline

| Day   | Task                 |
| ----- | -------------------- |
| Day 1 | CLI + LLM generation |
| Day 1 | LinkedIn integration |
| Day 2 | Twitter integration  |
| Day 2 | Cron + logging       |

---

# 21. Final Deliverable

A CLI tool capable of running:

```
social-agent run
```

This command should:

1. Generate a social media post
2. Format it per platform
3. Post to configured platforms
4. Log the results

All automatically on a **24-hour cron schedule**.
