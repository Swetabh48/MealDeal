/**
 * Public diet generation entrypoint.
 * Uses dual pipeline: Gemini + rules engine + validator + recipe enrichment.
 */
import { generateDietPlanDual } from './diet/pipeline';
import type { UserDietProfile } from './diet/types';

export type { UserDietProfile as UserProfile } from './diet/types';

export async function generateDietPlan(userProfile: UserDietProfile) {
  try {
    return await generateDietPlanDual(userProfile);
  } catch (error: any) {
    console.error('❌ Error generating diet plan:', error);

    if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY in .env.local.');
    } else if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      // Dual pipeline should usually survive via rules path; surface only if total failure
      throw new Error('Gemini API quota exceeded and fallback failed. Please retry shortly.');
    } else if (error.message?.includes('rate limit') || error.message?.includes('RATE_LIMIT')) {
      throw new Error('Too many requests. Please wait 1–2 minutes and try again.');
    } else if (error.message?.includes('parse') || error.message?.includes('JSON')) {
      throw new Error('Failed to parse AI response. Please try generating the plan again.');
    } else if (error.message?.includes('SAFETY') || error.message?.includes('block')) {
      throw new Error('Content was blocked by safety filters. Please try again with different input.');
    }

    throw new Error(`Failed to generate diet plan: ${error.message || 'Unknown error'}`);
  }
}
