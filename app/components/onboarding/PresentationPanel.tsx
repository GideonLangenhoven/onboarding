"use client";

import { useState } from "react";
import type { FeatureKey } from "./types";
import { FEATURE_ORDER, PRODUCT_PRESENTATION } from "./constants";

export function PresentationPanel() {
  const [activeFeature, setActiveFeature] = useState<FeatureKey>("storefront");
  const feature = PRODUCT_PRESENTATION[activeFeature];

  return (
    <section className="presentation-panel">
      <div className="section-header">
        <p className="eyebrow">Platform presentation</p>
        <h2>Take a quick tour of your new software.</h2>
        <p className="presentation-intro">
          See how your business will look to your guests and your team. These slides show real-world examples of the storefront, the AI virtual host, and the central dashboard you're about to set up.
        </p>
      </div>

      <div className="presentation-tabs">
        {FEATURE_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            className={activeFeature === key ? "presentation-tab active" : "presentation-tab"}
            onClick={() => setActiveFeature(key)}
          >
            {PRODUCT_PRESENTATION[key].tab}
          </button>
        ))}
      </div>

      <div className="presentation-stage">
        <div className="presentation-copy">
          <p className="eyebrow">{feature.eyebrow}</p>
          <h3>{feature.title}</h3>
          <p>{feature.summary}</p>

          <div className="presentation-block">
            <h4>What it does</h4>
            <ul>
              {feature.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="presentation-block">
            <h4>How it works</h4>
            <ol>
              {feature.walkthrough.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>

        <div className="presentation-screen">
          <div className="presentation-screen-frame">
            <img src={feature.image} alt={`${feature.title} screenshot`} />
          </div>
          <p className="presentation-caption">
            Visual preview of your future business operations.
          </p>
        </div>
      </div>

      <div className="screenshot-grid">
        {FEATURE_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            className={activeFeature === key ? "screenshot-card active" : "screenshot-card"}
            onClick={() => setActiveFeature(key)}
          >
            <img src={PRODUCT_PRESENTATION[key].image} alt={`${PRODUCT_PRESENTATION[key].title} thumbnail`} />
            <div>
              <strong>{PRODUCT_PRESENTATION[key].tab}</strong>
              <span>{PRODUCT_PRESENTATION[key].title}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
