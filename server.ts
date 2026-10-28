import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, Modality, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Increase payload limit for image data
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Download pitch deck PowerPoint presentation
app.get(['/api/download-pitch-deck', '/KisanDr_AI_Crop_Pitch_Deck.pptx'], (_req, res) => {
  const pptxPath = path.join(__dirname, 'public', 'KisanDr_AI_Crop_Pitch_Deck.pptx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
  res.download(pptxPath, 'KisanDr_AI_Crop_Pitch_Deck.pptx', (err) => {
    if (err) {
      console.error('Download error:', err);
      if (!res.headersSent) {
        res.status(404).send('Pitch deck presentation file not found');
      }
    }
  });
});

// Crop analysis endpoint
app.post('/api/analyze-crop', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', location, currentDate, month, season, language = 'English' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided for crop analysis' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
    }

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

    // Ensure MIME type is a supported raster type
    if (safeMimeType.includes('svg')) {
      safeMimeType = 'image/png';
    } else if (
      !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(safeMimeType.toLowerCase())
    ) {
      safeMimeType = 'image/jpeg';
    }

    const locationText = location
      ? `${location.district || location.city || 'Local area'}, ${location.state || ''}, ${location.country || ''} (Coordinates: ${location.latitude ? `${location.latitude.toFixed(2)}, ${location.longitude?.toFixed(2)}` : 'Approximate'})`
      : 'Location not specified';

    const systemInstruction = `You are a world-class plant pathologist, agronomist, and agricultural extension expert.
You diagnose crop diseases and health conditions from leaf/plant photos.

Context:
- User Location: ${locationText}
- Current Date: ${currentDate || new Date().toISOString()}
- Month: ${month || 'Current month'}
- Agricultural Season: ${season || 'Seasonal transition'}
- User's Chosen Language: ${language}

CRITICAL LANGUAGE REQUIREMENT:
The farmer's selected language is: ${language}.
ALL text fields in the output JSON MUST be fully translated and written directly in ${language} using its native script (e.g. Tamil, Hindi, Kannada, Telugu, Marathi, Bengali, or English):
1. "cropName": Write the common crop name in ${language} (with English botanical name in brackets if helpful, e.g. "கோதுமை (Wheat)").
2. "diseaseName": Write the disease name in ${language} with common/scientific name in brackets (e.g. "இலை துரு நோய் (Leaf Rust)").
3. "severity": Severity in ${language} (e.g., "குறைவு (Low)", "நடுத்தரம் (Medium)", "அதிகம் (High)", "தீவிரமானது (Critical)", "ஆரோக்கியமானது (Healthy)").
4. "symptoms": Array of bullet points describing visible leaf/foliage symptoms written entirely in natural ${language}.
5. "pestDamage": Array of visible pest or insect notes written in ${language}.
6. "nutrientDeficiencies": Array of nutrient issues written in ${language}.
7. "causesAndContext": Array of causes written in ${language}.
8. "immediateActions": Actionable immediate steps written clearly in simple, farmer-friendly ${language} (e.g., bio-control, neem oil, fungicide spray, irrigation hygiene).
9. "preventionAdvice": Long-term preventive tips written in ${language}.
10. "whenToContactExpert": Recommendation on when to consult local Krishi Vigyan Kendra (KVK) or extension officer, written in ${language}.
11. "seasonalLocalizedNote": Regional seasonal advice in ${language}.
12. "unclearReason": Reason in ${language} if photo is unidentifiable.

CLINICAL INSTRUCTIONS:
1. Examine whether the image depicts a crop, plant foliage, stem, fruit, or farm specimen.
2. If the image is blurry, pitch black, out of focus, or NOT a plant/crop at all (e.g. coffee mug, face, dog, desk, room), you MUST set "isCropOrPlant": false or "isIdentifiable": false, and describe clearly in "unclearReason" in ${language} what you observe and politely instruct the farmer to capture a sharp, well-lit photo of the affected plant foliage. NEVER GUESS OR HALLUCINATE A DISEASE IF THE IMAGE IS UNCLEAR OR NOT A PLANT.
3. If the plant is clear and healthy, set "isCropOrPlant": true, "isIdentifiable": true, "isHealthy": true, "diseaseName": "Healthy Plant", "severity": "None (Healthy)".
4. If a disease, pest damage, or deficiency is visible, identify the primary disease.
5. Provide contextual recommendations specifically tuned to the farmer's geography and season.
6. Give practical, step-by-step actions that a farmer can take immediately.`;

    const prompt = `Please analyze this crop/plant leaf image carefully. Factor in the location (${locationText}) and season (${season || 'Monsoon/Post-Monsoon'}). Output strictly in ${language} according to the JSON schema.`;

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
                  description: 'Common name of the crop or plant (e.g., Tomato, Paddy / Rice, Maize)',
                },
                cropScientificName: {
                  type: Type.STRING,
                  description: 'Botanical or scientific name of the crop (e.g., Solanum lycopersicum)',
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
                  description: 'Observed insect or pest damage (e.g. leaf miner trails, mite webbing, aphid residue, or none)',
                },
                nutrientDeficiencies: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Possible nutrient issues (e.g. Nitrogen chlorosis, Potassium margin burn, or none)',
                },
                causesAndContext: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Why this may be happening (pathogen biology, weather, humidity, standing water, seasonal factors)',
                },
                immediateActions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Actionable steps the farmer should take immediately to salvage or protect the crop',
                },
                preventionAdvice: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Long-term prevention steps (crop rotation, spacing, certified seeds, drip irrigation)',
                },
                whenToContactExpert: {
                  type: Type.STRING,
                  description: 'When the farmer should contact their local agricultural university, Krishi Vigyan Kendra (KVK), or extension agent',
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
          console.log(`Diagnosed crop successfully with model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} encountered error: ${err.message}. Trying next candidate...`);
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('No vision model responded successfully');
    }

    const textOutput = response.text || '{}';
    const parsedData = JSON.parse(textOutput);
    parsedData.timestamp = new Date().toISOString();

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error analyzing crop:', error);
    return res.status(500).json({
      error: 'Failed to analyze crop image',
      details: error?.message || 'Internal error',
    });
  }
});

