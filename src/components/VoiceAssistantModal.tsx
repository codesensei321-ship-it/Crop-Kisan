import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Globe,
  Send,
  Loader2,
  Radio,
  CheckCircle,
} from 'lucide-react';
import {
  CropAnalysisResult,
  LocationContext,
  VoiceLanguage,
  TranscriptEntry,
} from '../types.ts';
import { SUPPORTED_LANGUAGES } from '../utils/languages.ts';
import {
  AudioQueuePlayer,
  downsampleTo16k,
  float32ToInt16PCM,
  int16ToBase64,
} from '../utils/audio.ts';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CropAnalysisResult;
  location: LocationContext | null;
  selectedLanguage: VoiceLanguage;
  onSelectLanguage: (lang: VoiceLanguage) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  result,
  location,
  selectedLanguage,
  onSelectLanguage,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'error' | 'disconnected'
  >('connecting');
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [textInput, setTextInput] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<AudioQueuePlayer | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const getLanguageQuestions = (langId: string) => {
    switch (langId) {
      case 'hindi':
        return ['यह कौन सी बीमारी है?', 'इसका क्या इलाज है?', 'क्या फसल बच जाएगी?'];
      case 'kannada':
        return ['ಯಾವ ರೋಗ ಬಂದಿದೆ?', 'ಸಾವಯವ ಚಿಕಿತ್ಸೆ ಏನು?', 'ಮೊದಲು ಏನು ಮಾಡಬೇಕು?'];
      case 'telugu':
        return ['ఏ తెగులు సోకింది?', 'నివారణ మందులు ఏమిటి?', 'ప్రమాదకరమా?'];
      case 'tamil':
        return ['என்ன நோய் இது?', 'உடனடி தீர்வு என்ன?', 'பயிர் பிழைக்குமா?'];
      case 'marathi':
        return ['हा कोणता रोग आहे?', 'काय उपाय करावा?', 'धोकादायक आहे का?'];
      case 'bengali':
        return ['কী রোগ হয়েছে?', 'কী ওষুধ দেব?', 'ফসল বাঁচবে তো?'];
      default:
        return ['What disease is this?', 'How to treat it?', 'Is it dangerous?'];
    }
  };

  const connectLiveSession = () => {
    setConnectionStatus('connecting');

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new AudioQueuePlayer((speaking) => {
        setIsAiSpeaking(speaking);
      });
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'setup',
            language: selectedLanguage.name,
            cropContext: {
              cropName: result.cropName,
              diseaseName: result.diseaseName,
              severity: result.severity,
              symptoms: result.symptoms,
              immediateActions: result.immediateActions,
              location: {
                district: location?.district,
                state: location?.state,
                country: location?.country,
                season: location?.season,
              },
            },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ready') {
            setConnectionStatus('connected');
            setTranscripts((prev) => [
              ...prev,
              {
                id: Math.random().toString(),
                sender: 'ai',
                text: selectedLanguage.greeting,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
            startMicAudioCapture();
          } else if (msg.type === 'audio' && msg.pcm) {
            audioPlayerRef.current?.enqueueChunk(msg.pcm, msg.sampleRate || 24000);
          } else if (msg.type === 'transcript') {
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === msg.role && Date.now() - new Date(last.timestamp).getTime() < 4000) {
                return [...prev.slice(0, -1), { ...last, text: `${last.text} ${msg.text}`.trim() }];
              }
              return [
                ...prev,
                {
                  id: Math.random().toString(),
                  sender: msg.role === 'ai' ? 'ai' : 'user',
                  text: msg.text,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ];
            });
          } else if (msg.type === 'interrupted') {
            audioPlayerRef.current?.stopAll();
            setIsAiSpeaking(false);
          }
        } catch (e) {
          console.error('WS error:', e);
        }
      };

      ws.onerror = () => {
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        stopMicAudioCapture();
      };
    } catch {
      setConnectionStatus('error');
    }
  };

  const startMicAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      micStreamRef.current = stream;

      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isMicActive || isAiSpeaking) {
          setIsListening(false);
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += Math.abs(inputData[i]);
        }
        setIsListening(sum / inputData.length > 0.015);

        const downsampled = downsampleTo16k(inputData, audioCtx.sampleRate);
        const int16 = float32ToInt16PCM(downsampled);
        const base64 = int16ToBase64(int16);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'audio', pcm: base64 }));
        }
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
    } catch {
      // mic blocked
    }
  };

  const stopMicAudioCapture = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setIsListening(false);
  };

  const disconnectSession = () => {
    stopMicAudioCapture();
    audioPlayerRef.current?.close();
    audioPlayerRef.current = null;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
  };

  useEffect(() => {
    if (isOpen) {
      connectLiveSession();
    } else {
      disconnectSession();
    }
    return () => {
      disconnectSession();
    };
  }, [isOpen, selectedLanguage.id]);

  const handleLanguageChange = (lang: VoiceLanguage) => {
    onSelectLanguage(lang);
    disconnectSession();
  };

  const handleSendQuestion = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: TranscriptEntry = {
      id: Math.random().toString(),
      sender: 'user',
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setTranscripts((prev) => [...prev, userMsg]);
    setTextInput('');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', text: queryText.trim() }));
    } else {
      try {
        const res = await fetch('/api/voice-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: queryText.trim(),
            language: selectedLanguage.name,
            cropContext: {
              cropName: result.cropName,
              diseaseName: result.diseaseName,
              severity: result.severity,
              immediateActions: result.immediateActions,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setTranscripts((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              sender: 'ai',
              text: data.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);

          if (data.audioBase64) {
            const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
            setIsAiSpeaking(true);
            audio.onended = () => setIsAiSpeaking(false);
            audio.play().catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Fallback error:', err);
      }
    }
  };

  if (!isOpen) return null;

  const quickQuestions = getLanguageQuestions(selectedLanguage.id);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 leading-none">
                AI Voice Doctor
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {result.cropName}: {result.diseaseName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language picker */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full px-2 py-1 text-xs">
              <Globe className="w-3 h-3 text-emerald-700" />
              <select
                value={selectedLanguage.id}
                onChange={(e) => {
                  const target = SUPPORTED_LANGUAGES.find((l) => l.id === e.target.value);
                  if (target) handleLanguageChange(target);
                }}
                className="bg-transparent text-[11px] font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nativeName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Indicator Bar */}
        <div className="px-4 py-2 bg-emerald-50/50 flex items-center justify-between text-[11px]">
          <span className="font-medium text-emerald-800 flex items-center gap-1">
            {isAiSpeaking ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                AI Speaking...
              </>
            ) : isListening ? (
              <>
                <Radio className="w-3.5 h-3.5 text-green-600 animate-pulse" />
                Listening...
              </>
            ) : connectionStatus === 'connected' ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Ready to talk
              </>
            ) : (
              'Connecting...'
            )}
          </span>

          {/* Clean audio bars */}
          <div className="flex items-center gap-0.5 h-3">
            {[40, 90, 60, 100, 50].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isAiSpeaking || isListening ? 'bg-emerald-600' : 'bg-slate-200'
                }`}
                style={{
                  height: isAiSpeaking || isListening ? `${(h / 100) * 12}px` : '3px',
                }}
              />
            ))}
          </div>
        </div>

        {/* Live Transcript Bubble Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5 min-h-[160px] max-h-[280px] bg-slate-50/50 text-xs">
          {transcripts.map((entry) => (
            <div
              key={entry.id}
              className={`flex flex-col ${
                entry.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 leading-relaxed ${
                  entry.sender === 'user'
                    ? 'bg-emerald-800 text-white rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                }`}
              >
                {entry.text}
              </div>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 py-2 border-t border-slate-100 flex gap-1.5 overflow-x-auto">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuestion(q)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 text-[11px] font-medium text-slate-700 whitespace-nowrap active:scale-95 transition-transform"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Bottom Bar: Microphone + Input */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
          {/* Circular Mic Button */}
          <button
            onClick={() => setIsMicActive(!isMicActive)}
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform ${
              isMicActive
                ? 'bg-emerald-800 text-white shadow-md'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Quick text input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuestion(textInput);
            }}
            className="flex-1 flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1.5"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Ask in ${selectedLanguage.nativeName}...`}
              className="flex-1 bg-transparent text-xs text-slate-800 focus:outline-none placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <button
            onClick={onClose}
            className="h-9 px-3 rounded-full text-slate-500 hover:text-slate-800 text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
