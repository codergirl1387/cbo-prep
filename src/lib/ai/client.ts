import Anthropic from '@anthropic-ai/sdk';

declare global {
  // eslint-disable-next-line no-var
  var __anthropicClient: Anthropic | undefined;
}

export const anthropic: Anthropic =
  global.__anthropicClient ??
  (global.__anthropicClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  }));
