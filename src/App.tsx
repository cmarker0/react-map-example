import { StrictMode } from "react";
import Bifrost from "@intility/bifrost-react/Bifrost";
import { DataUsageHeatmap } from "./components/DataUsageHeatmap";
import "./index.css";

/**
 * Main react entry point for the app.
 */
export default function App() {
  return (
    <StrictMode>
      <Bifrost>
        <DataUsageHeatmap />
      </Bifrost>
    </StrictMode>
  );
}
