// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config";

interface Props {
  onLoginSuccess: (name: string) => void;
}

export function LoginPage({ onLoginSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const SECRET_PASSWORD = "zuzu123";

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
    <div className="login-wrapper fade-in">
      <h1 className="title">Zuzu! Dashboard</h1>

      <div className="login-card">
        <h2 className="section-title">Login</h2>
        <p className="section-description">
          Unlock Zuzu’s dashboard with your RFID key or a password.
        </p>

        <div className="login-grid">
          {/* RFID LOGIN */}
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

          {/* PASSWORD LOGIN */}
          <div className="card">
            <h3>Login with password</h3>

            <input
              className="input"
              type="password"
              placeholder="Password…"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="button-small login-btn" onClick={handlePasswordLogin}>
              Login
            </button>
          </div>
        </div>

        {status && <p className="status-text">{status}</p>}
      </div>
    </div>
  );
}