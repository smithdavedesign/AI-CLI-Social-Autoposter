import { getClient, MODEL } from './client.js';
import { loadPersona } from '../config/loadConfig.js';
import type { AppConfig } from '../types/index.js';

export async function generateTopic(config: AppConfig): Promise<string> {
  const client = getClient();
  const persona = loadPersona();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 100,
    system: persona,
    messages: [
      {
        role: 'user',
        content: `Give me one specific topic idea for a post. The topic must relate to: ${config.topic}. Reply with just the topic idea — one sentence, no explanation.`,
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected LLM response type');
  return block.text.trim();
}
