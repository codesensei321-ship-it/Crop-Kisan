import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  SwitchCamera,
  X,
  Scan,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Sun,
  Zap,
  Leaf,
  MapPin,
} from 'lucide-react';
import { LocationContext, VoiceLanguage } from '../types.ts';
import { compressImage } from '../utils/imageCompress.ts';
import { getTranslations } from '../utils/translations.ts';

interface CropScannerProps {
  onAnalyze: (imageBase64: string, mimeType: string) => void;
  isAnalyzing: boolean;
  location: LocationContext | null;
  onRequestLocation: () => void;
  selectedLanguage: VoiceLanguage;
}

export const CropScanner: React.FC<CropScannerProps> = ({
  onAnalyze,
  isAnalyzing,
  location,
  onRequestLocation,
  selectedLanguage,
}) => {
  const t = getTranslations(selectedLanguage.id);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (isCameraActive && videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch((err) => console.warn('Video play error:', err));
    }
  }, [isCameraActive]);

  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    stopCamera();
    setCameraError(null);
    setIsCameraActive(true);

    if (!location) {
      onRequestLocation();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Live camera stream error:', err);
      setCameraError(t.cameraUnavailable);
      setIsCameraActive(false);
      nativeCameraInputRef.current?.click();
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);

    stopCamera();
    setIsCompressing(true);

    try {
      const compressed = await compressImage(rawDataUrl, 1280, 0.82);
      setPreviewImage(compressed.dataUrl);
      setImageMimeType('image/jpeg');
    } catch {
      setPreviewImage(rawDataUrl);
      setImageMimeType('image/jpeg');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!location) {
      onRequestLocation();
    }

    setIsCompressing(true);
    stopCamera();

    try {
      const compressed = await compressImage(file, 1280, 0.82);
      setPreviewImage(compressed.dataUrl);
      setImageMimeType('image/jpeg');
    } catch (err) {
      console.warn('Compression error, loading raw file:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewImage(event.target.result as string);
          setImageMimeType(file.type || 'image/jpeg');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleStartAnalysis = () => {
    if (!previewImage) return;
    onAnalyze(previewImage, imageMimeType);
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input elements */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Live Camera Viewfinder */}
      {isCameraActive && (
        <div className="relative rounded-[32px] overflow-hidden bg-black aspect-[3/4] max-h-[560px] mx-auto shadow-2xl flex flex-col justify-between border-2 border-emerald-500/40">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="relative z-10 p-4 flex items-center justify-between text-white">
            <button
              onClick={stopCamera}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="font-bold text-xs tracking-wide bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
              {t.liveCameraFeed}
            </span>
            <button
              onClick={toggleCameraFacing}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          </div>

          <div className="relative z-10 flex-1 flex items-center justify-center pointer-events-none p-8">
            <div className="w-64 h-64 relative">
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#86EFAC] rounded-tl-3xl shadow-[0_0_16px_rgba(134,239,172,0.8)]" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#86EFAC] rounded-tr-3xl shadow-[0_0_16px_rgba(134,239,172,0.8)]" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#86EFAC] rounded-bl-3xl shadow-[0_0_16px_rgba(134,239,172,0.8)]" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#86EFAC] rounded-br-3xl shadow-[0_0_16px_rgba(134,239,172,0.8)]" />
            </div>
          </div>

          <div className="relative z-10 p-6 flex flex-col items-center gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <button
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/30 backdrop-blur-sm active:scale-90 transition-transform cursor-pointer shadow-lg"
            >
              <div className="w-15 h-15 rounded-full bg-white shadow-inner" />
            </button>
            <button
              onClick={() => {
                stopCamera();
                galleryInputRef.current?.click();
              }}
              className="text-xs text-white/90 hover:text-white underline cursor-pointer font-medium"
            >
              {t.orUploadGallery}
            </button>
          </div>
        </div>
      )}

      {/* Analyzing / Compressing Loading State */}
      {(isAnalyzing || isCompressing) && (
        <div className="bg-white rounded-[32px] p-8 text-center shadow-sm border border-emerald-100 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Scan className="w-8 h-8 text-emerald-700 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              {isCompressing ? t.optimizingPhoto : t.identifyingCondition}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isCompressing
                ? t.compressingDesc
                : `${t.matchingDesc} (${location?.season?.split('(')[0] || ''})`}
            </p>
          </div>
          <div className="w-48 mx-auto bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      )}

      {/* Preview View: Photo Ready for Analysis */}
      {previewImage && !isCameraActive && !isAnalyzing && !isCompressing && (
        <div className="bg-white rounded-[32px] p-4 shadow-sm border border-emerald-100 space-y-4">
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-950 flex items-center justify-center">
            <img src={previewImage} alt="Crop sample" className="w-full h-full object-cover" />

            <div className="absolute inset-8 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#86EFAC] rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#86EFAC] rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#86EFAC] rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#86EFAC] rounded-br-2xl" />
            </div>

            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-xs cursor-pointer hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1 text-emerald-800 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {t.photoReady}
            </span>
            <span className="font-semibold text-slate-700">
              {location?.district || location?.state || t.autoLocation}
            </span>
          </div>

          <button
            onClick={handleStartAnalysis}
            className="w-full py-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            {t.analyzeCrop}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Home Screen: Elevated, Clean, Tactile Mobile Experience */}
      {!previewImage && !isCameraActive && !isAnalyzing && !isCompressing && (
        <div className="space-y-4">
          {/* Top Live Status & Regional Badge */}
          <div className="flex items-center justify-between px-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-[11px] font-bold border border-emerald-200/60 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              {t.onlineBadge}
            </span>

            {location && (
              <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-700" />
                {location.district || location.state}
              </span>
            )}
          </div>

          {/* Headline */}
          <div className="px-1 pt-0.5">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {t.diagnosingHeading}<br />
              <span className="text-emerald-700 underline decoration-emerald-300 decoration-wavy underline-offset-4">
                {t.diagnosingHighlight}
              </span>
            </h2>
          </div>

          {/* Camera Error Alert if live stream failed */}
          {cameraError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs flex items-center justify-between shadow-2xs">
              <span>{cameraError}</span>
              <button
                onClick={() => setCameraError(null)}
                className="font-bold text-amber-900 ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* High-Impact AI Plant Scan Hero Card */}
          <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-5 relative overflow-hidden">
            {/* Viewfinder Graphic Centerpiece */}
            <div className="relative rounded-2xl bg-gradient-to-b from-emerald-50/70 to-emerald-100/40 border border-emerald-100 p-6 flex flex-col items-center justify-center text-center overflow-hidden">
              {/* Corner target reticles */}
              <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-emerald-600 rounded-tl-sm" />
              <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-emerald-600 rounded-tr-sm" />
              <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-emerald-600 rounded-bl-sm" />
              <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-emerald-600 rounded-br-sm" />

              <div className="w-16 h-16 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-md mb-2 relative">
                <Leaf className="w-8 h-8 text-emerald-200 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Scan className="w-3 h-3 text-white" />
                </span>
              </div>

              <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                {t.aiPlantScan}
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-[240px] leading-relaxed">
                {t.aiPlantScanDesc}
              </p>
            </div>

            {/* Direct Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={() => startCamera('environment')}
                className="w-full py-4 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-md active:scale-98 transition-all cursor-pointer"
              >
                <Camera className="w-5 h-5 text-emerald-300" />
                {t.openCamera}
              </button>

              <button
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-50 hover:bg-emerald-50/60 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200/80 active:scale-98"
              >
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                {t.uploadGallery}
              </button>
            </div>

            {/* 3 Visual Guidance Pills */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100 text-[10px] text-slate-600 font-semibold text-center">
              <div className="flex flex-col items-center gap-1 p-1 rounded-lg bg-slate-50/60">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate w-full">{t.clearLeafTip}</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-1 rounded-lg bg-slate-50/60">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="truncate w-full">{t.sunlightTip}</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-1 rounded-lg bg-slate-50/60">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate w-full">{t.instantAdviceTip}</span>
              </div>
            </div>
          </div>

          {/* Friendly Field Tip Card */}
          <div className="p-3.5 bg-white/80 backdrop-blur-xs rounded-2xl border border-emerald-100/80 flex items-start gap-2.5 text-xs text-slate-700 shadow-2xs">
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <p className="leading-relaxed text-[11px] text-slate-600">
              {t.homeTip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
