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

// src/types.ts

export interface Reminder {
  id: number;
  text: string;
  interval_min: number;     // how often it repeats
  completed: boolean;
  last_done_at: string | null;
}

export interface LampHistoryEntry {
  timestamp: string;
  on: boolean;
}