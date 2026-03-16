import { loadConfig } from '../config/loadConfig.js';
import { loadEnv } from '../config/loadEnv.js';
import { generateTopic } from '../llm/topicGenerator.js';
import { generatePost } from '../llm/postGenerator.js';
import { formatLinkedIn } from '../formatters/linkedinFormatter.js';
import { formatBluesky } from '../formatters/blueskyFormatter.js';
import { savePost } from '../cache/postCache.js';
import { LinkedInAdapter } from '../platforms/LinkedInAdapter.js';
import { BlueskyAdapter } from '../platforms/BlueskyAdapter.js';
import logger from '../logger/logger.js';
import type { GeneratedContent, PlatformAdapter } from '../types/index.js';

export async function runPipeline(dryRun: boolean): Promise<void> {
  const config = loadConfig();
  const env = loadEnv();

  logger.info('generating topic');
  const topic = await generateTopic(config);
  logger.info(`topic: ${topic}`);

  logger.info('generating post');
  const { linkedinPost, blueskyPost } = await generatePost(topic, config);

  const formattedLinkedin = formatLinkedIn(linkedinPost);
  const formattedBluesky = formatBluesky(blueskyPost);

  const content: GeneratedContent = {
    topic,
    linkedinPost: formattedLinkedin,
    blueskyPost: formattedBluesky,
    generatedAt: new Date().toISOString(),
  };

  savePost(content);
  logger.info('post generated and cached');

  if (dryRun) {
    logger.info('dry-run mode — skipping post');
    console.log('\n--- LinkedIn ---\n');
    console.log(formattedLinkedin);
    console.log('\n--- Bluesky ---\n');
    console.log(formattedBluesky);
    return;
  }

  const adapters: PlatformAdapter[] = [];
  if (config.platforms.linkedin) {
    adapters.push(new LinkedInAdapter(env.LINKEDIN_ACCESS_TOKEN, env.LINKEDIN_PERSON_URN));
  }
  if (config.platforms.bluesky) {
    adapters.push(new BlueskyAdapter(env.BLUESKY_HANDLE, env.BLUESKY_APP_PASSWORD));
  }

  if (adapters.length === 0) {
    logger.info('no platforms enabled — nothing to post');
    return;
  }

  for (const adapter of adapters) {
    const postContent = adapter.name === 'linkedin' ? formattedLinkedin : formattedBluesky;
    logger.info(`posting to ${adapter.name}`);
    try {
      await adapter.post(postContent);
      logger.info(`${adapter.name} success`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`${adapter.name} failed: ${message}`);
    }
  }
}
