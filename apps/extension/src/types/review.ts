export type Provider = 'groq' | 'openai' | 'anthropic' | 'google' | 'huggingface' | 'openrouter';

export interface Settings {
  provider: Provider;
  apiKey: string;
  model: string;
}

export interface ReviewRequest {
  diff: string;
}

export interface ReviewResponse {
  ok: boolean;
  review?: string;
  error?: string;
}

export interface Section {
  title: string;
  content: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  counts?: { critical: number; warning: number; info: number };
}
