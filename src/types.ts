export type GestureId =
  | 'open_palm'
  | 'peace'
  | 'finger_heart'
  | 'ily'
  | 'thumbs_up'
  | 'two_hand_heart';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface GestureDefinition {
  id: GestureId;
  order: string;
  symbol: string;
  gestureName: string;
  shortHint: string;
  detailGuide: string;
}

export interface CustomNoteContent {
  title: string;
  message: string;
}

export interface QuestConfig {
  recipientName: string;
  senderName: string;
  headerTagline: string;
  introSubtitle: string;
  notes: Record<GestureId, CustomNoteContent>;
  finalLetterTitle: string;
  finalLetterGreeting: string;
  finalLetterBody: string;
  finalLetterSignoff: string;
}

export interface DetectionFrame {
  gesture: GestureId | null;
  confidence: number;
  handsCount: number;
  anchor: { x: number; y: number } | null;
  landmarks: Point3D[][];
}

export type CameraFilter = 'natural' | 'warm_film' | 'mono';
