// src/pages/OverviewPage.tsx
import { useNavigate } from "react-router-dom";
import type { SensorData, PersonEvent, Reminder } from "../types";
import { Sparkline } from "../Sparkline";

interface Props {
  sensor: SensorData;
  people: PersonEvent[];
  reminders: Reminder[];
  lampOn: boolean;
  lampTodayMinutes: number | null;
  lampHistorySeries: number[];
}

export function OverviewPage({
  sensor,
  people,
  reminders,
  lampOn,
  lampTodayMinutes,
  lampHistorySeries,
}: Props) {
  const navigate = useNavigate();

  const latestPerson = people[0];
  const nextReminder = reminders.find((r) => !r.completed);
  const remindersDone = reminders.filter((r) => r.completed).length;
  const totalReminders = reminders.length;

  const homeHistory = [2, 4, 5, 3, 6, 7, 5]; // mock
  const lampSeries = lampHistorySeries.length ? lampHistorySeries : [0];
  const reminderHistory = [0, 1, 2, 2, 3, 4]; // mock

  const minutes = lampTodayMinutes ?? 0;
  const hoursPart = Math.floor(minutes / 60);
  const minsPart = Math.round(minutes % 60);
  const tempDisplay =
    sensor.temperature != null ? `${sensor.temperature.toFixed(1)} °C` : "—";
  const lightDisplay =
    sensor.light != null ? `${sensor.light.toFixed(0)} lx` : "—";

  const lampDisplay =
    minutes === 0
      ? "0 min"
      : `${hoursPart ? `${hoursPart}h ` : ""}${minsPart}m`;

  return (
    <div className="page-content fade-in">
      <h2 className="section-title">Quick overview</h2>
      <p className="section-description">
        Snapshot of your room status, people detections and reminder progress.
      </p>

      {/* main sensor cards */}
        <div className="card-grid">
          <div className="card card-hover">
            <h3>Temperature</h3>
            <p className="value">{tempDisplay}</p>
          </div>

          <div className="card card-hover">
            <h3>Light</h3>
            <p className="value">{lightDisplay}</p>
          </div>

        </div>

      {/* clickable mini stats with sparklines */}
      <div className="mini-stats">
        <div
          className="mini-card clickable"
          onClick={() => navigate("/faces")}
        >
          <span className="mini-label">Time at home today</span>
          <span className="mini-value">5h 20m</span>
          <span className="mini-sub">based on entry/exit events</span>
          <Sparkline data={homeHistory} color="#22c55e" />
        </div>

        <div
          className="mini-card clickable"
          onClick={() => navigate("/lamp-history")}
        >
          <span className="mini-label">Lamp on today</span>
          <span className="mini-value">{lampDisplay}</span>
          <span className="mini-sub">
            currently <strong>{lampOn ? "ON" : "OFF"}</strong>
          </span>
          <Sparkline data={lampSeries} color="#fbbf24" />
        </div>

        <div
          className="mini-card clickable"
          onClick={() => navigate("/reminders")}
        >
          <span className="mini-label">Reminders done</span>
          <span className="mini-value">
            {remindersDone} / {totalReminders || 0}
          </span>
          <span className="mini-sub">
            {remindersDone === totalReminders && totalReminders > 0
              ? "All caught up 💪"
              : "Keep going!"}
          </span>
          <Sparkline data={reminderHistory} color="#4a6cff" />
        </div>
      </div>

      {/* panels below */}
      <div className="overview-grid">
        <div className="panel">
          <h3>Last person seen</h3>
          {latestPerson ? (
            <p>
              <strong>{latestPerson.person}</strong> at {latestPerson.time}
            </p>
          ) : (
            <p>No one seen yet.</p>
          )}
        </div>

        <div className="panel">
          <h3>Next reminder</h3>
          {nextReminder ? (
            <p>
              {nextReminder.text} • every {nextReminder.repeatEveryMin} min
            </p>
          ) : (
            <p>Nothing pending. You’re free ✨</p>
          )}
        </div>
      </div>
    </div>
  );
}