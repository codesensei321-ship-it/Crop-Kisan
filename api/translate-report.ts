import { GoogleGenAI } from '@google/genai';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
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
    const { report, targetLanguage } = req.body || {};
    if (!report || !targetLanguage) {
      return res.status(400).json({ error: 'Report and targetLanguage are required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are a world-class agricultural pathology translator.
Translate this crop disease report strictly into ${targetLanguage} using its native script.
Fields to translate into natural ${targetLanguage}:
- cropName (e.g. கோதுமை (Wheat), गेहूं (Wheat))
- diseaseName (e.g. இலை துரு நோய் (Leaf Rust))
- severity (e.g. குறைவு, நடுத்தரம், அதிகம், தீவிரமானது / Low, Medium, High, Critical)
- symptoms (translate all bullet strings into ${targetLanguage})
- pestDamage (translate all strings into ${targetLanguage})
- nutrientDeficiencies (translate all strings into ${targetLanguage})
- causesAndContext (translate all strings into ${targetLanguage})
- immediateActions (translate all actionable steps into simple ${targetLanguage})
- preventionAdvice (translate all preventive tips into ${targetLanguage})
- whenToContactExpert (translate into ${targetLanguage})
- seasonalLocalizedNote (translate into ${targetLanguage})
- unclearReason (translate into ${targetLanguage} if present)

Keep all booleans (isCropOrPlant, isIdentifiable, isHealthy), numerical confidence, and JSON keys identical.
Respond strictly in JSON.

Input JSON:
${JSON.stringify(report)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error('Error translating report on Vercel:', error);
    return res.status(500).json({
      error: 'Failed to translate report',
      details: error?.message || 'Internal server error',
    });
  }
}
