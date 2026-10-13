import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { CropScanner } from './components/CropScanner.tsx';
import { AnalysisReport } from './components/AnalysisReport.tsx';
import { VoiceAssistantModal } from './components/VoiceAssistantModal.tsx';
import { LocationContext, CropAnalysisResult, VoiceLanguage } from './types.ts';
import { SUPPORTED_LANGUAGES } from './utils/languages.ts';
import { detectUserLocation } from './utils/location.ts';
import { Home, Camera, Mic, MapPin, AlertCircle } from 'lucide-react';

export default function App() {
  const [location, setLocation] = useState<LocationContext | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<VoiceLanguage>(SUPPORTED_LANGUAGES[0]);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CropAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'home' | 'scan' | 'voice' | 'location'>('home');

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const loc = await detectUserLocation();
      setLocation(loc);
    } catch (err) {
      console.warn('Location detection failed:', err);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  useEffect(() => {
    handleDetectLocation();
  }, []);

  const handleAnalyzeCrop = async (imageBase64: string, mimeType: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setScannedImage(imageBase64);

    try {
      const res = await fetch('/api/analyze-crop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          location: location || undefined,
          currentDate: location?.dateStr || new Date().toISOString(),
          month: location?.month || 'October',
          season: location?.season || 'Post-Monsoon',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `Analysis failed (${res.status})`);
      }

      const data: CropAnalysisResult = await res.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error('Crop analysis failed:', err);
      setErrorMessage(
        err?.message || 'Could not analyze crop photo. Please verify image clarity and try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleScanAnother = () => {
    setAnalysisResult(null);
    setScannedImage(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#DDE6DE] flex items-center justify-center sm:py-6 p-0 font-sans selection:bg-emerald-200">
      {/* Mobile Phone Mockup Frame (Just like the reference image!) */}
      <div className="w-full sm:max-w-[420px] min-h-screen sm:min-h-[840px] sm:max-h-[92vh] bg-[#F3F7F3] sm:rounded-[44px] shadow-2xl sm:border-[8px] sm:border-slate-900 flex flex-col overflow-hidden relative">
        {/* Top iOS Status Bar Notch Accent */}
        <div className="hidden sm:flex items-center justify-between px-7 pt-3 text-[11px] font-bold text-slate-800">
          <span>11:30</span>
          <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto" />
          <div className="flex items-center gap-1">
            <span className="text-[10px]">5G</span>
            <div className="w-4 h-2 rounded-sm border border-slate-800 p-0.5 flex items-center">
              <div className="w-2 h-1 bg-slate-800 rounded-xs" />
            </div>
          </div>
        </div>

        {/* Header */}
        <Header
          location={location}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
          onRequestLocation={handleDetectLocation}
          isDetectingLocation={isDetectingLocation}
        />

        {/* Scrollable Screen Content */}
        <div className="flex-1 overflow-y-auto px-4 py-2 pb-24 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-700 text-xs shadow-sm">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-600 hover:text-red-900 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Active View: Scanner vs Diagnosis Result */}
          {!analysisResult ? (
            <CropScanner
              onAnalyze={handleAnalyzeCrop}
              isAnalyzing={isAnalyzing}
              location={location}
              onRequestLocation={handleDetectLocation}
              onOpenVoice={() => setIsVoiceModalOpen(true)}
            />
          ) : (
            scannedImage && (
              <AnalysisReport
                result={analysisResult}
                location={location}
                scannedImage={scannedImage}
                selectedLanguage={selectedLanguage}
                onOpenVoiceAssistant={() => setIsVoiceModalOpen(true)}
                onScanAnother={handleScanAnother}
              />
            )
          )}
        </div>

        {/* Floating Bottom Nav Dock (Exactly matching Screen 2 in reference image) */}
        <div className="absolute bottom-4 inset-x-4 z-30 pointer-events-auto">
          <div className="bg-[#1C3E2D] text-white rounded-full p-1.5 shadow-xl flex items-center justify-around border border-emerald-900/60 backdrop-blur-md">
            {/* Home Tab */}
            <button
              onClick={() => {
                setActiveTab('home');
                handleScanAnother();
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'home' && !analysisResult
                  ? 'bg-emerald-600/80 text-white shadow-sm'
                  : 'text-emerald-200/80 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>HOME</span>
            </button>

            {/* Quick Scan Action */}
            <button
              onClick={() => {
                setActiveTab('scan');
                handleScanAnother();
              }}
              className="w-10 h-10 rounded-full bg-white text-emerald-900 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
              title="Camera Scan"
            >
              <Camera className="w-4 h-4 text-emerald-800" />
            </button>

            {/* Voice AI */}
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold text-emerald-200/80 hover:text-white"
              title="Talk to AI"
            >
              <Mic className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span className="hidden sm:inline">VOICE</span>
            </button>

            {/* Location / Season */}
            <button
              onClick={handleDetectLocation}
              className="p-2.5 rounded-full text-emerald-200/80 hover:text-white"
              title="Refresh Location Context"
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Voice Assistant Modal */}
        {analysisResult && (
          <VoiceAssistantModal
            isOpen={isVoiceModalOpen}
            onClose={() => setIsVoiceModalOpen(false)}
            result={analysisResult}
            location={location}
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
          />
        )}
      </div>
    </div>
  );
}
