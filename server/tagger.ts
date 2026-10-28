import Anthropic from '@anthropic-ai/sdk';
import { CATEGORIES, COLORS, PATTERNS, SEASONS, type Tags } from '../shared/types';
import { cleanTags } from './tags';

const MODEL = 'claude-haiku-5-5';

const PROMPT = `You are tagging one item from a person's wardrobe for an outfit planner.
Reply with ONLY a JSON object with these keys:
- name: short plain description, e.g. "navy chore jacket"
- category: one of ${CATEGORIES.join(', ')}
- colors: 1-2 of ${COLORS.join(', ')}, dominant first
- pattern: one of ${PATTERNS.join(', ')}
- formality: integer from 1 (loungewear) to 5 (formal)
- seasons: any of ${SEASONS.join(', ')} that the item suits`;

// Without an API key the app still works: items just arrive untagged and get edited by hand.
export async function tagPhoto(jpeg: Buffer): Promise<Partial<Tags>> {
  if (!process.env.ANTHROPIC_API_KEY) return {};

  const response = await new Anthropic().messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: jpeg.toString('base64') } },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  });

  const text = response.content.map((block) => (block.type === 'text' ? block.text : '')).join('');
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  return json ? cleanTags(JSON.parse(json)) : {};
}
