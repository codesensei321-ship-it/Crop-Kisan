import { GoogleGenAI, ThinkingLevel } from '@google/genai';

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
    const { message, language = 'English', cropContext, wantAudio = true } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured',
        details: 'Please set GEMINI_API_KEY in your hosting environment variables.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contextPrompt = cropContext
      ? `The farmer is asking about their crop:
- Crop: ${cropContext.cropName || 'Crop'}
- Condition: ${cropContext.diseaseName || 'Analyzed foliage'}
- Severity: ${cropContext.severity || 'Unknown'}
- Location: ${cropContext.location?.state || cropContext.location?.country || 'Local farm'}
- Season: ${cropContext.location?.season || 'Current season'}
- Summary Actions: ${(cropContext.immediateActions || []).slice(0, 3).join('; ')}`
      : 'General farming and crop inquiry.';

    const systemInstruction = `You are KisanDr, a caring, expert agricultural voice assistant speaking naturally with a farmer in real-time.
${contextPrompt}

CRITICAL SPOKEN CONVERSATION RULES:
1. Speak fluently and warmly in ${language}.
2. Keep your answer SHORT, SIMPLE, and NATURAL (1 to 2 spoken sentences). Talk like a knowledgeable friend on the phone, not an article.
3. Use simple, everyday farming language. Avoid complex chemical or biological terms unless necessary.
4. DO NOT give long lists or essays. Give a quick, direct solution first (e.g. "Your tomato has early blight. Spraying neem oil or copper oxychloride today will protect your harvest!").
5. ONLY give longer or step-by-step answers if the farmer explicitly asks for "detailed steps", "full instructions", or "exact preparation".`;

    // Use high-quota models (Gemini 3.1 Flash Lite) to prevent quota exhaustion
    const chatModels = [
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash',
    ];
    let replyText = '';

    for (const m of chatModels) {
      try {
        const config: any = {
          systemInstruction,
        };

        // Turn off reasoning/thinking latency so it answers right away
        if (m === 'gemini-3.1-flash-lite') {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
        }

        const chatResponse = await ai.models.generateContent({
          model: m,
          contents: message,
          config,
        });

        if (chatResponse.text) {
          replyText = chatResponse.text;
          break;
        }
      } catch (err: any) {
        // try next model
      }
    }

    if (!replyText) {
      replyText = 'Please consult your local agricultural university or extension center for guidance.';
    }

    let audioBase64: string | null = null;
    if (wantAudio) {
      try {
        const ttsResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [{ text: replyText }],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });

        const partAudio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (partAudio) {
          audioBase64 = partAudio;
        }
      } catch (ttsErr) {
        console.warn('TTS warning:', ttsErr);
      }
    }

    return res.status(200).json({
      text: replyText,
      audioBase64,
    });
  } catch (error: any) {
    console.error('Error in voice chat on Vercel:', error);
    return res.status(500).json({ error: 'Failed to process voice query' });
  }
}
