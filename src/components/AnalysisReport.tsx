import React from 'react';
import {
  RotateCcw,
  Mic,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { CropAnalysisResult, LocationContext, VoiceLanguage } from '../types.ts';
import { getTranslations } from '../utils/translations.ts';

interface AnalysisReportProps {
  result: CropAnalysisResult;
  location: LocationContext | null;
  scannedImage: string;
  selectedLanguage: VoiceLanguage;
  onOpenVoiceAssistant: () => void;
  onScanAnother: () => void;
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({
  result,
  location,
  scannedImage,
  selectedLanguage,
  onOpenVoiceAssistant,
  onScanAnother,
}) => {
  const t = getTranslations(selectedLanguage.id);

  // Unclear / Non-plant case
  if (!result.isIdentifiable || !result.isCropOrPlant) {
    return (
      <div className="bg-white rounded-[32px] p-6 border border-emerald-100 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
          <HelpCircle className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            {t.unclearPhotoTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
            {result.unclearReason || t.unclearPhotoDesc}
          </p>
        </div>

        <div className="w-40 h-40 mx-auto rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
          <img src={scannedImage} alt="Sample" className="w-full h-full object-cover" />
        </div>

        <button
          onClick={onScanAnother}
          className="w-full py-3.5 rounded-2xl bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          {t.retakePhoto}
        </button>
      </div>
    );
  }

  const confidenceScore = Math.round(result.confidence || 85);

  const getSeverityColor = () => {
    switch (result.severity) {
      case 'None (Healthy)':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Low':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'High':
      case 'Critical':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Plant Card matching Screen 3 bottom sheet */}
      <div className="bg-white rounded-[32px] p-5 border border-emerald-100/80 shadow-sm space-y-4">
        {/* Plant Image + Retake Header */}
        <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-950">
          <img
            src={scannedImage}
            alt={result.cropName}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onScanAnother}
            className="absolute top-3 right-3 h-8 px-3 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1 active:scale-95 cursor-pointer hover:bg-black/80"
          >
            <RotateCcw className="w-3 h-3" /> {t.scanNew}
          </button>
          {location && (
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              {location.district || location.state} • {location.season?.split('(')[0]}
            </div>
          )}
        </div>

        {/* Diagnosis Header */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {result.cropName}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityColor()}`}>
              {result.severity}
            </span>
          </div>

          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            {result.diseaseName}
          </h1>

          {/* Confidence bar matching Screen 3 */}
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs font-bold text-emerald-800">
              <span>{confidenceScore}% {t.matchScore}</span>
              <span className="text-[10px] font-normal text-slate-400">{t.aiConfidence}</span>
            </div>
            <div className="w-full bg-emerald-50 h-2 rounded-full overflow-hidden border border-emerald-100">
              <div
                className="bg-emerald-700 h-full rounded-full transition-all duration-500"
                style={{ width: `${confidenceScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* "Talk to AI" Button */}
        <button
          onClick={onOpenVoiceAssistant}
          className="w-full py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-transform cursor-pointer"
        >
          <Mic className="w-4 h-4 text-emerald-300 animate-pulse" />
          {t.talkToAi} ({selectedLanguage.nativeName})
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Action Cards (Super clean, concise bullet points) */}
      <div className="space-y-2.5">
        {/* Immediate Actions */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100/70 shadow-sm space-y-2">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            {t.whatToDoNow}
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {result.immediateActions?.slice(0, 3).map((action, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <span className="leading-snug">{action}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Visible Symptoms */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100/70 shadow-sm space-y-2">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            {t.observedSymptoms}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {result.symptoms?.map((s, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Prevention */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100/70 shadow-sm space-y-2">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            {t.preventionAdvice}
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {result.preventionAdvice?.slice(0, 2).map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                <span className="leading-snug">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 1-Line Disclaimer */}
      <p className="text-[10px] text-slate-400 text-center px-4 leading-tight">
        {t.disclaimer}
      </p>
    </div>
  );
};
