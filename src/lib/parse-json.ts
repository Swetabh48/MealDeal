export function parseAIResponse(response: string): any {
  if (!response || typeof response !== 'string') {
    throw new Error('Invalid response: empty or not a string');
  }

  let cleaned = response.trim();

  // Remove markdown code blocks
  const codeBlockPatterns = [
    /^```json\s*/i,
    /^```javascript\s*/i,
    /^```js\s*/i,
    /^```\s*/,
  ];

  for (const pattern of codeBlockPatterns) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, '');
      cleaned = cleaned.replace(/\s*```\s*$/, '');
      break;
    }
  }

  cleaned = cleaned.trim();

  // Find JSON boundaries
  const jsonStartMatch = cleaned.match(/\{/);
  const jsonEndMatch = cleaned.match(/\}[^}]*$/);
  
  if (jsonStartMatch && jsonEndMatch) {
    const startIndex = jsonStartMatch.index!;
    const endIndex = jsonEndMatch.index! + 1;
    cleaned = cleaned.substring(startIndex, endIndex);
  }

  // Handle escape sequences
  cleaned = cleaned
    .replace(/\\n/g, '\\n')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');

  try {
    return JSON.parse(cleaned);
  } catch (firstError: any) {
    console.log('First parse attempt failed, trying fixes...');

    try {
      // Fix smart quotes and trailing commas
      const fixed = cleaned
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/([}\]])\s*,/g, '$1');

      return JSON.parse(fixed);
    } catch (secondError: any) {
      // Last resort: regex extraction
      try {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extracted = jsonMatch[0]
            .replace(/,(\s*[}\]])/g, '$1')
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2018\u2019]/g, "'");
          
          return JSON.parse(extracted);
        }
      } catch (thirdError) {
        console.error('Failed to parse AI response after all attempts');
        console.error('Original (first 500 chars):', response.substring(0, 500));
        console.error('Cleaned (first 500 chars):', cleaned.substring(0, 500));
        
        throw new Error(
          'Failed to parse AI response. The AI returned invalid JSON format. ' +
          'Please try again or contact support if the issue persists.'
        );
      }
    }

    throw new Error('Unable to parse AI response after multiple attempts');
  }
}

export function validateDietPlan(data: any): void {
  const requiredFields = ['dailyCalories', 'dailyProtein', 'dailyCarbs', 'dailyFats', 'weeklyPlan'];
  const missing = requiredFields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Invalid diet plan: missing ${missing.join(', ')}`);
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const missingDays = days.filter(day => !data.weeklyPlan[day]);
  
  if (missingDays.length > 0) {
    throw new Error(`Invalid diet plan: missing days ${missingDays.join(', ')}`);
  }
}

export function validateWorkoutPlan(data: any): void {
  if (!data.weeklySchedule) {
    throw new Error('Invalid workout plan: missing weeklySchedule');
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const missingDays = days.filter(day => !data.weeklySchedule[day]);
  
  if (missingDays.length > 0) {
    throw new Error(`Invalid workout plan: missing days ${missingDays.join(', ')}`);
  }
}