// Real-time report translation endpoint when user switches language
app.post('/api/translate-report', async (req, res) => {
  try {
    const { report, targetLanguage } = req.body;
    if (!report || !targetLanguage) {
      return res.status(400).json({ error: 'Report and targetLanguage are required' });
    }

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
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      },
    });

    if (response && response.text) {
      const translated = JSON.parse(response.text);
      translated.timestamp = new Date().toISOString();
      return res.json(translated);
    }

    return res.json(report);
  } catch (err: any) {
    console.warn('Translate report error:', err);
    return res.json(req.body.report || {});
  }
});

// Fallback Voice Q&A / TTS endpoint for HTTP & text-speech interactions
app.post('/api/voice-chat', async (req, res) => {
  try {
    const { message, language = 'English', cropContext, wantAudio = true } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const contextPrompt = cropContext
      ? `The farmer is asking about their crop:
- Crop: ${cropContext.cropName || 'Crop'}
- Condition: ${cropContext.diseaseName || 'Analyzed foliage'}
- Severity: ${cropContext.severity || 'Unknown'}
- Location: ${cropContext.location?.state || cropContext.location?.country || 'Local farm'}
- Season: ${cropContext.location?.season || 'Current season'}
- Summary Actions: ${(cropContext.immediateActions || []).slice(0, 3).join('; ')}`
      : 'General farming and crop pathology inquiry.';

    const systemInstruction = `You are KisanDr, a caring, expert agricultural voice assistant speaking naturally with a farmer in real-time.
${contextPrompt}

CRITICAL SPOKEN CONVERSATION RULES:
1. Speak fluently and warmly in ${language}.
2. Keep your answer SHORT, SIMPLE, and NATURAL (1 to 2 spoken sentences). Talk like a knowledgeable friend on the phone, not an article.
3. Use simple, everyday farming language. Avoid complex chemical or biological terms unless necessary.
4. DO NOT give long lists or essays. Give a quick, direct solution first (e.g. "Your tomato has early blight. Spraying neem oil or copper oxychloride today will protect your harvest!").
5. ONLY give longer or step-by-step answers if the farmer explicitly asks for "detailed steps", "full instructions", or "exact preparation".`;

    const chatModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let replyText = '';

    for (const m of chatModels) {
      try {
        const config: any = {
          systemInstruction,
        };

        if (m === 'gemini-3.1-flash-lite') {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
        } else if (m === 'gemini-3.8-flash') {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
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
        console.warn(`Chat model ${m} failed: ${err.message}. Trying next...`);
      }
    }

    if (!replyText) {
      replyText = 'I understand your question. Please consult your local Krishi Vigyan Kendra (KVK) for specialized agricultural support.';
    }

    let audioBase64: string | null = null;
    if (wantAudio) {
      try {
        const ttsResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: replyText,
                },
              ],
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
        console.warn('TTS generation fallback warning:', ttsErr);
      }
    }

    return res.json({
      text: replyText,
      audioBase64,
    });
  } catch (error: any) {
    console.error('Error in voice chat:', error);
    return res.status(500).json({ error: 'Failed to process voice query', details: error?.message });
  }
});

