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
          'https://api.linkedin.com/rest/posts',
          {
            author: this.personUrn,
            commentary: content,
            visibility: 'PUBLIC',
            distribution: {
              feedDistribution: 'MAIN_FEED',
              targetEntities: [],
              thirdPartyDistributionChannels: [],
            },
            lifecycleState: 'PUBLISHED',
            isReshareDisabledByAuthor: false,
          },
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
              'X-Restli-Protocol-Version': '2.0.0',
              'LinkedIn-Version': '202504',
            },
            validateStatus: () => true,
          }
        );
        status = response.status;
        if (status !== 201) {
          logger.info(`LinkedIn error body: ${JSON.stringify(response.data)}`);
        }
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
