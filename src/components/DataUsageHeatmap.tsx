import { memo, useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import { scaleLinear } from "d3-scale";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const DATA_USAGE: Record<string, { name: string; usage: number }> = {
  SAU: { name: "Saudi Arabia", usage: 92.4 },
  ARE: { name: "United Arab Emirates", usage: 85.0 },
  KOR: { name: "South Korea", usage: 76.2 },
  IND: { name: "India", usage: 64.0 },
  SGP: { name: "Singapore", usage: 57.0 },
  LVA: { name: "Latvia", usage: 52.6 },
  FIN: { name: "Finland", usage: 50.2 },
  SWE: { name: "Sweden", usage: 45.6 },
  NOR: { name: "Norway", usage: 42.8 },
  DNK: { name: "Denmark", usage: 41.4 },
  CHN: { name: "China", usage: 40.4 },
  USA: { name: "United States", usage: 39.0 },
  AUS: { name: "Australia", usage: 36.6 },
  GRC: { name: "Greece", usage: 34.2 },
  BRA: { name: "Brazil", usage: 15.6 },
  JPN: { name: "Japan", usage: 11.2 },
  POL: { name: "Poland", usage: 8.4 },
  FRA: { name: "France", usage: 6.2 },
  DEU: { name: "Germany", usage: 4.1 },
  SVK: { name: "Slovakia", usage: 2.3 },
};

// topojson numeric geo.id → ISO-3166-1 alpha-3
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
const BG_COLOR = "#071627";

// Country centroids [lat, lng] for arc endpoints
const COORDS: Record<string, [number, number]> = {
  SAU: [24.7, 45.1],
  ARE: [24.0, 54.0],
  KOR: [36.5, 127.8],
  IND: [20.6, 78.9],
  SGP: [1.4, 103.8],
  LVA: [56.9, 24.6],
  FIN: [61.9, 25.7],
  SWE: [60.1, 18.6],
  NOR: [60.5, 8.5],
  DNK: [56.3, 9.5],
  CHN: [35.9, 104.2],
  USA: [37.1, -95.7],
  AUS: [-25.3, 133.8],
  GRC: [39.1, 21.8],
  BRA: [-14.2, -51.9],
  JPN: [36.2, 138.3],
  POL: [51.9, 19.1],
  FRA: [46.2, 2.2],
  DEU: [51.2, 10.5],
  SVK: [48.7, 19.7],
};

interface Arc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
}

function mkArc(from: string, to: string): Arc {
  const [startLat, startLng] = COORDS[from]!;
  const [endLat, endLng] = COORDS[to]!;
  return { startLat, startLng, endLat, endLng };
}

const ARCS: Arc[] = [
  mkArc("SAU", "IND"),
  mkArc("SAU", "USA"),
  mkArc("ARE", "SGP"),
  mkArc("ARE", "IND"),
  mkArc("KOR", "JPN"),
  mkArc("KOR", "USA"),
  mkArc("KOR", "CHN"),
  mkArc("IND", "SGP"),
  mkArc("IND", "AUS"),
  mkArc("CHN", "USA"),
  mkArc("CHN", "JPN"),
  mkArc("USA", "BRA"),
  mkArc("USA", "DEU"),
  mkArc("USA", "AUS"),
  mkArc("DEU", "FRA"),
  mkArc("DEU", "POL"),
  mkArc("FIN", "SWE"),
  mkArc("SWE", "NOR"),
  mkArc("NOR", "DNK"),
  mkArc("SGP", "AUS"),
];

function featIso3(feat: object): string | undefined {
  return NUMERIC_TO_ISO3[(feat as { id: string }).id];
}

function getCapColor(feat: object): string {
  const iso3 = featIso3(feat);
  const data = iso3 ? DATA_USAGE[iso3] : undefined;
  return data ? colorScale(data.usage) : GREY;
}

function getAltitude(feat: object): number {
  const iso3 = featIso3(feat);
  return iso3 && DATA_USAGE[iso3] ? 0.014 : 0.006;
}

function getLabel(feat: object): string {
  const iso3 = featIso3(feat);
  const data = iso3 ? DATA_USAGE[iso3] : undefined;
  if (!data) return "";
  return `<div style="background:rgba(7,22,39,0.9);color:#fff;padding:8px 12px;border-radius:6px;font-size:13px;border:1px solid rgba(0,245,151,0.3);pointer-events:none">
    <strong>${data.name}</strong><br/>${data.usage} GB / user / month
  </div>`;
}

const getSideColor = () => BG_COLOR;
const getStrokeColor = () => "#1e3040";
const getArcColor = () => ["#00f597", "rgba(0,245,151,0.1)"];
const getArcStartLat = (d: object) => (d as Arc).startLat;
const getArcStartLng = (d: object) => (d as Arc).startLng;
const getArcEndLat = (d: object) => (d as Arc).endLat;
const getArcEndLng = (d: object) => (d as Arc).endLng;

export function DataUsageHeatmap() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [countries, setCountries] = useState<object[]>([]);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    fetch(GEO_URL)
      .then((r) => r.json())
      .then((topo: Topology) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const col = feature(topo, (topo as any).objects.countries) as any;
        setCountries(col.features);
      });
  }, []);

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function handleGlobeReady() {
    const globe = globeRef.current;
    if (!globe) return;
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.5;
    globe.pointOfView({ altitude: 2.2 });
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: BG_COLOR, position: "relative" }}>
      <Globe
        ref={globeRef}
        width={size.w}
        height={size.h}
        backgroundColor={BG_COLOR}
        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
        atmosphereColor="#00f597"
        atmosphereAltitude={0.15}
        polygonsData={countries}
        polygonCapColor={getCapColor}
        polygonSideColor={getSideColor}
        polygonStrokeColor={getStrokeColor}
        polygonAltitude={getAltitude}
        polygonLabel={getLabel}
        arcsData={ARCS}
        arcStartLat={getArcStartLat}
        arcStartLng={getArcStartLng}
        arcEndLat={getArcEndLat}
        arcEndLng={getArcEndLng}
        arcColor={getArcColor}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={2500}
        arcStroke={0.4}
        onGlobeReady={handleGlobeReady}
      />
      <Legend minUsage={minUsage} maxUsage={maxUsage} colorScale={colorScale} />
    </div>
  );
}

const Legend = memo(function Legend({
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
        background: "rgba(7,22,39,0.85)",
        borderRadius: 8,
        padding: "12px 16px",
        backdropFilter: "blur(4px)",
        border: "1px solid rgba(0,245,151,0.25)",
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
            border: "1px solid #2a3a4a",
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
});