// Setup WebSocket server for Gemini 3.8 Live API
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  if (url.pathname === '/api/live') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', async (clientWs: WebSocket) => {
  let liveSession: any = null;
  let isConnected = false;

  clientWs.on('message', async (data: Buffer | string) => {
    try {
      const message = JSON.parse(data.toString());

      // Setup phase: initialize Gemini Live session with crop report & chosen language
      if (message.type === 'setup') {
        const { language = 'English', cropContext } = message;

        const systemInstruction = `You are KisanDr, an empathetic, expert agricultural AI voice doctor speaking with a farmer in real-time.
Context of scanned crop:
- Crop: ${cropContext?.cropName || 'Crop'}
- Disease Detected: ${cropContext?.diseaseName || 'Foliage Condition'}
- Severity: ${cropContext?.severity || 'Noted'}
- Symptoms: ${(cropContext?.symptoms || []).join(', ')}
- Location: ${cropContext?.location?.state || cropContext?.location?.country || 'Region'}
- Season: ${cropContext?.location?.season || 'Current Season'}
- Recommendations: ${(cropContext?.immediateActions || []).join('; ')}

Instructions for conversation:
1. Speak fluently, warmly, and naturally in ${language}.
2. Keep spoken sentences conversational, concise (2-3 sentences per turn), and practical.
3. Help the farmer understand what disease their crop has, how to treat it organically or chemically, whether it will ruin their yield, and what to do first.
4. If the farmer asks a question in ${language}, reply in the same language with clear spoken advice.`;

        try {
          liveSession = await ai.live.connect({
            model: 'gemini-3.8-live',
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Zephyr' },
                },
              },
              systemInstruction,
              // Request both input and output audio transcriptions
              outputAudioTranscription: {},
              inputAudioTranscription: {},
            },
            callbacks: {
              onmessage: (serverMessage: any) => {
                if (clientWs.readyState !== WebSocket.OPEN) return;

                // Handle model audio output
                const parts = serverMessage.serverContent?.modelTurn?.parts || [];
                for (const part of parts) {
                  if (part.inlineData?.data) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'audio',
                        pcm: part.inlineData.data,
                        sampleRate: 24000,
                      })
                    );
                  }
                  if (part.text) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'transcript',
                        role: 'ai',
                        text: part.text,
                      })
                    );
                  }
                }

                // Handle output audio transcription
                if (serverMessage.serverContent?.outputAudioTranscription?.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'transcript',
                      role: 'ai',
                      text: serverMessage.serverContent.outputAudioTranscription.text,
                    })
                  );
                }

                // Handle user input audio transcription
                if (serverMessage.serverContent?.inputAudioTranscription?.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'transcript',
                      role: 'user',
                      text: serverMessage.serverContent.inputAudioTranscription.text,
                    })
                  );
                }

                // Handle model interruption
                if (serverMessage.serverContent?.interrupted) {
                  clientWs.send(JSON.stringify({ type: 'interrupted' }));
                }

                // Handle turn complete
                if (serverMessage.serverContent?.turnComplete) {
                  clientWs.send(JSON.stringify({ type: 'turnComplete' }));
                }
              },
              onclose: () => {
                isConnected = false;
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'sessionClosed' }));
                }
              },
              onerror: (err: any) => {
                console.error('Gemini Live session error:', err);
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'error', message: err?.message || 'Live session error' }));
                }
              },
            },
          });

          isConnected = true;
          clientWs.send(JSON.stringify({ type: 'ready' }));
        } catch (liveErr: any) {
          console.error('Failed to connect to Gemini Live API:', liveErr);
          clientWs.send(
            JSON.stringify({
              type: 'error',
              message: liveErr?.message || 'Could not start real-time Live API session. Fallback mode available.',
            })
          );
        }
        return;
      }

      // Realtime audio streaming from microphone (16kHz PCM little-endian)
      if (message.type === 'audio' && liveSession && isConnected) {
        liveSession.sendRealtimeInput({
          audio: {
            data: message.pcm,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      }

      // Text input over WebSocket
      if (message.type === 'text' && liveSession && isConnected) {
        liveSession.sendRealtimeInput({
          text: message.text,
        });
      }
    } catch (e: any) {
      console.error('Error processing client WebSocket message:', e);
    }
  });

  clientWs.on('close', () => {
    if (liveSession) {
      try {
        liveSession.close();
      } catch {
        // ignore
      }
      liveSession = null;
    }
    isConnected = false;
  });
});

// Vite middleware mounting in development mode
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // Serve static files in production
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`KisanDr fullstack server running on http://0.0.0.0:${PORT}`);
});
