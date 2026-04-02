"use client";

import { useState } from "react";
import type { GuideKey } from "./types";
import { GUIDE_CONTENT } from "./constants";

export function GuidePanel() {
  const [activeGuide, setActiveGuide] = useState<GuideKey>("walkthrough");

  return (
    <section className="guide-panel">
      <div className="section-header">
        <p className="eyebrow">How this works</p>
        <h2>Interactive operator guide</h2>
      </div>
      <div className="guide-tabs">
        {(Object.keys(GUIDE_CONTENT) as GuideKey[]).map((key) => (
          <button
            key={key}
            type="button"
            className={activeGuide === key ? "guide-tab active" : "guide-tab"}
            onClick={() => setActiveGuide(key)}
          >
            {GUIDE_CONTENT[key].title}
          </button>
        ))}
      </div>
      <div className="guide-card">
        <h3>{GUIDE_CONTENT[activeGuide].title}</h3>
        <p>{GUIDE_CONTENT[activeGuide].summary}</p>
        <ul>
          {GUIDE_CONTENT[activeGuide].bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
