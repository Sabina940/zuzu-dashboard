// src/pages/LampHistoryPage.tsx
import React, { useEffect, useState } from "react";
import type { LampHistoryEntry } from "../types";
import { API_BASE } from "../config";

export function LampHistoryPage() {
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