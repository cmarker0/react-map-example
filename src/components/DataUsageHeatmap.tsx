import React from "react";
import { scaleLinear } from "d3-scale";
import { ComposableMap, Geographies, Geography, Graticule, Sphere } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Top 10 countries by mobile data usage (GB per user per month, approximate)
// ISO-3166-1 numeric codes used by topojson world-atlas
const TOP_10_DATA_USAGE: Record<string, { name: string; usage: number }> = {
  "356": { name: "India", usage: 32.4 },
  "076": { name: "Brazil", usage: 14.8 },
  "156": { name: "China", usage: 13.5 },
  "840": { name: "United States", usage: 12.7 },
  "616": { name: "Poland", usage: 11.9 },
  "246": { name: "Finland", usage: 11.2 },
  "578": { name: "Norway", usage: 10.6 },
  "703": { name: "Slovakia", usage: 10.1 },
  "392": { name: "Japan", usage: 9.8 },
  "410": { name: "South Korea", usage: 9.3 },
};

const usageValues = Object.values(TOP_10_DATA_USAGE).map((d) => d.usage);
const minUsage = Math.min(...usageValues);
const maxUsage = Math.max(...usageValues);

const colorScale = scaleLinear<string>()
  .domain([minUsage, maxUsage])
  .range(["#b7d8b7", "#1a7a1a"]);

const GREY = "#4a4a4a";
const STROKE_COLOR = "#2a2a2a";

interface TooltipState {
  name: string;
  usage: number;
  x: number;
  y: number;
}

export function DataUsageHeatmap() {
  const [tooltip, setTooltip] = React.useState<TooltipState | null>(null);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "transparent", position: "relative" }}>
      <ComposableMap
        projectionConfig={{ scale: 160 }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        <Sphere id="sphere" fill="transparent" stroke={STROKE_COLOR} strokeWidth={0.3} />
        <Graticule stroke={STROKE_COLOR} strokeWidth={0.2} />
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const id = geo.id as string;
              const countryData = TOP_10_DATA_USAGE[id];
              const fill = countryData ? colorScale(countryData.usage) : GREY;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke={STROKE_COLOR}
                  strokeWidth={0.4}
                  style={{
                    default: { outline: "none" },
                    hover: {
                      outline: "none",
                      fill: countryData ? colorScale(countryData.usage) : "#666",
                      filter: "brightness(1.2)",
                    },
                    pressed: { outline: "none" },
                  }}
                  onMouseEnter={(event) => {
                    if (countryData) {
                      setTooltip({
                        name: countryData.name,
                        usage: countryData.usage,
                        x: event.clientX,
                        y: event.clientY,
                      });
                    }
                  }}
                  onMouseMove={(event) => {
                    if (countryData) {
                      setTooltip((prev) =>
                        prev ? { ...prev, x: event.clientX, y: event.clientY } : null,
                      );
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div
          style={{
            position: "fixed",
            top: tooltip.y + 12,
            left: tooltip.x + 12,
            background: "rgba(10, 20, 10, 0.85)",
            color: "#e0f0e0",
            padding: "8px 12px",
            borderRadius: 6,
            fontSize: 13,
            pointerEvents: "none",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(80,160,80,0.4)",
            zIndex: 10,
          }}
        >
          <strong>{tooltip.name}</strong>
          <br />
          {tooltip.usage} GB / user / month
        </div>
      )}

      <Legend minUsage={minUsage} maxUsage={maxUsage} colorScale={colorScale} />
    </div>
  );
}

function Legend({
  minUsage,
  maxUsage,
  colorScale,
}: {
  minUsage: number;
  maxUsage: number;
  colorScale: (value: number) => string;
}) {
  const steps = 6;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 32,
        left: 32,
        background: "rgba(10, 20, 10, 0.75)",
        borderRadius: 8,
        padding: "12px 16px",
        backdropFilter: "blur(4px)",
        border: "1px solid rgba(80,160,80,0.3)",
        color: "#e0f0e0",
        fontSize: 12,
      }}
    >
      <div style={{ marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em" }}>
        Data usage (GB/user/month)
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ color: "#888", marginRight: 4 }}>Other</span>
        <div
          style={{
            width: 18,
            height: 18,
            background: GREY,
            borderRadius: 3,
            border: "1px solid #555",
          }}
        />
        <div style={{ width: 12 }} />
        {Array.from({ length: steps }, (_, i) => {
          const value = minUsage + ((maxUsage - minUsage) * i) / (steps - 1);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: 28,
                  height: 14,
                  background: colorScale(value),
                  borderRadius: 2,
                }}
              />
              {(i === 0 || i === steps - 1) && (
                <span style={{ marginTop: 3, color: "#aaa" }}>{value.toFixed(0)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
