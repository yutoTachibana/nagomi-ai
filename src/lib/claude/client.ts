import Anthropic from '@anthropic-ai/sdk';

let cached: Anthropic | null = null;

export function getAnthropic() {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  cached = new Anthropic({ apiKey });
  return cached;
}

/**
 * 使用モデル. 環境変数で上書き可能だが、CLAUDE.md で claude-sonnet-4-6 を推奨.
 */
export function getModel(): string {
  return process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
}
