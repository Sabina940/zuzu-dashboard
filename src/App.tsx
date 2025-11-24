import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { NavLink, Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://192.168.0.221:8000";

/* ------------------ TYPES ------------------ */

interface SensorData {
  temperature: number;
  light: number;
  humidity: number;
}

interface PersonEvent {
  time: string;
  person: string;
  snapshotUrl?: string;
}

interface Reminder {
  id: number;
  text: string;
  repeatEveryMin: number;
  completed: boolean;
}

interface LampHistoryEntry {
  timestamp: string;
  on: boolean;
}

/* ------------------ MOCKS ------------------ */

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

/* ------------------ ROOT APP ------------------ */

export default function App() {
  const [sensor] = useState<SensorData>(mockSensorData);
  const [people, setPeople] = useState<PersonEvent[]>(mockPeopleEvents);
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders);

  // auth
  const [user, setUser] = useState<string | null>(null);

  // lamp state
  const [lampOn, setLampOn] = useState(false);
  const [lampLoading, setLampLoading] = useState(false);
  const [lampError, setLampError] = useState<string | null>(null);

  // history + “minutes today” for overview
  const [lampTodayMinutes, setLampTodayMinutes] = useState<number | null>(null);
  const [lampHistorySeries, setLampHistorySeries] = useState<number[]>([]);

  // reminders inputs
  const [newReminder, setNewReminder] = useState("");
  const [repeatMinutes, setRepeatMinutes] = useState(30);

  const isAuthed = user !== null;

  /* ---- INITIAL FETCHES (lamp state + minutes today) ---- */
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

    const fetchLampHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/lamp/history`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const total: number = data.minutes_today ?? 0;
        setLampTodayMinutes(total);

        const buckets = 8;
        const perBucket = total / buckets;
        setLampHistorySeries(
          Array.from({ length: buckets }, (_, i) => perBucket * (i + 1))
        );
      } catch (err) {
        console.error("Failed to load lamp history", err);
        setLampHistorySeries([]);
      }
    };

    fetchLamp();
    fetchLampHistory();
  }, []);

  /* ---- TOGGLE LAMP ---- */
  const handleLampToggle = async () => {
    try {
      setLampLoading(true);
      setLampError(null);
      const res = await fetch(`${API_BASE}/api/lamp/toggle`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const on = Boolean(data.on);
      setLampOn(on);

      // refresh minutes + sparkline from backend
      const total: number = data.minutes_today ?? 0;
      setLampTodayMinutes(total);
      const buckets = 8;
      const perBucket = total / buckets;
      setLampHistorySeries(
        Array.from({ length: buckets }, (_, i) => perBucket * (i + 1))
      );
    } catch (err) {
      console.error(err);
      setLampError("Failed to toggle lamp");
    } finally {
      setLampLoading(false);
    }
  };

  /* ---- REMINDERS ---- */

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

  /* ---- FACES ---- */

  function renamePerson(index: number, newName: string) {
    setPeople((prev) =>
      prev.map((p, i) => (i === index ? { ...p, person: newName } : p))
    );
  }

  function handleLogout() {
    setUser(null);
  }

  return (
    <div className="page">
      <div className="container">
        {/* HEADER */}
        <header className="header">
          {/* LEFT SIDE — Title + User info */}
          <div className="header-left">
            <h1 className="title">Zuzu! Dashboard</h1>

            <div className="user-row">
              <span className="logged-in-text">
                Logged in as <strong>{user}</strong>
              </span>

              <button className="logout-btn" onClick={handleLogout}>
                🔒
              </button>
            </div>
          </div>

          <div className="header-right">
            {isAuthed && (
              <span className="user-badge">
                Logged in as <strong>{user}</strong>
              </span>
            )}

            <button
              className={`lamp-badge ${lampOn ? "on" : "off"}`}
              onClick={handleLampToggle}
              disabled={lampLoading || !isAuthed}
            >
              {!isAuthed
                ? "Login to control lamp"
                : lampLoading
                ? "⏳ Talking to Zuzu..."
                : lampOn
                ? "Lamp ON"
                : "Lamp OFF"}
            </button>
          </div>
        </header>
        {lampError && <p className="lamp-error">{lampError}</p>}

        {/* NAVIGATION (only when logged in) */}
        {isAuthed && (
          <nav className="nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Overview
            </NavLink>
            <NavLink
              to="/environment"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Environment
            </NavLink>
            <NavLink
              to="/faces"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Faces
            </NavLink>
            <NavLink
              to="/reminders"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Reminders
            </NavLink>
            <NavLink
              to="/lamp-history"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Lamp history
            </NavLink>

            
          </nav>
        )}

        {/* PAGES */}
        <main className="main">
          <Routes>
            {/* PUBLIC: login */}
            <Route
              path="/login"
              element={<LoginPage onLoginSuccess={setUser} />}
            />

            {/* PRIVATE ROUTES */}
            <Route
              path="/"
              element={
                <RequireAuth user={user}>
                  <OverviewPage
                    sensor={sensor}
                    people={people}
                    reminders={reminders}
                    lampOn={lampOn}
                    lampTodayMinutes={lampTodayMinutes}
                    lampHistorySeries={lampHistorySeries}
                  />
                </RequireAuth>
              }
            />
            <Route
              path="/environment"
              element={
                <RequireAuth user={user}>
                  <EnvironmentPage sensor={sensor} />
                </RequireAuth>
              }
            />
            <Route
              path="/faces"
              element={
                <RequireAuth user={user}>
                  <FacesPage people={people} onRename={renamePerson} />
                </RequireAuth>
              }
            />
            <Route
              path="/reminders"
              element={
                <RequireAuth user={user}>
                  <RemindersPage
                    reminders={reminders}
                    newReminder={newReminder}
                    repeatMinutes={repeatMinutes}
                    setNewReminder={setNewReminder}
                    setRepeatMinutes={setRepeatMinutes}
                    onAdd={addReminder}
                    onComplete={completeReminder}
                  />
                </RequireAuth>
              }
            />
            <Route
              path="/lamp-history"
              element={
                <RequireAuth user={user}>
                  <LampHistoryPage />
                </RequireAuth>
              }
            />

            {/* fallback */}
            <Route
              path="*"
              element={
                <RequireAuth user={user}>
                  <OverviewPage
                    sensor={sensor}
                    people={people}
                    reminders={reminders}
                    lampOn={lampOn}
                    lampTodayMinutes={lampTodayMinutes}
                    lampHistorySeries={lampHistorySeries}
                  />
                </RequireAuth>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* ------------------ AUTH GUARD ------------------ */

function RequireAuth({
  user,
  children,
}: {
  user: string | null;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

    if (!user) return null; // nothing while redirecting
  return <>{children}</>;
}


/* ------------------ LOGIN PAGE ------------------ */

function LoginPage({
  onLoginSuccess,
}: {
  onLoginSuccess: (name: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const SECRET_PASSWORD = "zuzu123"; // change this!

  const handlePasswordLogin = () => {
    if (!password) return;
    if (password === SECRET_PASSWORD) {
      onLoginSuccess("Pierina");
      setStatus(null);
      navigate("/", { replace: true });
    } else {
      setStatus("Wrong password.");
    }
  };

  const handleRfidLogin = async () => {
    try {
      setLoading(true);
      setStatus("Checking key… tap the key on the reader.");
      const res = await fetch(`${API_BASE}/api/rfid/login`, {
        method: "POST",
      });
      if (!res.ok) {
        setStatus("Key not accepted. Try again.");
        return;
      }
      const data = await res.json();
      const name = data.user || "Pierina";
      onLoginSuccess(name);
      setStatus(null);
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setStatus("Could not reach RFID login API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content fade-in">
      <h2 className="section-title">Login</h2>
      <p className="section-description">
        Unlock Zuzu’s dashboard with your RFID key or a password.
      </p>

      <div className="login-grid">
        <div className="card">
          <h3>Login with RFID key</h3>
          <p className="section-description">
            Hold your key fob on the reader and press the button.
          </p>
          <button
            className="button-small"
            onClick={handleRfidLogin}
            disabled={loading}
          >
            {loading ? "Waiting for key…" : "Login with key"}
          </button>
        </div>

        <div className="card">
          <h3>Login with password</h3>
          <input
            className="input"
            type="password"
            placeholder="Password…"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="button-small" onClick={handlePasswordLogin}>
            Login
          </button>
        </div>
      </div>

      {status && <p className="status-text">{status}</p>}
    </div>
  );
}

/* ------------------ PAGES ------------------ */

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
      const x = data.length === 1 ? 0 : (index / (data.length - 1)) * 100;
      const normalized = max === min ? 0.5 : (value - min) / (max - min);
      const y = 100 - normalized * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
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
  lampTodayMinutes,
  lampHistorySeries,
}: {
  sensor: SensorData;
  people: PersonEvent[];
  reminders: Reminder[];
  lampOn: boolean;
  lampTodayMinutes: number | null;
  lampHistorySeries: number[];
}) {
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
            📷 Zuzu will show your room here once the Raspberry&nbsp;Pi camera
            is connected.
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

/* -------- Lamp history page (separate) -------- */

function LampHistoryPage() {
  const [events, setEvents] = useState<LampHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/lamp/history`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error("Failed to load lamp history", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="page-content fade-in">
      <h2 className="section-title">Lamp history</h2>
      <p className="section-description">
        Every time the lamp turned ON or OFF (from this server session).
      </p>

      {loading && <p>Loading history…</p>}

      {!loading && events.length === 0 && (
        <p>No events yet. Toggle the lamp to start building history.</p>
      )}

      {events.map((e, idx) => {
        const t = new Date(e.timestamp);
        const timeStr = t.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div key={idx} className="list-item lamp-event">
            <span className={`tag ${e.on ? "on" : "off"}`}>
              {e.on ? "ON" : "OFF"}
            </span>
            <span className="lamp-event-time">{timeStr}</span>
          </div>
        );
      })}
    </div>
  );
}