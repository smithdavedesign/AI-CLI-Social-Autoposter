#!/usr/bin/env node
import { Command } from 'commander';
import { runPipeline } from './orchestrator/runPipeline.js';
import { generateTopic } from './llm/topicGenerator.js';
import { generatePost } from './llm/postGenerator.js';
import { formatLinkedIn } from './formatters/linkedinFormatter.js';
import { formatBluesky } from './formatters/blueskyFormatter.js';
import { savePost, loadLastPost } from './cache/postCache.js';
import { loadConfig } from './config/loadConfig.js';
import { loadEnv } from './config/loadEnv.js';
import { LinkedInAdapter } from './platforms/LinkedInAdapter.js';
import { BlueskyAdapter } from './platforms/BlueskyAdapter.js';
import logger from './logger/logger.js';

const program = new Command();

program
  .name('social-agent')
  .description('AI-powered daily social media poster')
  .version('0.1.0');

program
  .command('run')
  .description('Run the full pipeline: generate and post to all enabled platforms')
  .option('--dry-run', 'Generate post but do not publish')
  .action(async (opts: { dryRun?: boolean }) => {
    await runPipeline(opts.dryRun ?? false);
  });

program
  .command('generate')
  .description('Generate a post and print to stdout (saves to cache)')
  .action(async () => {
    const config = loadConfig();
    const topic = await generateTopic(config);
    const { linkedinPost, blueskyPost } = await generatePost(topic, config);
    const formattedLinkedin = formatLinkedIn(linkedinPost);
    const formattedBluesky = formatBluesky(blueskyPost);
    savePost({ topic, linkedinPost: formattedLinkedin, blueskyPost: formattedBluesky, generatedAt: new Date().toISOString() });
    console.log('\n--- LinkedIn ---\n');
    console.log(formattedLinkedin);
    console.log('\n--- Bluesky ---\n');
    console.log(formattedBluesky);
  });

program
  .command('post <platform>')
  .description('Post the cached last-generated content to a specific platform (linkedin|bluesky)')
  .action(async (platform: string) => {
    const cached = loadLastPost();
    if (!cached) {
      console.error('No cached post found. Run `social-agent generate` first.');
      process.exit(1);
    }
    const env = loadEnv();

    if (platform === 'linkedin') {
      const adapter = new LinkedInAdapter(env.LINKEDIN_ACCESS_TOKEN, env.LINKEDIN_PERSON_URN);
      logger.info('posting to linkedin');
      await adapter.post(cached.linkedinPost);
      logger.info('linkedin success');
    } else if (platform === 'bluesky') {
      const adapter = new BlueskyAdapter(env.BLUESKY_HANDLE, env.BLUESKY_APP_PASSWORD);
      logger.info('posting to bluesky');
      await adapter.post(cached.blueskyPost);
      logger.info('bluesky success');
    } else {
      console.error(`Unknown platform: ${platform}. Use "linkedin" or "bluesky".`);
      process.exit(1);
    }
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error(message);
  process.exit(1);
});
