import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  SwitchCamera,
  X,
  Scan,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { LocationContext } from '../types.ts';
import { SAMPLE_CROPS, SampleCrop, rasterizeSvgToPngDataUrl } from '../utils/sampleCrops.ts';
import { compressImage } from '../utils/imageCompress.ts';

interface CropScannerProps {
  onAnalyze: (imageBase64: string, mimeType: string) => void;
  isAnalyzing: boolean;
  location: LocationContext | null;
  onRequestLocation: () => void;
}

export const CropScanner: React.FC<CropScannerProps> = ({
  onAnalyze,
  isAnalyzing,
  location,
  onRequestLocation,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  // Pure gallery / file manager input (NO capture="environment")
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  // Native camera app fallback input
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

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

  // Ensure video element gets the stream as soon as it mounts in the DOM
  useEffect(() => {
    if (isCameraActive && videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch((err) => console.warn('Video play error:', err));
    }
  }, [isCameraActive]);

  // Start device camera
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
      setCameraError('Live viewfinder unavailable in this browser. Opening device camera.');
      setIsCameraActive(false);
      nativeCameraInputRef.current?.click();
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Capture photo from video feed and compress
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

  // Handle uploaded file from gallery/file manager and compress
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
      // reset input value so user can select same file again if desired
      e.target.value = '';
    }
  };

  // Handle sample specimen click
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
      {/* 1. File Manager / Photo Gallery Input (NO capture attribute: opens photo gallery/file manager) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 2. Direct Device Camera Shutter Fallback Input */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Camera Live Viewfinder Feed */}
      {isCameraActive && (
        <div className="relative rounded-[32px] overflow-hidden bg-black aspect-[3/4] max-h-[560px] mx-auto shadow-lg flex flex-col justify-between">
          <video
            ref={videoRef}
            autoPlay
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
            <span className="font-bold text-xs tracking-wide bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full">
              Live Camera Feed
            </span>
            <button
              onClick={toggleCameraFacing}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          </div>

          {/* Center Scan Reticle (Neon green rounded brackets) */}
          <div className="relative z-10 flex-1 flex items-center justify-center pointer-events-none p-8">
            <div className="w-64 h-64 relative">
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#86EFAC] rounded-tl-3xl shadow-[0_0_12px_rgba(134,239,172,0.6)]" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#86EFAC] rounded-tr-3xl shadow-[0_0_12px_rgba(134,239,172,0.6)]" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#86EFAC] rounded-bl-3xl shadow-[0_0_12px_rgba(134,239,172,0.6)]" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#86EFAC] rounded-br-3xl shadow-[0_0_12px_rgba(134,239,172,0.6)]" />
            </div>
          </div>

          {/* Bottom Shutter Controls */}
          <div className="relative z-10 p-6 flex flex-col items-center gap-3 bg-gradient-to-t from-black/70 to-transparent">
            <button
              onClick={capturePhoto}
              className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center bg-white/30 backdrop-blur-sm active:scale-90 transition-transform cursor-pointer"
            >
              <div className="w-13 h-13 rounded-full bg-white" />
            </button>
            <button
              onClick={() => {
                stopCamera();
                galleryInputRef.current?.click();
              }}
              className="text-xs text-white/80 hover:text-white underline"
            >
              Or upload from photo gallery
            </button>
          </div>
        </div>
      )}

      {/* Analyzing or Compressing Loading State */}
      {(isAnalyzing || isCompressing) && (
        <div className="bg-white rounded-[32px] p-8 text-center shadow-sm border border-emerald-100 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Scan className="w-8 h-8 text-emerald-700 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              {isCompressing ? 'Optimizing Photo...' : 'Identifying Crop Condition...'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isCompressing
                ? 'Compressing for instant upload'
                : `Matching symptoms & ${location?.season?.split('(')[0] || 'climate'}`}
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
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1 text-emerald-800 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Photo ready &amp; optimized
            </span>
            <span className="font-semibold text-slate-700">
              {location?.district || location?.state || 'Auto Location'}
            </span>
          </div>

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

      {/* Main Home Screen: Clean AI Plant Scan Card Only (As requested) */}
      {!previewImage && !isCameraActive && !isAnalyzing && !isCompressing && (
        <div className="space-y-4">
          {/* Headline */}
          <div className="px-1">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              What Are We<br />
              <span className="text-emerald-700">Diagnosing</span> Today?
            </h2>
          </div>

          {/* Search Bar */}
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
              title="Camera Scan"
            >
              <Scan className="w-4 h-4" />
            </button>
          </div>

          {/* Camera Error Alert if live stream failed */}
          {cameraError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs flex items-center justify-between">
              <span>{cameraError}</span>
              <button
                onClick={() => setCameraError(null)}
                className="font-bold text-amber-900 ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* ONLY AI Plant Scan Card (With direct camera access + gallery option) */}
          <div className="bg-white rounded-[28px] p-5 border border-emerald-100/80 shadow-sm space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1 max-w-[180px]">
                <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                  AI Plant Scan
                </h3>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Snap leaf with camera to diagnose disease in seconds
                </p>
              </div>

              {/* Plant illustration with scan brackets */}
              <div className="w-24 h-24 rounded-2xl bg-emerald-50/60 border border-emerald-100 p-1.5 flex items-center justify-center relative shrink-0">
                <img
                  src={SAMPLE_CROPS[0].dataUrl}
                  alt="Plant preview"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-1 pointer-events-none">
                  <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-500 rounded-tl-sm" />
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-500 rounded-tr-sm" />
                  <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-500 rounded-bl-sm" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-500 rounded-br-sm" />
                </div>
              </div>
            </div>

            {/* Direct Camera Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => startCamera('environment')}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-transform cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Open Camera &amp; Scan
              </button>

              <button
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                Upload from Photo Gallery
              </button>
            </div>
          </div>

          {/* Quick Test Specimens */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-extrabold text-xs text-slate-900">
                Quick Test Specimens
              </h3>
              <span className="text-[10px] text-emerald-700 font-semibold">1-Tap Test</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {filteredSamples.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="bg-white rounded-2xl p-2.5 border border-emerald-100/80 shadow-sm text-left flex items-center gap-2.5 active:scale-98 transition-transform group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-slate-900 overflow-hidden shrink-0">
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
