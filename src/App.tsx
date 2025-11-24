import { useState, useEffect } from "react";
import { NavLink, Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://192.168.0.221:8000";


/* ------------------ TYPES & MOCKS ------------------ */
interface SensorData {
  temperature: number;
  light: number;
  humidity: number;
}

interface PersonEvent {
  time: string;
  person: string;
  snapshotUrl?: string;   // ← new, optional
}

interface Reminder {
  id: number;
  text: string;
  repeatEveryMin: number;
  completed: boolean;
}

const mockSensorData: SensorData = {
  temperature: 22.5,
  light: 120,
  humidity: 45,
};

const mockPeopleEvents: PersonEvent[] = [
  { time: "10:22", person: "Pierina" },
  { time: "08:17", person: "Unknown" },
];

const mockReminders: Reminder[] = [
  { id: 1, text: "Drink water", repeatEveryMin: 30, completed: false },
  { id: 2, text: "Do laundry", repeatEveryMin: 60, completed: false },
];

export default function App() {
  const [sensor] = useState<SensorData>(mockSensorData);
  const [people, setPeople] = useState<PersonEvent[]>(mockPeopleEvents);
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders);

  const [lampOn, setLampOn] = useState(false);
  const [lampLoading, setLampLoading] = useState(false);
  const [lampError, setLampError] = useState<string | null>(null);


  const [newReminder, setNewReminder] = useState("");
  const [repeatMinutes, setRepeatMinutes] = useState(30);


  useEffect(() => {
    const fetchLamp = async () => {
      try {
        setLampError(null);
        const res = await fetch(`${API_BASE}/api/lamp`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLampOn(Boolean(data.on));
      } catch (err) {
        console.error(err);
        setLampError("Could not reach Zuzu lamp API");
      }
    };

    fetchLamp();
  }, []);

    const handleLampToggle = async () => {
    try {
      setLampLoading(true);
      setLampError(null);
      const res = await fetch(`${API_BASE}/api/lamp/toggle`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLampOn(Boolean(data.on));
    } catch (err) {
      console.error(err);
      setLampError("Failed to toggle lamp");
    } finally {
      setLampLoading(false);
    }
  };

  function addReminder() {
    if (!newReminder.trim()) return;

    setReminders((old) => [
      ...old,
      {
        id: Date.now(),
        text: newReminder,
        repeatEveryMin: repeatMinutes,
        completed: false,
      },
    ]);

    setNewReminder("");
  }

  function completeReminder(id: number) {
    setReminders((old) =>
      old.map((r) => (r.id === id ? { ...r, completed: true } : r))
    );
  }

  // For Faces page – later this will be real labels from the model
  function renamePerson(index: number, newName: string) {
    setPeople((prev) =>
      prev.map((p, i) => (i === index ? { ...p, person: newName } : p))
    );
  }

  return (
    <div className="page">
      <div className="container">
        {/* HEADER */}
        <header className="header">
          <div>
            <h1 className="title">Zuzu! Dashboard</h1>
            <p className="subtitle">Your friendly room robot control center</p>
          </div>

          <button
            className={`lamp-badge ${lampOn ? "on" : "off"}`}
            onClick={handleLampToggle}
            disabled={lampLoading}
          >
            {lampLoading
              ? "⏳ Talking to Zuzu..."
              : lampOn
              ? "Lamp ON"
              : "Lamp OFF"}
          </button>
          {lampError && <p className="lamp-error">{lampError}</p>}
        </header>

        {/* NAVIGATION */}
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }>
            Overview
          </NavLink>
          <NavLink to="/environment" className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }>
            Environment
          </NavLink>
          <NavLink to="/faces" className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }>
            Faces
          </NavLink>
          <NavLink to="/reminders" className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }>
            Reminders
          </NavLink>
        </nav>

        {/* PAGES */}
        <main className="main">
          <Routes>
            <Route
              path="/"
              element={
                <OverviewPage
                  sensor={sensor}
                  people={people}
                  reminders={reminders}
                  lampOn={lampOn}
                />
              }
            />
            <Route
              path="/environment"
              element={<EnvironmentPage sensor={sensor} />}
            />
            <Route
              path="/faces"
              element={<FacesPage people={people} onRename={renamePerson} />}
            />
            <Route
              path="/reminders"
              element={
                <RemindersPage
                  reminders={reminders}
                  newReminder={newReminder}
                  repeatMinutes={repeatMinutes}
                  setNewReminder={setNewReminder}
                  setRepeatMinutes={setRepeatMinutes}
                  onAdd={addReminder}
                  onComplete={completeReminder}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* ------------------ PAGES ------------------ */

// 👉 put this near your other component functions, e.g. above OverviewPage

function Sparkline({
  data,
  color = "#4a6cff",
}: {
  data: number[];
  color?: string;
}) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);

  const points = data
    .map((value, index) => {
      const x =
        data.length === 1 ? 0 : (index / (data.length - 1)) * 100;
      const normalized =
        max === min ? 0.5 : (value - min) / (max - min); // 0–1
      const y = 100 - normalized * 100; // invert for SVG
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className="sparkline"
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OverviewPage({
  sensor,
  people,
  reminders,
  lampOn,
}: {
  sensor: SensorData;
  people: PersonEvent[];
  reminders: Reminder[];
  lampOn: boolean;
}) {
  const navigate = useNavigate();

  const latestPerson = people[0];
  const nextReminder = reminders.find((r) => !r.completed);
  const remindersDone = reminders.filter((r) => r.completed).length;
  const totalReminders = reminders.length;

  // Mock history data for sparklines (later: real data from backend)
  const homeHistory = [2, 4, 5, 3, 6, 7, 5];       // hours at home per day
  const lampHistory = [0.5, 1.2, 0.7, 2.0, 1.5];   // hours lamp on
  const reminderHistory = [0, 1, 2, 2, 3, 4];      // cumulative reminders done

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
          <p className="value">{sensor.temperature} °C</p>
        </div>

        <div className="card card-hover">
          <h3>Light</h3>
          <p className="value">{sensor.light} lx</p>
        </div>

        <div className="card card-hover">
          <h3>Humidity</h3>
          <p className="value">{sensor.humidity}%</p>
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
          onClick={() => navigate("/environment")}
        >
          <span className="mini-label">Lamp on today</span>
          <span className="mini-value">1h 35m</span>
          <span className="mini-sub">
            currently <strong>{lampOn ? "ON" : "OFF"}</strong>
          </span>
          <Sparkline data={lampHistory} color="#fbbf24" />
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

function EnvironmentPage({ sensor }: { sensor: SensorData }) {
  return (
    <div className="page-content fade-in">
      <h2 className="section-title">Environment</h2>
      <p className="section-description">
        Live data from your room sensors (will connect to Raspberry Pi later).
      </p>

      <div className="card-grid">
        <div className="card card-hover">
          <h3>Temperature</h3>
          <p className="value">{sensor.temperature} °C</p>
        </div>

        <div className="card card-hover">
          <h3>Light</h3>
          <p className="value">{sensor.light} lx</p>
        </div>

        <div className="card card-hover">
          <h3>Humidity</h3>
          <p className="value">{sensor.humidity}%</p>
        </div>
      </div>
    </div>
  );
}

function FacesPage({
  people,
  onRename,
}: {
  people: PersonEvent[];
  onRename: (index: number, newName: string) => void;
}) {
  return (
    <div className="page-content fade-in">
      <h2 className="section-title">Faces & People</h2>
      <p className="section-description">
        Later this will show snapshots from the camera and unknown faces so you
        can label them. For now, this is a mock view you can edit.
      </p>

      {/* CAMERA PREVIEW MOCK */}
      <div className="camera-preview">
        <div className="camera-header">
          <span className="camera-title">Camera preview</span>
          <span className="camera-status">
            <span className="dot" /> Offline (dev mode)
          </span>
        </div>

        <div className="camera-frame">
          <span className="camera-placeholder">
            📷 Zuzu will show your room here once the Raspberry&nbsp;Pi camera is
            connected.
          </span>
        </div>

        <div className="camera-actions">
          <button className="button-small" disabled>
            Capture snapshot
          </button>
          <span className="camera-hint">
            Button is disabled for now. We’ll hook this to the Pi camera later.
          </span>
        </div>
      </div>

      
      {/* PEOPLE LIST WITH SMALL IMAGES */}
      {people.map((p, index) => (
        <div key={index} className="list-item faces-item">
          <div className="face-avatar">
            {p.snapshotUrl ? (
              <img src={p.snapshotUrl} alt={p.person} />
            ) : (
              <div className="face-avatar-placeholder">🧑</div>
            )}
          </div>

          <div className="face-info">
            <div className="tag">{p.time}</div>
            <input
              className="input inline-input"
              value={p.person}
              onChange={(e) => onRename(index, e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RemindersPage({
  reminders,
  newReminder,
  repeatMinutes,
  setNewReminder,
  setRepeatMinutes,
  onAdd,
  onComplete,
}: {
  reminders: Reminder[];
  newReminder: string;
  repeatMinutes: number;
  setNewReminder: (v: string) => void;
  setRepeatMinutes: (v: number) => void;
  onAdd: () => void;
  onComplete: (id: number) => void;
}) {
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
            <button
              onClick={() => onComplete(r.id)}
              className="button-small"
            >
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