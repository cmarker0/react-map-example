import { StrictMode } from "react";
import { DataUsageHeatmap } from "./components/DataUsageHeatmap";
import "./index.css";

/**
 * Main react entry point for the app.
 */
export default function App() {
  return (
    <StrictMode>
      <DataUsageHeatmap />
    </StrictMode>
  );
}
