import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateGamePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function calculateScore(isCorrect: boolean, responseTimeMs: number, maxTimeMs: number = 20000): number {
  if (!isCorrect) return 0;
  
  // Ensure response time is within bounds
  const boundedTime = Math.min(Math.max(responseTimeMs, 0), maxTimeMs);
  
  // Calculate score based on response time
  // Maximum score (1000) for instant response
  // Minimum score (100) for response at maxTimeMs
  // Linear decrease between these points
  const timeRatio = 1 - (boundedTime / maxTimeMs);
  return Math.round(100 + (timeRatio * 900));
}

export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const deciseconds = Math.floor((ms % 1000) / 100);
  return `${seconds}.${deciseconds}s`;
}

export async function generateQuestionsFromText(text: string): Promise<any[]> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz-questions`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate questions');
    }

    const data = await response.json();
    return data.questions.map((q: any, index: number) => ({
      ...q,
      order: index
    }));
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
}

export const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="0%" />
      <stop stop-color="#edeef1" offset="20%" />
      <stop stop-color="#f6f7f8" offset="40%" />
      <stop stop-color="#f6f7f8" offset="100%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

export const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);