// src/app/api/extract-menu-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mimeType } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    console.log('📸 Extracting text from mess menu image...');
    console.log('Image MIME type:', mimeType);

     // Try different Gemini models with correct naming
    const modelsToTry = [
  'gemini-2.5-flash',          // Latest model for fast, capable tasks
  'gemini-2.5-pro',            // Latest model for complex reasoning
  'gemini-pro',                // General-purpose stable model
];
    
    let extractedText = '';
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = getGeminiModel(modelName);
        
        const prompt = `
You are analyzing a hostel mess menu. Please extract ALL text from this image with focus on:

1. **Meal timings** (e.g., Breakfast: 7:30-9:00 AM, Lunch: 12:30-2:00 PM)
2. **All food items** listed for each meal
3. **Day-wise variations** if the menu shows different meals for different days
4. **Any special notes** or meal descriptions
5. **Language if not english- extract and translate to English**

Format the output clearly as:

DAY: [Day Name]
BREAKFAST (Time): [List all breakfast items]
LUNCH (Time): [List all lunch items]  
DINNER (Time): [List all dinner items]
SNACKS (if any): [List snacks]

Be thorough and extract everything visible in the image. If you cannot read some text clearly, skip it rather than guessing.
`;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: image,
              mimeType: mimeType || 'image/jpeg',
            },
          },
        ]);

        const response = result.response;
        extractedText = response.text();
        
        // Validate extraction quality
        if (extractedText && extractedText.trim().length > 20) {
          console.log(`✅ Successfully extracted text using ${modelName}`);
          console.log('Extracted text length:', extractedText.length);
          break;
        } else {
          throw new Error('Insufficient text extracted');
        }
      } catch (error: any) {
        lastError = error;
        console.log(`❌ Model ${modelName} failed:`, error.message);
        continue;
      }
    }

    if (!extractedText || extractedText.trim().length < 20) {
      console.error('❌ Failed to extract sufficient text from image');
      console.error('Last error:', lastError);
      return NextResponse.json(
        { 
          error: 'Could not read menu from image. Please ensure the image is clear and contains readable text.',
          details: lastError?.message 
        },
        { status: 400 }
      );
    }

    console.log('✅ Text successfully extracted from mess menu');
    console.log('Preview:', extractedText.substring(0, 200) + '...');

    return NextResponse.json({ text: extractedText });
  } catch (error: any) {
    console.error('❌ Error extracting text from image:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process image. Please try with a clearer image or different format.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}