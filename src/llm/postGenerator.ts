import { getClient, MODEL } from './client.js';
import { loadPersona } from '../config/loadConfig.js';
import type { AppConfig } from '../types/index.js';

export async function generatePost(
  topic: string,
  config: AppConfig
): Promise<{ linkedinPost: string; blueskyPost: string }> {
  const client = getClient();
  const persona = loadPersona();

  // Call A: Full LinkedIn post
  const linkedinResponse = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: persona,
    messages: [
      {
        role: 'user',
        content: `Write a post about this topic: "${topic}"\n\nTone: ${config.tone}\nMax length: 150 words\n\nAt the end of the post, add 3-5 relevant hashtags on a new line. Choose from topics like: #AI #AIAgents #LLM #DevTools #DeveloperExperience #MLOps #Automation #SoftwareEngineering #EngineeringLeadership #TechLeadership #GenerativeAI — pick only the ones that genuinely fit the post.\n\nOutput only the post text and hashtags — no title, no label, no explanation.`,
      },
    ],
  });

  const linkedinBlock = linkedinResponse.content[0];
  if (linkedinBlock.type !== 'text') throw new Error('Unexpected LLM response type for LinkedIn post');
  const linkedinPost = linkedinBlock.text.trim();

  // Call B: Bluesky summary (under 290 chars, keep the hook)
  const blueskyResponse = await client.messages.create({
    model: MODEL,
    max_tokens: 100,
    system: persona,
    messages: [
      {
        role: 'user',
        content: `Distill this post into one punchy sentence under 290 characters. Keep the curiosity hook if there is one. Output only the sentence.\n\nPost:\n${linkedinPost}`,
      },
    ],
  });

  const blueskyBlock = blueskyResponse.content[0];
  if (blueskyBlock.type !== 'text') throw new Error('Unexpected LLM response type for Bluesky post');
  const blueskyPost = blueskyBlock.text.trim();

  return { linkedinPost, blueskyPost };
}
