import Anthropic from '@anthropic-ai/sdk'

export const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export const AI_MODEL   = 'claude-3-5-sonnet-20241022' // updated to modern sonnet key
export const MAX_TOKENS = 2048
