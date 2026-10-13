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
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [textInput, setTextInput] = useState<string>('');
  const [statusText, setStatusText] = useState<string>('Ready to talk');

  const recognitionRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, liveTranscript]);

  // Initialize with greeting in selected language
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
      setStatusText(`Ready • Tap mic to speak in ${selectedLanguage.nativeName}`);
    } else {
      stopListening();
      stopAudioPlayback();
    }
  }, [isOpen, selectedLanguage.id]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopAudioPlayback();
    };
  }, []);

  const stopAudioPlayback = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    setIsAiSpeaking(false);
  };

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

  // Stop Web Speech recognition
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

  // Start mobile Speech-to-Text via Web Speech API
  const startListening = () => {
    stopAudioPlayback();

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert('Voice input is not supported in this browser. Please type your question below.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;

      recognition.lang = selectedLanguage.code || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setStatusText(`Listening... speak in ${selectedLanguage.nativeName}`);
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
          handleSendQuestion(final.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        setIsListening(false);
        setLiveTranscript('');
        if (event.error === 'not-allowed') {
          setStatusText('Microphone permission blocked. Please enable mic access.');
        } else {
          setStatusText(`Ready • Tap mic to speak in ${selectedLanguage.nativeName}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition startup error:', err);
      setIsListening(false);
      setStatusText(`Ready • Tap mic to speak in ${selectedLanguage.nativeName}`);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
      setStatusText(`Ready • Tap mic to speak in ${selectedLanguage.nativeName}`);
    } else {
      startListening();
    }
  };

  // Send question to backend for text and spoken voice response
  const handleSendQuestion = async (queryText: string) => {
    if (!queryText.trim()) return;

    stopAudioPlayback();
    stopListening();
    setIsProcessing(true);
    setStatusText('Thinking...');

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
        setStatusText(`AI Speaking in ${selectedLanguage.nativeName}...`);

        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        activeAudioRef.current = audio;

        audio.onended = () => {
          setIsAiSpeaking(false);
          setStatusText(`Ready • Tap mic to speak in ${selectedLanguage.nativeName}`);
          activeAudioRef.current = null;
        };

        audio.onerror = () => {
          setIsAiSpeaking(false);
          setStatusText(`Ready • Tap mic to speak in ${selectedLanguage.nativeName}`);
          activeAudioRef.current = null;
        };

        await audio.play().catch((err) => {
          console.warn('Audio autoplay failed:', err);
          setIsAiSpeaking(false);
          setStatusText(`Ready • Tap mic to speak in ${selectedLanguage.nativeName}`);
        });
      } else {
        setStatusText(`Ready • Tap mic to speak in ${selectedLanguage.nativeName}`);
      }
    } catch (err: any) {
      console.error('Voice chat error:', err);
      setTranscripts((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'ai',
          text: 'Unable to connect right now. Please check your network and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setStatusText(`Ready • Tap mic to speak in ${selectedLanguage.nativeName}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLanguageChange = (lang: VoiceLanguage) => {
    stopAudioPlayback();
    stopListening();
    onSelectLanguage(lang);
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
              <h3 className="font-extrabold text-sm text-slate-900 leading-none">
                AI Voice Doctor
              </h3>
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

        {/* Dynamic Status Bar */}
        <div className="px-4 py-2 bg-emerald-50/70 border-b border-emerald-100/60 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                Thinking...
              </>
            ) : isAiSpeaking ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                AI Speaking...
              </>
            ) : isListening ? (
              <>
                <Radio className="w-3.5 h-3.5 text-green-600 animate-pulse" />
                Listening to you...
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

        {/* Bottom Speaking Bar */}
        <div className="p-3.5 bg-white border-t border-slate-100 flex items-center gap-2">
          {/* Main Large Speak / Mic Button */}
          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform cursor-pointer shadow-md ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-red-200'
                : 'bg-emerald-800 text-white hover:bg-emerald-900 shadow-emerald-200'
            }`}
            title={isListening ? 'Stop listening' : 'Tap to speak'}
          >
            {isListening ? (
              <Radio className="w-5 h-5 animate-pulse" />
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
              placeholder={isListening ? 'Listening...' : `Ask in ${selectedLanguage.nativeName}...`}
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

          {/* Stop audio button if speaking */}
          {isAiSpeaking && (
            <button
              onClick={stopAudioPlayback}
              className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
              title="Stop audio"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="h-9 px-2.5 rounded-full text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
