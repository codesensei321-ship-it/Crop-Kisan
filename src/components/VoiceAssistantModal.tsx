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
  Sparkles,
  PhoneCall,
  PhoneOff,
} from 'lucide-react';
import {
  CropAnalysisResult,
  LocationContext,
  VoiceLanguage,
  TranscriptEntry,
} from '../types.ts';
import { SUPPORTED_LANGUAGES } from '../utils/languages.ts';

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
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isContinuousMode, setIsContinuousMode] = useState<boolean>(true);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [textInput, setTextInput] = useState<string>('');
  const [statusText, setStatusText] = useState<string>('Ready • Hands-free active');

  const recognitionRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const isContinuousRef = useRef<boolean>(true);

  // Keep ref in sync
  useEffect(() => {
    isContinuousRef.current = isContinuousMode;
  }, [isContinuousMode]);

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, liveTranscript]);

  // Stop current audio playback
  const stopAudioPlayback = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    setIsAiSpeaking(false);
  };

  // Stop speech recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setLiveTranscript('');
  };

  // Start continuous hands-free speech recognition
  const startListening = (langOverride?: VoiceLanguage) => {
    stopAudioPlayback();
    const activeLang = langOverride || selectedLanguage;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setStatusText('Type question below (speech unsupported in browser)');
      return;
    }

    try {
      if (recognitionRef.current) {
        stopListening();
      }

      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;

      recognition.lang = activeLang.code || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setStatusText(`Listening... speak in ${activeLang.nativeName}`);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            final += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }

        const currentSpeech = final || interim;
        setLiveTranscript(currentSpeech);

        if (final && final.trim()) {
          stopListening();
          handleSendQuestion(final.trim(), activeLang);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        setIsListening(false);
        setLiveTranscript('');

        if (event.error === 'no-speech') {
          if (isContinuousRef.current && !isAiSpeaking && !isProcessing) {
            setTimeout(() => {
              if (isContinuousRef.current && !isAiSpeaking && !isProcessing) {
                startListening(activeLang);
              }
            }, 400);
          }
        } else if (event.error === 'not-allowed') {
          setStatusText('Microphone permission blocked. Please enable mic access.');
          setIsContinuousMode(false);
        } else {
          setStatusText(`Ready • Speak in ${activeLang.nativeName}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
      setStatusText(`Ready • Speak in ${activeLang.nativeName}`);
    }
  };

  // Initialize with greeting & start hands-free conversation on open
  useEffect(() => {
    if (isOpen) {
      setTranscripts([
        {
          id: 'greeting',
          sender: 'ai',
          text: selectedLanguage.greeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsContinuousMode(true);
      setStatusText(`Ready • Listening in ${selectedLanguage.nativeName}`);

      const timer = setTimeout(() => {
        startListening();
      }, 400);
      return () => clearTimeout(timer);
    } else {
      stopListening();
      stopAudioPlayback();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopListening();
      stopAudioPlayback();
    };
  }, []);

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

  // Send query and get short natural spoken answer
  const handleSendQuestion = async (queryText: string, langOverride?: VoiceLanguage) => {
    if (!queryText.trim()) return;
    const activeLang = langOverride || selectedLanguage;

    stopAudioPlayback();
    stopListening();
    setIsProcessing(true);
    setStatusText('Replying...');

    const userMessage: TranscriptEntry = {
      id: Math.random().toString(),
      sender: 'user',
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTranscripts((prev) => [...prev, userMessage]);
    setTextInput('');
    setLiveTranscript('');

    try {
      const res = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: queryText.trim(),
          language: activeLang.name,
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
          wantAudio: true,
        }),
      });

      if (!res.ok) {
        throw new Error(`Voice query error (${res.status})`);
      }

      const data = await res.json();

      const aiMessage: TranscriptEntry = {
        id: Math.random().toString(),
        sender: 'ai',
        text: data.text || 'I understand your query. Please take recommended preventive measures.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setTranscripts((prev) => [...prev, aiMessage]);

      // Play back audio response
      if (data.audioBase64) {
        setIsAiSpeaking(true);
        setStatusText(`AI Speaking in ${activeLang.nativeName}...`);

        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        activeAudioRef.current = audio;

        // When AI finishes speaking, AUTOMATICALLY resume listening hands-free in activeLang!
        audio.onended = () => {
          setIsAiSpeaking(false);
          activeAudioRef.current = null;

          if (isContinuousRef.current) {
            setStatusText(`Listening... speak in ${activeLang.nativeName}`);
            setTimeout(() => {
              if (isContinuousRef.current) {
                startListening(activeLang);
              }
            }, 300);
          } else {
            setStatusText(`Ready • Speak anytime in ${activeLang.nativeName}`);
          }
        };

        audio.onerror = () => {
          setIsAiSpeaking(false);
          activeAudioRef.current = null;
          if (isContinuousRef.current) {
            setTimeout(() => startListening(activeLang), 400);
          }
        };

        await audio.play().catch((err) => {
          console.warn('Audio play error:', err);
          setIsAiSpeaking(false);
          if (isContinuousRef.current) {
            setTimeout(() => startListening(activeLang), 400);
          }
        });
      } else {
        if (isContinuousRef.current) {
          setTimeout(() => startListening(activeLang), 400);
        }
      }
    } catch (err: any) {
      console.error('Voice chat error:', err);
      setTranscripts((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'ai',
          text: 'Network issue. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      if (isContinuousRef.current) {
        setTimeout(() => startListening(activeLang), 600);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMic = () => {
    if (isAiSpeaking) {
      stopAudioPlayback();
      setIsContinuousMode(true);
      startListening(selectedLanguage);
      return;
    }

    if (isListening) {
      stopListening();
      setIsContinuousMode(false);
      setStatusText(`Paused • Tap mic to resume talking`);
    } else {
      setIsContinuousMode(true);
      startListening(selectedLanguage);
    }
  };

  // Seamless in-conversation language switcher
  const handleLanguageChange = (lang: VoiceLanguage) => {
    stopAudioPlayback();
    stopListening();
    onSelectLanguage(lang);

    // Keep conversation history intact and add friendly switch notice
    setTranscripts((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        sender: 'ai',
        text: `🌐 Switched to ${lang.nativeName} (${lang.name}). ${lang.greeting}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setIsContinuousMode(true);
    setStatusText(`Listening in ${lang.nativeName}...`);

    // Immediately start listening hands-free in the new language!
    setTimeout(() => {
      startListening(lang);
    }, 350);
  };

  if (!isOpen) return null;

  const quickQuestions = getLanguageQuestions(selectedLanguage.id);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl border border-slate-100 flex flex-col max-h-[88vh] overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full ${isAiSpeaking ? 'bg-emerald-500 animate-ping' : isListening ? 'bg-green-500 animate-bounce' : 'bg-emerald-600'}`} />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-slate-900 leading-none">
                  AI Voice Doctor
                </h3>
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full">
                  Live
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[170px] sm:max-w-xs">
                {result.cropName}: {result.diseaseName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full px-2 py-1 text-xs">
              <Globe className="w-3 h-3 text-emerald-700 shrink-0" />
              <select
                value={selectedLanguage.id}
                onChange={(e) => {
                  const target = SUPPORTED_LANGUAGES.find((l) => l.id === e.target.value);
                  if (target) handleLanguageChange(target);
                }}
                className="bg-transparent text-[11px] font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
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
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Status Bar with Hands-Free Live Pill */}
        <div className="px-4 py-2 bg-emerald-50/80 border-b border-emerald-100/60 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                Thinking...
              </>
            ) : isAiSpeaking ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                AI Speaking (Tap mic to interrupt)...
              </>
            ) : isListening ? (
              <>
                <Radio className="w-3.5 h-3.5 text-green-600 animate-pulse" />
                Listening... (Hands-free conversation)
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                {statusText}
              </>
            )}
          </span>

          {/* Audio Wave Visualizer */}
          <div className="flex items-center gap-0.5 h-3">
            {[30, 80, 50, 100, 40, 90, 60].map((h, i) => (
              <span
                key={i}
                className={`w-0.5 rounded-full transition-all duration-150 ${
                  isAiSpeaking || isListening ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                style={{
                  height: isAiSpeaking || isListening ? `${(h / 100) * 12}px` : '3px',
                }}
              />
            ))}
          </div>
        </div>

        {/* Live Conversation Transcripts */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5 min-h-[180px] max-h-[300px] bg-slate-50/40 text-xs">
          {transcripts.map((entry) => (
            <div
              key={entry.id}
              className={`flex flex-col ${
                entry.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 leading-relaxed shadow-xs ${
                  entry.sender === 'user'
                    ? 'bg-emerald-800 text-white rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                }`}
              >
                {entry.text}
              </div>
            </div>
          ))}

          {/* Real-time speech transcription bubble */}
          {liveTranscript && (
            <div className="flex flex-col items-end animate-pulse">
              <div className="max-w-[85%] rounded-2xl px-3.5 py-2 bg-emerald-700 text-white rounded-br-none text-xs italic">
                {liveTranscript}...
              </div>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>

        {/* Suggested Quick Questions */}
        <div className="px-4 py-2 border-t border-slate-100 flex gap-1.5 overflow-x-auto bg-white">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuestion(q)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 text-[11px] font-medium text-slate-700 whitespace-nowrap active:scale-95 transition-transform cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Bottom Speaking Bar: Hands-Free Natural Voice Controls */}
        <div className="p-3.5 bg-white border-t border-slate-100 flex items-center gap-2">
          {/* Main Large Speak / Mic Button with continuous pulse */}
          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform cursor-pointer shadow-md ${
              isListening
                ? 'bg-emerald-700 text-white animate-pulse ring-4 ring-emerald-200'
                : isAiSpeaking
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            title={
              isAiSpeaking
                ? 'Tap to interrupt AI'
                : isListening
                ? 'Tap to pause hands-free conversation'
                : 'Tap to speak hands-free'
            }
          >
            {isListening ? (
              <Radio className="w-5 h-5 animate-pulse" />
            ) : isAiSpeaking ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Text input alternative */}
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
              placeholder={isListening ? 'Listening hands-free...' : `Ask in ${selectedLanguage.nativeName}...`}
              className="flex-1 bg-transparent text-xs text-slate-800 focus:outline-none placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* End Call button */}
          <button
            onClick={onClose}
            className="h-9 px-3 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            End
          </button>
        </div>
      </div>
    </div>
  );
};
