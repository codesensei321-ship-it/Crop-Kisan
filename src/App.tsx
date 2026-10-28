import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { CropScanner } from './components/CropScanner.tsx';
import { AnalysisReport } from './components/AnalysisReport.tsx';
import { VoiceAssistantModal } from './components/VoiceAssistantModal.tsx';
import { LocationContext, CropAnalysisResult, VoiceLanguage } from './types.ts';
import { SUPPORTED_LANGUAGES } from './utils/languages.ts';
import { detectUserLocation } from './utils/location.ts';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [location, setLocation] = useState<LocationContext | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<VoiceLanguage>(SUPPORTED_LANGUAGES[0]);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CropAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  const [isTranslatingReport, setIsTranslatingReport] = useState<boolean>(false);

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

  const handleLanguageChange = async (newLang: VoiceLanguage) => {
    setSelectedLanguage(newLang);

    // If report is already shown, translate the report into the new language!
    if (analysisResult) {
      setIsTranslatingReport(true);
      try {
        const res = await fetch('/api/translate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            report: analysisResult,
            targetLanguage: newLang.name,
          }),
        });

        if (res.ok) {
          const translatedData: CropAnalysisResult = await res.json();
          setAnalysisResult(translatedData);
        }
      } catch (err) {
        console.warn('Failed to translate existing report:', err);
      } finally {
        setIsTranslatingReport(false);
      }
    }
  };

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
          language: selectedLanguage.name,
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
    <div className="min-h-screen bg-[#E5ECE5] flex items-center justify-center font-sans selection:bg-emerald-200">
      {/* Responsive App Container */}
      <div className="w-full sm:max-w-md min-h-screen sm:min-h-[800px] sm:max-h-[95vh] bg-[#F3F7F3] sm:rounded-[36px] sm:shadow-2xl sm:border sm:border-emerald-900/10 flex flex-col overflow-hidden relative">
        {/* Header */}
        <Header
          location={location}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={handleLanguageChange}
          onRequestLocation={handleDetectLocation}
          isDetectingLocation={isDetectingLocation}
        />

        {/* Scrollable Screen Content */}
        <div className="flex-1 overflow-y-auto px-4 py-2 pb-6 space-y-4">
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
              selectedLanguage={selectedLanguage}
            />
          ) : (
            scannedImage && (
              <>
                {isTranslatingReport && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center justify-center gap-2 animate-pulse shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span>Translating report to {selectedLanguage.nativeName}...</span>
                  </div>
                )}
                <AnalysisReport
                  result={analysisResult}
                  location={location}
                  scannedImage={scannedImage}
                  selectedLanguage={selectedLanguage}
                  onOpenVoiceAssistant={() => setIsVoiceModalOpen(true)}
                  onScanAnother={handleScanAnother}
                />
              </>
            )
          )}
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
