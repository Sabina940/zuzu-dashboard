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


const mockSensorData: SensorData = {
  temperature: 22.5,
  light: 120,
  
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
  const location = useLocation();
  const isLoginRoute = location.pathname === "/login";
  const [sensor, setSensor] = useState< SensorData >(mockSensorData);

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

    const fetchEnvironment = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/environment`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSensor(data);
      } catch (err) {
        console.error("Failed to load environment data", err);
      }
    };

    

    fetchLamp();
    fetchLampHistory();
    fetchEnvironment();
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