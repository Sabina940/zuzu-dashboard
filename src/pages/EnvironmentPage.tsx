// src/pages/EnvironmentPage.tsx
import React from "react";
import type { SensorData } from "../types";

export function EnvironmentPage({ sensor }: { sensor: SensorData }) {
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