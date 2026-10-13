import { GoogleGenAI, Type } from '@google/genai';

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg', location, currentDate, month, season } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided for crop analysis' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Clean base64 data and sanitize mime type
    let cleanBase64 = imageBase64;
    let safeMimeType = mimeType || 'image/jpeg';

    if (imageBase64.includes('base64,')) {
      const parts = imageBase64.split('base64,');
      cleanBase64 = parts[1];
      const mimeMatch = parts[0].match(/data:([^;]+)/);
      if (mimeMatch) {
        safeMimeType = mimeMatch[1];
      }
    }

    if (safeMimeType.includes('svg')) {
      safeMimeType = 'image/png';
    } else if (
      !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(safeMimeType.toLowerCase())
    ) {
      safeMimeType = 'image/jpeg';
    }

    const locationText = location
      ? `${location.district || location.city || 'Local area'}, ${location.state || ''}, ${location.country || ''}`
      : 'Location not specified';

    const systemInstruction = `You are a plant pathologist and agricultural extension expert.
You diagnose crop diseases and health conditions from leaf/plant photos.

Context:
- User Location: ${locationText}
- Current Date: ${currentDate || new Date().toISOString()}
- Month: ${month || 'Current month'}
- Agricultural Season: ${season || 'Seasonal transition'}

CRITICAL INSTRUCTIONS:
1. Examine whether the image depicts a crop, plant foliage, stem, fruit, or farm specimen.
2. If the image is blurry, pitch black, out of focus, or NOT a plant/crop at all, you MUST set "isCropOrPlant": false or "isIdentifiable": false, and describe clearly in "unclearReason" what you observe and politely instruct the farmer to capture a sharp, well-lit photo of the affected plant foliage. NEVER GUESS OR HALLUCINATE A DISEASE IF THE IMAGE IS UNCLEAR OR NOT A PLANT.
3. If the plant is clear and healthy, set "isCropOrPlant": true, "isIdentifiable": true, "isHealthy": true, "diseaseName": "Healthy Plant (No Disease Detected)", "severity": "None (Healthy)".
4. If a disease, pest damage, or deficiency is visible, identify the primary disease (e.g., Early Blight, Late Blight, Rice Blast, Powdery Mildew, Rust, etc.).
5. Provide practical, step-by-step actions that a farmer can take immediately.`;

    const prompt = `Please analyze this crop/plant leaf image carefully. Factor in the location (${locationText}) and season (${season || 'Monsoon/Post-Monsoon'}). Respond strictly according to the JSON schema.`;

    const visionModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of visionModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: safeMimeType,
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isCropOrPlant: {
                  type: Type.BOOLEAN,
                  description: 'Whether the image contains a crop or plant',
                },
                isIdentifiable: {
                  type: Type.BOOLEAN,
                  description: 'Whether the plant condition can be reliably identified without guessing',
                },
                unclearReason: {
                  type: Type.STRING,
                  description: 'Explanation if the image is blurry, unclear, or not a crop',
                },
                cropName: {
                  type: Type.STRING,
                  description: 'Common name of the crop or plant',
                },
                cropScientificName: {
                  type: Type.STRING,
                  description: 'Botanical or scientific name of the crop',
                },
                diseaseName: {
                  type: Type.STRING,
                  description: 'Common and scientific name of the detected disease, or Healthy Plant',
                },
                isHealthy: {
                  type: Type.BOOLEAN,
                  description: 'True if no disease or pest is detected',
                },
                confidence: {
                  type: Type.NUMBER,
                  description: 'Confidence percentage from 0 to 100',
                },
                severity: {
                  type: Type.STRING,
                  description: 'Disease severity level: None (Healthy), Low, Medium, High, or Critical',
                },
                symptoms: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Bullet list of visible physical symptoms observed on the foliage or stem',
                },
                pestDamage: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Observed insect or pest damage',
                },
                nutrientDeficiencies: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Possible nutrient issues',
                },
                causesAndContext: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Why this may be happening',
                },
                immediateActions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Actionable steps the farmer should take immediately',
                },
                preventionAdvice: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Long-term prevention steps',
                },
                whenToContactExpert: {
                  type: Type.STRING,
                  description: 'When the farmer should contact an agricultural expert',
                },
                seasonalLocalizedNote: {
                  type: Type.STRING,
                  description: 'Specific advice connecting the disease to the user region, current month, and season',
                },
              },
              required: [
                'isCropOrPlant',
                'isIdentifiable',
                'cropName',
                'diseaseName',
                'isHealthy',
                'confidence',
                'severity',
                'symptoms',
                'immediateActions',
                'preventionAdvice',
                'whenToContactExpert',
              ],
            },
          },
        });

        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('No vision model responded successfully');
    }

    const textOutput = response.text || '{}';
    const parsedData = JSON.parse(textOutput);
    parsedData.timestamp = new Date().toISOString();

    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error('Error analyzing crop on Vercel:', error);
    return res.status(500).json({
      error: 'Failed to analyze crop image',
      details: error?.message || 'Internal server error',
    });
  }
}
