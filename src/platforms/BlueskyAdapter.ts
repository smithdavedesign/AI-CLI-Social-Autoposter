import axios from 'axios';
import { retry } from '../utils/retry.js';
import logger from '../logger/logger.js';
import type { PlatformAdapter } from './PlatformAdapter.js';

const BASE = 'https://bsky.social/xrpc';

export class BlueskyAdapter implements PlatformAdapter {
  readonly name = 'bluesky';
  readonly rateLimitDelayMs = 2000;

  private accessJwt: string | null = null;
  private did: string | null = null;

  constructor(
    private readonly handle: string,
    private readonly appPassword: string
  ) {}

  private async connect(): Promise<void> {
    if (this.accessJwt && this.did) return;

    const response = await axios.post(
      `${BASE}/com.atproto.server.createSession`,
      { identifier: this.handle, password: this.appPassword },
      { validateStatus: () => true }
    );

    if (response.status !== 200) {
      throw new Error(`Bluesky auth failed: ${response.status}`);
    }

    this.accessJwt = response.data.accessJwt as string;
    this.did = response.data.did as string;
  }

  async post(content: string): Promise<void> {
    await this.connect();

    await retry(async () => {
      let status: number;
      try {
        const response = await axios.post(
          `${BASE}/com.atproto.repo.createRecord`,
          {
            repo: this.did,
            collection: 'app.bsky.feed.post',
            record: {
              $type: 'app.bsky.feed.post',
              text: content,
              createdAt: new Date().toISOString(),
            },
          },
          {
            headers: { Authorization: `Bearer ${this.accessJwt}` },
            validateStatus: () => true,
          }
        );
        status = response.status;
      } catch (err) {
        throw new Error(`Bluesky request failed: ${err instanceof Error ? err.message : String(err)}`);
      }

      if (status !== 200) {
        throw new Error(`Bluesky API error: ${status}`);
      }
    });

    logger.info('posted to bluesky');
    await new Promise((r) => setTimeout(r, this.rateLimitDelayMs));
  }
}
