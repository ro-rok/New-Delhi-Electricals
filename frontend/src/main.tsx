import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import { applyInternalAnalyticsFlag } from "./lib/internalAnalytics";
import "./index.css";

// Process ?nde_internal=1|0 and clean it from the URL before React mounts, so the
// first route render and page-view beacon never see the parameter.
applyInternalAnalyticsFlag();

const root = document.getElementById("root")!;

// Prerendered catalogue documents are produced by entry-server.tsx. Hydrating
// keeps that React markup in place; client-only routes still mount normally.
if (root.hasChildNodes()) {
  hydrateRoot(root, <App />);
} else {
  createRoot(root).render(<App />);
}
