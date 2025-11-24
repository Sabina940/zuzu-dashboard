// src/pages/FacesPage.tsx
import type { PersonEvent } from "../types";

interface Props {
  people: PersonEvent[];
  onRename: (index: number, newName: string) => void;
}

export function FacesPage({ people, onRename }: Props) {
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