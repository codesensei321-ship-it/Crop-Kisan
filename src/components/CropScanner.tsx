import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  SwitchCamera,
  X,
  Scan,
  Sparkles,
  ArrowRight,
  Search,
  Mic,
  SunMedium,
  CheckCircle,
} from 'lucide-react';
import { LocationContext } from '../types.ts';
import { SAMPLE_CROPS, SampleCrop, rasterizeSvgToPngDataUrl } from '../utils/sampleCrops.ts';

interface CropScannerProps {
  onAnalyze: (imageBase64: string, mimeType: string) => void;
  isAnalyzing: boolean;
  location: LocationContext | null;
  onRequestLocation: () => void;
  onOpenVoice: () => void;
}

export const CropScanner: React.FC<CropScannerProps> = ({
  onAnalyze,
  isAnalyzing,
  location,
  onRequestLocation,
  onOpenVoice,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream cleanly
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start device camera
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    stopCamera();
    setCameraError(null);
    try {
      if (!location) {
        onRequestLocation();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera unavailable. Please upload a photo.');
      setIsCameraActive(false);
      fileInputRef.current?.click();
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setPreviewImage(dataUrl);
    setImageMimeType('image/jpeg');
    stopCamera();
  };

  // Upload file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!location) {
      onRequestLocation();
    }

    const mime = file.type || 'image/jpeg';
    setImageMimeType(mime);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviewImage(event.target.result as string);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  // Select sample specimen
  const handleSelectSample = async (sample: SampleCrop) => {
    if (!location) {
      onRequestLocation();
    }
    const pngDataUrl = await rasterizeSvgToPngDataUrl(sample.dataUrl);
    setPreviewImage(pngDataUrl);
    setImageMimeType('image/png');
    stopCamera();
  };

  const handleStartAnalysis = () => {
    if (!previewImage) return;
    onAnalyze(previewImage, imageMimeType);
  };

  const filteredSamples = SAMPLE_CROPS.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.expectedCondition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Camera Viewfinder (Matches Screen 3 with neon brackets) */}
      {isCameraActive && (
        <div className="relative rounded-[32px] overflow-hidden bg-black aspect-[3/4] max-h-[560px] mx-auto shadow-lg flex flex-col justify-between">
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Top header overlay */}
          <div className="relative z-10 p-4 flex items-center justify-between text-white">
            <button
              onClick={stopCamera}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm tracking-wide bg-black/40 backdrop-blur-md px-3.5 py-1 rounded-full">
              AI Plant Scan
            </span>
            <button
              onClick={toggleCameraFacing}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          </div>

          {/* Center Scan Reticle (Exactly matching the reference image's green rounded corners) */}
          <div className="relative z-10 flex-1 flex items-center justify-center pointer-events-none p-8">
            <div className="w-64 h-64 relative">
              {/* Top-left */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#86EFAC] rounded-tl-3xl shadow-[0_0_12px_rgba(134,239,172,0.6)]" />
              {/* Top-right */}
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#86EFAC] rounded-tr-3xl shadow-[0_0_12px_rgba(134,239,172,0.6)]" />
              {/* Bottom-left */}
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#86EFAC] rounded-bl-3xl shadow-[0_0_12px_rgba(134,239,172,0.6)]" />
              {/* Bottom-right */}
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#86EFAC] rounded-br-3xl shadow-[0_0_12px_rgba(134,239,172,0.6)]" />
            </div>
          </div>

          {/* Bottom Shutter Action */}
          <div className="relative z-10 p-6 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent">
            <button
              onClick={capturePhoto}
              className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center bg-white/30 backdrop-blur-sm active:scale-90 transition-transform"
            >
              <div className="w-13 h-13 rounded-full bg-white" />
            </button>
          </div>
        </div>
      )}

      {/* Analyzing Loading View */}
      {isAnalyzing && (
        <div className="bg-white rounded-[32px] p-8 text-center shadow-sm border border-emerald-100 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Scan className="w-8 h-8 text-emerald-700 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">
              Identifying Crop...
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Matching symptoms &amp; {location?.season?.split('(')[0] || 'seasonal climate'}
            </p>
          </div>
          <div className="w-48 mx-auto bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      )}

      {/* Preview View: Ready to Analyze */}
      {previewImage && !isCameraActive && !isAnalyzing && (
        <div className="bg-white rounded-[32px] p-4 shadow-sm border border-emerald-100 space-y-4">
          {/* Photo with scan bracket overlay */}
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-950 flex items-center justify-center">
            <img src={previewImage} alt="Crop sample" className="w-full h-full object-cover" />

            {/* Neon scan reticle overlay */}
            <div className="absolute inset-8 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#86EFAC] rounded-tl-2xl shadow-[0_0_8px_rgba(134,239,172,0.8)]" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#86EFAC] rounded-tr-2xl shadow-[0_0_8px_rgba(134,239,172,0.8)]" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#86EFAC] rounded-bl-2xl shadow-[0_0_8px_rgba(134,239,172,0.8)]" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#86EFAC] rounded-br-2xl shadow-[0_0_8px_rgba(134,239,172,0.8)]" />
            </div>

            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Ready for diagnosis</span>
            <span className="font-semibold text-emerald-800">
              {location?.district || location?.state || 'Auto Location'}
            </span>
          </div>

          {/* Big Action Pill */}
          <button
            onClick={handleStartAnalysis}
            className="w-full py-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform"
          >
            <Sparkles className="w-4 h-4" />
            Analyze Crop
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Default Dashboard Home View (Matching Screen 2 of reference image) */}
      {!previewImage && !isCameraActive && !isAnalyzing && (
        <div className="space-y-4">
          {/* Main Headline */}
          <div className="px-1">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              What Are We<br />
              <span className="text-emerald-700">Diagnosing</span> Today?
            </h2>
          </div>

          {/* Search Bar matching screenshot */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crops, problems..."
              className="w-full h-12 bg-white rounded-2xl pl-11 pr-11 text-xs text-slate-800 placeholder-slate-400 border border-emerald-100/60 shadow-sm focus:outline-none focus:border-emerald-600"
            />
            <button
              onClick={() => startCamera('environment')}
              className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              <Scan className="w-4 h-4" />
            </button>
          </div>

          {/* Main Hero Card: "AI Plant Scan" matching Screen 2 */}
          <div className="bg-white rounded-[28px] p-5 border border-emerald-100/80 shadow-sm flex items-center justify-between gap-3 relative overflow-hidden">
            <div className="space-y-3 z-10 max-w-[180px]">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                  AI Plant Scan
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Identify any crop disease in seconds
                </p>
              </div>

              <button
                onClick={() => startCamera('environment')}
                className="px-4 py-2 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
              >
                Scan Now
              </button>
            </div>

            {/* Potted plant / foliage preview with subtle scan brackets */}
            <div className="w-32 h-32 rounded-2xl bg-emerald-50/60 border border-emerald-100 p-2 flex items-center justify-center relative shrink-0">
              <img
                src={SAMPLE_CROPS[0].dataUrl}
                alt="Plant specimen"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-1.5 pointer-events-none">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-500 rounded-tl-md" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-500 rounded-tr-md" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-500 rounded-bl-md" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-500 rounded-br-md" />
              </div>
            </div>
          </div>

          {/* 4-Item Quick Action Row matching Screen 2 */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => startCamera('environment')}
              className="bg-white rounded-2xl p-3 border border-emerald-100/70 shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700">Camera</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white rounded-2xl p-3 border border-emerald-100/70 shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700">Upload</span>
            </button>

            <button
              onClick={onOpenVoice}
              className="bg-white rounded-2xl p-3 border border-emerald-100/70 shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700">Voice AI</span>
            </button>

            <button
              onClick={onRequestLocation}
              className="bg-white rounded-2xl p-3 border border-emerald-100/70 shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <SunMedium className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700">Season</span>
            </button>
          </div>

          {/* Quick Test Specimens Section matching "Recent Identifications" in Screen 2 */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-extrabold text-sm text-slate-900">
                Quick Test Specimens
              </h3>
              <span className="text-[11px] text-emerald-700 font-semibold">1-Tap Test</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {filteredSamples.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="bg-white rounded-2xl p-2.5 border border-emerald-100/80 shadow-sm text-left flex items-center gap-2.5 active:scale-98 transition-transform group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden shrink-0">
                    <img
                      src={sample.dataUrl}
                      alt={sample.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {sample.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {sample.expectedCondition.split('(')[0]}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
