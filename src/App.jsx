import React, { useState } from "react";
import PharmacologyView from "./PharmacologyView";
import ForensicView from "./ForensicView";
import "./App.css";

function App() {
  const [activeSubject, setActiveSubject] = useState("forensic"); // "forensic" or "pharma"

  const handleSubjectChange = (subject) => {
    setActiveSubject(subject);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-wrapper">
      {/* Active Subject Main View */}
      <main className="subject-viewport">
        {activeSubject === "pharma" ? <PharmacologyView /> : <ForensicView />}
      </main>

      {/* Persistent Bottom Fixed Navigation Bar (Desktop & Mobile) */}
      <nav className="bottom-nav-bar" aria-label="Subject Navigation">
        <div className="bottom-nav-inner">
          <button
            className={`bottom-nav-item ${activeSubject === "pharma" ? "active" : ""}`}
            onClick={() => handleSubjectChange("pharma")}
            aria-pressed={activeSubject === "pharma"}
          >
            <span className="bottom-nav-label">Pharmacology</span>
          </button>
          <button
            className={`bottom-nav-item ${activeSubject === "forensic" ? "active" : ""}`}
            onClick={() => handleSubjectChange("forensic")}
            aria-pressed={activeSubject === "forensic"}
          >
            <span className="bottom-nav-label">Forensic Medicine</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
