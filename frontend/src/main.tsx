import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import type { RouteData } from "./lib/routeData";
import "./index.css";

declare global { interface Window { __NDE_INITIAL_ROUTE_DATA__?: RouteData; } }

const root = document.getElementById("root")!;
const initialRouteData = window.__NDE_INITIAL_ROUTE_DATA__;

// Generated documents contain the exact React tree rendered by entry-server.
if (initialRouteData && root.hasChildNodes()) {
  hydrateRoot(root, <App initialRouteData={initialRouteData} />);
} else {
  createRoot(root).render(<App />);
}
