import { Point3D } from '../types';

export interface MediaPipeResults {
  multiHandLandmarks?: Point3D[][];
}

export interface MediaPipeHandsInstance {
  setOptions(options: {
    maxNumHands?: number;
    modelComplexity?: 0 | 1;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
    selfieMode?: boolean;
  }): void;
  onResults(callback: (results: MediaPipeResults) => void): void;
  send(input: { image: HTMLVideoElement }): Promise<void>;
  initialize(): Promise<void>;
  close(): Promise<void>;
}

declare global {
  interface Window {
    Hands?: new (config: { locateFile: (file: string) => string }) => MediaPipeHandsInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadMediaPipeHandsScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Hands) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-mediapipe-hands="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load MediaPipe Hands script')));
      return;
    }

    const script = document.createElement('script');
    script.src = '/mediapipe/hands/hands.js';
    script.async = true;
    script.dataset.mediapipeHands = 'true';
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load /mediapipe/hands/hands.js'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export async function createHandsDetector(
  onResults: (results: MediaPipeResults) => void
): Promise<MediaPipeHandsInstance> {
  await loadMediaPipeHandsScript();

  if (!window.Hands) {
    throw new Error('MediaPipe Hands constructor unavailable after loading runtime.');
  }

  const hands = new window.Hands({
    locateFile: (file: string) => `/mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.62,
    minTrackingConfidence: 0.58,
  });

  hands.onResults(onResults);
  await hands.initialize();

  return hands;
}
