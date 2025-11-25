// src/App.tsx
import { NavLink, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";

import "./App.css";

import { API_BASE } from "./config";
import type {
  SensorData,
  PersonEvent,
  Reminder,
} from "../src/types";

import { OverviewPage } from "./pages/OverviewPage";
import { EnvironmentPage } from "./pages/EnvironmentPage";
import { FacesPage } from "./pages/FacesPage";
import { RemindersPage } from "./pages/RemindersPage";
import { LampHistoryPage } from "./pages/LampHistoryPage";
import { LoginPage } from "./pages/LoginPage";

/* ------------------ MOCKS ------------------ */


/* ------------------ MOCKS ------------------ */
const mockSensorData: SensorData = {
  temperature: null,
  light: null,
};



const mockPeopleEvents: PersonEvent[] = [
  { time: "10:22", person: "Pierina" },
  { time: "08:17", person: "Unknown" },
];


export default function App() {
  const location = useLocation();
  const isLoginRoute = location.pathname === "/login";
  const [sensor, setSensor] = useState< SensorData >(mockSensorData);

  const [people, setPeople] = useState<PersonEvent[]>(mockPeopleEvents);
  const [reminders, setReminders] = useState<Reminder[]>([]);
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
        const on = Boolean(data.on);
        setLampOn(on);
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

        // Build a 0/1 series from the recent events
        const events = Array.isArray(data.events) ? data.events : [];
        let series = events.map((e: { on: boolean }) => (e.on ? 1 : 0));

        // If there is no history yet, just show the current state
        if (series.length === 0) {
          series = [lampOn ? 1 : 0];
        }

        // Keep it short (last 20 points max)
        setLampHistorySeries(series.slice(-20));
      } catch (err) {
        console.error("Failed to load lamp history", err);
        setLampHistorySeries([]);
      }
    };

    const fetchEnvironment = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/environment`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        setSensor({
          temperature:
            typeof data.temperature === "number" ? data.temperature : null,
          light: typeof data.light === "number" ? data.light : null,
        });
      } catch (err) {
        console.error("Failed to fetch environment", err);
      }
    };

    const fetchReminders = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/reminders`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Reminder[] = await res.json();
        setReminders(data);
      } catch (err) {
        console.error("Failed to fetch reminders", err);
      }
    };

    // ---- initial loads ----
    fetchLamp();
    fetchLampHistory();
    fetchEnvironment();
    fetchReminders();

    // ---- live sensor polling ----
    const id = setInterval(fetchEnvironment, 5000);
    return () => clearInterval(id);
  }, []); // keep deps empty

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

    // Update minutes today
    const total: number = data.minutes_today ?? 0;
    setLampTodayMinutes(total);

    // Append the new ON/OFF state to the sparkline series
    setLampHistorySeries((prev) => {
      const next = [...prev, on ? 1 : 0];
      // keep only the last 20 points
      return next.slice(-20);
    });
  } catch (err) {
    console.error(err);
    setLampError("Failed to toggle lamp");
  } finally {
    setLampLoading(false);
  }
};

  /* ---- REMINDERS ---- */

  async function addReminder() {
    const text = newReminder.trim();
    if (!text) return;

    try {
      const res = await fetch(`${API_BASE}/api/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          repeatEveryMin: repeatMinutes,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created: Reminder = await res.json();

      setReminders((old) => [...old, created]);
      setNewReminder("");
    } catch (err) {
      console.error("Failed to add reminder", err);
    }
  }

  async function completeReminder(id: number) {
    try {
      const res = await fetch(
        `${API_BASE}/api/reminders/${id}/complete`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const updated: Reminder = await res.json();

      setReminders((old) =>
        old.map((r) => (r.id === updated.id ? updated : r))
      );
    } catch (err) {
      console.error("Failed to complete reminder", err);
    }
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
        {/* HEADER (hidden on /login) */}
          {!isLoginRoute && (
            <>
              <header className="header">
                {/* LEFT SIDE — Title + User info */}
                <div className="header-left">
                  <h1 className="title">Zuzu! Dashboard</h1>

                  <div className="user-row">
                    <span className="logged-in-text">
                      {isAuthed ? (
                        <>
                          Logged in as <strong>{user}</strong>
                        </>
                      ) : (
                        "Not logged in"
                      )}
                    </span>

                    {isAuthed && (
                      <button className="logout-btn" onClick={handleLogout}>
                        🔒
                      </button>
                    )}
                  </div>
                </div>

                <div className="header-right">
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
            </>
          )}

        {/* NAVIGATION (only when logged in) */}
        {isAuthed && !isLoginRoute && (
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