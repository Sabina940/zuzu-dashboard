// src/api.ts
import type { Reminder } from "./types";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://192.168.0.221:8000";

// ---------- REMINDERS ----------

export async function apiGetReminders(): Promise<Reminder[]> {
  const res = await fetch(`${API_BASE}/api/reminders`);
  if (!res.ok) throw new Error("Failed to fetch reminders");
  const data = await res.json();
  // backend returns {reminders: [...]}
  return data.reminders as Reminder[];
}

export async function apiAddReminder(
  text: string,
  interval_min: number
): Promise<Reminder> {
  const res = await fetch(`${API_BASE}/api/reminders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, interval_min }),
  });
  if (!res.ok) throw new Error("Failed to add reminder");
  const data = await res.json();
  return data.reminder as Reminder;
}

export async function apiCompleteReminder(id: number): Promise<Reminder> {
  const res = await fetch(`${API_BASE}/api/reminders/${id}/complete`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to complete reminder");
  const data = await res.json();
  return data.reminder as Reminder;
}

export async function apiDeleteReminder(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/reminders/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete reminder");
}