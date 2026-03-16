import axios from 'axios';
import { retry } from '../utils/retry.js';
import logger from '../logger/logger.js';
import type { PlatformAdapter } from './PlatformAdapter.js';

export class LinkedInAdapter implements PlatformAdapter {
  readonly name = 'linkedin';
  readonly rateLimitDelayMs = 5000;

  constructor(
    private readonly accessToken: string,
    private readonly personUrn: string
  ) {}

  async post(content: string): Promise<void> {
    await retry(async () => {
      let status: number;
      try {
        const response = await axios.post(
          'https://api.linkedin.com/v2/ugcPosts',
          {
            author: this.personUrn,
            lifecycleState: 'PUBLISHED',
            specificContent: {
              'com.linkedin.ugc.ShareContent': {
                shareCommentary: { text: content, attributes: [] },
                shareMediaCategory: 'NONE',
                media: [],
              },
            },
            visibility: {
              'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
              'X-Restli-Protocol-Version': '2.0.0',
            },
            validateStatus: () => true, // handle all status codes manually
          }
        );
        status = response.status;
      } catch (err) {
        throw new Error(`LinkedIn request failed: ${err instanceof Error ? err.message : String(err)}`);
      }

      if (status !== 201) {
        throw new Error(`LinkedIn API error: ${status}`);
      }
    });

    logger.info('posted to linkedin');
    await new Promise((r) => setTimeout(r, this.rateLimitDelayMs));
  }
}
