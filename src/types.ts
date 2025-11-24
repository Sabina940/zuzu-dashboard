// src/types.ts

export interface SensorData {
  temperature: number | null; // °C
  light: number | null;       // lux
}

export interface PersonEvent {
  time: string;
  person: string;
  snapshotUrl?: string;
}

export interface Reminder {
  id: number;
  text: string;
  repeatEveryMin: number;
  completed: boolean;
}

export interface LampHistoryEntry {
  timestamp: string;
  on: boolean;
}