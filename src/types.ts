export type SeverityLevel = 'None (Healthy)' | 'Low' | 'Medium' | 'High' | 'Critical';

export interface LocationContext {
  latitude?: number;
  longitude?: number;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  season?: string;
  dateStr?: string;
  month?: string;
}

export interface CropAnalysisResult {
  isCropOrPlant: boolean;
  isIdentifiable: boolean;
  unclearReason?: string;
  cropName: string;
  cropScientificName?: string;
  diseaseName: string;
  isHealthy: boolean;
  confidence: number; // 0 to 100
  severity: SeverityLevel;
  symptoms: string[];
  pestDamage: string[];
  nutrientDeficiencies: string[];
  causesAndContext: string[];
  immediateActions: string[];
  preventionAdvice: string[];
  whenToContactExpert: string;
  seasonalLocalizedNote: string;
  timestamp: string;
}

export interface VoiceLanguage {
  id: string;
  name: string;
  nativeName: string;
  code: string;
  greeting: string;
  sampleQuestion: string;
}

export interface TranscriptEntry {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
