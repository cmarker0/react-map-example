import React from "react";
import { scaleLinear } from "d3-scale";
import { ComposableMap, Geographies, Geography, Graticule, Sphere } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Top 20 countries by mobile data usage (GB per user per month, 2024–2025 estimates)
// Keyed by ISO-3166-1 alpha-3 codes
const DATA_USAGE: Record<string, { name: string; usage: number }> = {
  SAU: { name: "Saudi Arabia", usage: 46.2 },
  ARE: { name: "United Arab Emirates", usage: 42.5 },
  KOR: { name: "South Korea", usage: 38.1 },
  IND: { name: "India", usage: 32.0 },
  SGP: { name: "Singapore", usage: 28.5 },
  LVA: { name: "Latvia", usage: 26.3 },
  FIN: { name: "Finland", usage: 25.1 },
  SWE: { name: "Sweden", usage: 22.8 },
  NOR: { name: "Norway", usage: 21.4 },
  DNK: { name: "Denmark", usage: 20.7 },
  CHN: { name: "China", usage: 20.2 },
  USA: { name: "United States", usage: 19.5 },
  AUS: { name: "Australia", usage: 18.3 },
  GRC: { name: "Greece", usage: 17.1 },
  BRA: { name: "Brazil", usage: 15.6 },
  JPN: { name: "Japan", usage: 14.2 },
  POL: { name: "Poland", usage: 13.8 },
  FRA: { name: "France", usage: 13.1 },
  DEU: { name: "Germany", usage: 12.4 },
  SVK: { name: "Slovakia", usage: 11.8 },
};

// Maps topojson numeric geo.id → ISO-3166-1 alpha-3
const NUMERIC_TO_ISO3: Record<string, string> = {
  "682": "SAU",
  "784": "ARE",
  "410": "KOR",
  "356": "IND",
  "702": "SGP",
  "428": "LVA",
  "246": "FIN",
  "752": "SWE",
  "578": "NOR",
  "208": "DNK",
  "156": "CHN",
  "840": "USA",
  "036": "AUS",
  "300": "GRC",
  "076": "BRA",
  "392": "JPN",
  "616": "POL",
  "250": "FRA",
  "276": "DEU",
  "703": "SVK",
};

const usageValues = Object.values(DATA_USAGE).map((d) => d.usage);
const minUsage = Math.min(...usageValues);
const maxUsage = Math.max(...usageValues);

const colorScale = scaleLinear<string>()
  .domain([minUsage, maxUsage])
  .range(["#495869", "#00f597"]);

const GREY = "#495869";
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
              const iso3 = NUMERIC_TO_ISO3[id];
              const countryData = iso3 ? DATA_USAGE[iso3] : undefined;
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
