// src/pages/RemindersPage.tsx
import { useEffect, useState } from "react";
import type { Reminder } from "../types";
import {
  apiGetReminders,
  apiAddReminder,
  apiCompleteReminder,
  apiDeleteReminder,
} from "../api";

export function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newText, setNewText] = useState("");
  const [repeatEveryMin, setRepeatEveryMin] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- load from backend ----------
  async function loadReminders() {
    try {
      setError(null);
      const list = await apiGetReminders();
      setReminders(list);
    } catch (e: any) {
      console.error(e);
      setError("Could not load reminders");
    }
  }

  useEffect(() => {
    loadReminders();
  }, []);

  // ---------- handlers ----------

  async function handleAdd() {
    if (!newText.trim()) return;
    setLoading(true);
    try {
      await apiAddReminder(newText.trim(), repeatEveryMin);
      setNewText("");
      await loadReminders();
    } catch (e: any) {
      console.error(e);
      setError("Could not add reminder");
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(id: number) {
    setLoading(true);
    try {
      await apiCompleteReminder(id);
      await loadReminders();
    } catch (e: any) {
      console.error(e);
      setError("Could not complete reminder");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    setLoading(true);
    try {
      await apiDeleteReminder(id);
      await loadReminders();
    } catch (e: any) {
      console.error(e);
      setError("Could not delete reminder");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>Reminders</h1>

      {error && <div className="error">{error}</div>}

      <div className="reminder-input-row">
        <input
          placeholder="New reminder..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />

        <select
          value={repeatEveryMin}
          onChange={(e) => setRepeatEveryMin(Number(e.target.value))}
        >
          <option value={15}>Every 15 min</option>
          <option value={30}>Every 30 min</option>
          <option value={60}>Every 60 min</option>
        </select>

        <button onClick={handleAdd} disabled={loading}>
          Add
        </button>
      </div>

      {loading && <div className="loading">Loading…</div>}

      <div className="reminder-list">
        {reminders.map((r) => (
          <div key={r.id} className="list-item">
            <span>
              {r.text} • {r.interval_min} min
            </span>

            <div>
              {!r.completed ? (
                <button onClick={() => handleComplete(r.id)}>Done</button>
              ) : (
                <span className="completed">Completed</span>
              )}

              <button onClick={() => handleDelete(r.id)} className="danger">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}