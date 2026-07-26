export type User = {
  id?: number;
  email: string;
  name: string;
  location?: string;
  land_size?: string;
};

export type AuthResponse = {
  success: boolean;
  user?: User;
  error?: string;
};

export type Stats = {
  total: number;
  crop: number;
  disease: number;
  fertilizer: number;
};

export type CropPredictionInput = {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
};

export type CropPredictionResult = {
  success: boolean;
  results: Array<{ crop: string; probability: number }>;
  error?: string;
};

export type SoilExtraction = Partial<Record<'nitrogen' | 'phosphorus' | 'potassium' | 'temperature' | 'humidity' | 'ph' | 'rainfall', number>>;

export type OcrScanResult = {
  success: boolean;
  extracted: SoilExtraction;
  raw_text: string;
  error?: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};
