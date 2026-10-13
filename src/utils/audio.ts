/**
 * Audio processing utilities for Gemini Live API & Web Audio
 */

/**
 * Convert Float32Array (Web Audio PCM) to 16-bit linear PCM ArrayBuffer
 */
export function float32ToInt16PCM(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp to -1 to +1 range
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
}

/**
 * Downsample audio buffer to 16kHz for Gemini Live API input
 */
export function downsampleTo16k(
  inputBuffer: Float32Array,
  inputSampleRate: number
): Float32Array {
  if (inputSampleRate === 16000) {
    return inputBuffer;
  }
  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(inputBuffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetInput = 0;

  while (offsetResult < result.length) {
    const nextOffsetInput = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetInput; i < nextOffsetInput && i < inputBuffer.length; i++) {
      accum += inputBuffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : inputBuffer[offsetInput] || 0;
    offsetResult++;
    offsetInput = nextOffsetInput;
  }

  return result;
}

/**
 * Convert raw Int16 PCM array to base64
 */
export function int16ToBase64(int16Array: Int16Array): string {
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 raw 16-bit PCM little endian string to AudioBuffer (24kHz for Gemini Live output)
 */
export function base64PcmToAudioBuffer(
  base64: string,
  audioCtx: AudioContext,
  sampleRate = 24000
): AudioBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // 16-bit PCM = 2 bytes per sample
  const sampleCount = Math.floor(len / 2);
  const audioBuffer = audioCtx.createBuffer(1, sampleCount, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  const dataView = new DataView(bytes.buffer);
  for (let i = 0; i < sampleCount; i++) {
    // Little-endian 16-bit signed integer
    const int16 = dataView.getInt16(i * 2, true);
    channelData[i] = int16 / 32768.0;
  }

  return audioBuffer;
}

/**
 * Audio Queue Manager for jitter-free gapless audio playback
 */
export class AudioQueuePlayer {
  private audioCtx: AudioContext | null = null;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private onSpeakingChange?: (isSpeaking: boolean) => void;
  private speakingTimeout?: ReturnType<typeof setTimeout>;

  constructor(onSpeakingChange?: (isSpeaking: boolean) => void) {
    this.onSpeakingChange = onSpeakingChange;
  }

  private initCtx() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: 24000 });
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public enqueueChunk(base64Pcm: string, sampleRate = 24000) {
    this.initCtx();
    if (!this.audioCtx) return;

    try {
      const audioBuffer = base64PcmToAudioBuffer(base64Pcm, this.audioCtx, sampleRate);
      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioCtx.destination);

      const currentTime = this.audioCtx.currentTime;
      // If nextStartTime is in the past, reset to currentTime + small safety margin
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.05;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.activeSources.push(source);

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
        if (this.activeSources.length === 0) {
          this.notifySpeaking(false);
        }
      };

      this.notifySpeaking(true);
    } catch (err) {
      console.error('Failed to play audio chunk:', err);
    }
  }

  private notifySpeaking(speaking: boolean) {
    if (this.speakingTimeout) {
      clearTimeout(this.speakingTimeout);
    }
    if (speaking) {
      this.onSpeakingChange?.(true);
    } else {
      this.speakingTimeout = setTimeout(() => {
        this.onSpeakingChange?.(false);
      }, 300);
    }
  }

  public stopAll() {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // ignore already stopped
      }
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    }
    this.notifySpeaking(false);
  }

  public close() {
    this.stopAll();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
