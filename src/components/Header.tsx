import React from 'react';
import { MapPin, Globe, Sparkles, Sprout } from 'lucide-react';
import { LocationContext, VoiceLanguage } from '../types.ts';
import { SUPPORTED_LANGUAGES } from '../utils/languages.ts';

interface HeaderProps {
  location: LocationContext | null;
  selectedLanguage: VoiceLanguage;
  onSelectLanguage: (lang: VoiceLanguage) => void;
  onRequestLocation: () => void;
  isDetectingLocation: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  location,
  selectedLanguage,
  onSelectLanguage,
  onRequestLocation,
  isDetectingLocation,
}) => {
  return (
    <header className="px-5 pt-4 pb-2">
      <div className="flex items-center justify-between">
        {/* Left: Avatar + Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold shadow-sm">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
                KisanDr <Sparkles className="w-3 h-3 text-emerald-600 inline" />
              </span>
            </div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
              AI Crop Doctor
            </h1>
          </div>
        </div>

        {/* Right: Location & Language Pills */}
        <div className="flex items-center gap-1.5">
          {/* Location button */}
          <button
            onClick={onRequestLocation}
            disabled={isDetectingLocation}
            title="Refresh location"
            className="h-9 px-2.5 rounded-full bg-white border border-emerald-100 shadow-sm flex items-center gap-1.5 text-xs text-slate-700 active:scale-95 transition-transform"
          >
            <MapPin className={`w-3.5 h-3.5 text-emerald-700 ${isDetectingLocation ? 'animate-bounce' : ''}`} />
            <span className="max-w-[80px] sm:max-w-[120px] truncate font-medium text-[11px]">
              {location?.district || location?.state || (isDetectingLocation ? '...' : 'Location')}
            </span>
          </button>

          {/* Language selector */}
          <div className="h-9 px-2 rounded-full bg-white border border-emerald-100 shadow-sm flex items-center gap-1 text-xs text-slate-700">
            <Globe className="w-3.5 h-3.5 text-emerald-700" />
            <select
              value={selectedLanguage.id}
              onChange={(e) => {
                const found = SUPPORTED_LANGUAGES.find((l) => l.id === e.target.value);
                if (found) onSelectLanguage(found);
              }}
              className="bg-transparent text-[11px] font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
