// src/pages/RemindersPage.tsx
import type { Reminder } from "../types";

interface Props {
  reminders: Reminder[];
  newReminder: string;
  repeatMinutes: number;
  setNewReminder: (v: string) => void;
  setRepeatMinutes: (v: number) => void;
  onAdd: () => void;
  onComplete: (id: number) => void;
}

export function RemindersPage({
  reminders,
  newReminder,
  repeatMinutes,
  setNewReminder,
  setRepeatMinutes,
  onAdd,
  onComplete,
}: Props) {
  return (
    <div className="page-content fade-in">
      <h2 className="section-title">Reminders</h2>

      <div className="reminder-input">
        <input
          className="input"
          placeholder="New reminder..."
          value={newReminder}
          onChange={(e) => setNewReminder(e.target.value)}
        />

        <select
          className="select"
          value={repeatMinutes}
          onChange={(e) => setRepeatMinutes(Number(e.target.value))}
        >
          <option value={15}>Every 15 min</option>
          <option value={30}>Every 30 min</option>
          <option value={60}>Every 60 min</option>
        </select>

        <button onClick={onAdd} className="button-small">
          Add
        </button>
      </div>

      {reminders.map((r) => (
        <div key={r.id} className="list-item">
          <span>
            {r.text} • {r.repeatEveryMin} min
          </span>

          {!r.completed ? (
            <button onClick={() => onComplete(r.id)} className="button-small">
              Done
            </button>
          ) : (
            <span className="completed">Completed</span>
          )}
        </div>
      ))}
    </div>
  );
}