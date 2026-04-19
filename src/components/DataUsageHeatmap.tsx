import { memo, useCallback, useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import { scaleLinear } from "d3-scale";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const BG_COLOR = "#071627";
const GREY = "#495869";

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

interface CallArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  type: "call" | "sms" | "mms";
}

function mkArc(from: string, to: string, type: CallArc["type"]): CallArc {
  const [startLat, startLng] = COORDS[from]!;
  const [endLat, endLng] = COORDS[to]!;
  return { startLat, startLng, endLat, endLng, type };
}

const CALL_ARCS: CallArc[] = [
  // Voice calls
  mkArc("ARE", "IND", "call"),
  mkArc("USA", "IND", "call"),
  mkArc("SAU", "IND", "call"),
  mkArc("USA", "CHN", "call"),
  mkArc("DEU", "FRA", "call"),
  mkArc("NOR", "SWE", "call"),
  mkArc("CHN", "KOR", "call"),
  mkArc("CHN", "JPN", "call"),
  mkArc("FIN", "SWE", "call"),
  mkArc("SWE", "DNK", "call"),
  mkArc("BRA", "USA", "call"),
  mkArc("KOR", "USA", "call"),
  mkArc("IND", "SGP", "call"),
  mkArc("GRC", "DEU", "call"),
  mkArc("AUS", "SGP", "call"),
  // SMS
  mkArc("ARE", "IND", "sms"),
  mkArc("NOR", "SWE", "sms"),
  mkArc("USA", "IND", "sms"),
  mkArc("FIN", "SWE", "sms"),
  mkArc("KOR", "JPN", "sms"),
  mkArc("IND", "SAU", "sms"),
  mkArc("DEU", "FRA", "sms"),
  mkArc("CHN", "KOR", "sms"),
  mkArc("CHN", "USA", "sms"),
  mkArc("SGP", "AUS", "sms"),
  mkArc("DEU", "POL", "sms"),
  mkArc("USA", "BRA", "sms"),
  // MMS
  mkArc("IND", "ARE", "mms"),
  mkArc("NOR", "SWE", "mms"),
  mkArc("KOR", "USA", "mms"),
  mkArc("SWE", "DNK", "mms"),
  mkArc("JPN", "KOR", "mms"),
  mkArc("CHN", "JPN", "mms"),
  mkArc("USA", "CHN", "mms"),
  mkArc("AUS", "SGP", "mms"),
  mkArc("DEU", "POL", "mms"),
];

const ARC_COLORS: Record<CallArc["type"], [string, string]> = {
  call: ["#00f597", "rgba(0,245,151,0.05)"],
  sms:  ["#38bdf8", "rgba(56,189,248,0.05)"],
  mms:  ["#fb923c", "rgba(251,146,60,0.05)"],
};


function featIso3(feat: object): string | undefined {
  return NUMERIC_TO_ISO3[(feat as { id: string }).id];
}

function getAltitude(feat: object): number {
  return featIso3(feat) ? 0.014 : 0.006;
}

function getCallArcColor(d: object): [string, string] {
  return ARC_COLORS[(d as CallArc).type];
}


const getSideColor = () => BG_COLOR;
const getStrokeColor = () => "#1e3040";
const getArcStartLat = (d: object) => (d as CallArc).startLat;
const getArcStartLng = (d: object) => (d as CallArc).startLng;
const getArcEndLat = (d: object) => (d as CallArc).endLat;
const getArcEndLng = (d: object) => (d as CallArc).endLng;

type ViewType = "data" | "calls";

export function DataUsageHeatmap() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [countries, setCountries] = useState<object[]>([]);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [view, setView] = useState<ViewType>("data");
  const [includeNorway, setIncludeNorway] = useState(true);

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

  const getCapColor = useCallback(
    (feat: object) => {
      if (view === "calls") return GREY;
      const iso3 = featIso3(feat);
      if (iso3 === "NOR" && !includeNorway) return GREY;
      const data = iso3 ? DATA_USAGE[iso3] : undefined;
      return data ? colorScale(data.usage) : GREY;
    },
    [view, includeNorway],
  );

  const getLabel = useCallback(
    (feat: object) => {
      const iso3 = featIso3(feat);
      const data = iso3 ? DATA_USAGE[iso3] : undefined;
      if (!data) return "";
      const inner =
        view === "data"
          ? `<strong>${data.name}</strong><br/>${data.usage} GB / user / month`
          : data.name;
      return `<div style="background:rgba(7,22,39,0.9);color:#fff;padding:8px 12px;border-radius:6px;font-size:13px;border:1px solid rgba(0,245,151,0.25);pointer-events:none">${inner}</div>`;
    },
    [view],
  );

  return (
    <div style={{ width: "100vw", height: "100vh", background: BG_COLOR, position: "relative" }}>
      <ButtonGroup view={view} onViewChange={setView} includeNorway={includeNorway} onNorwayChange={setIncludeNorway} />

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
        arcsData={view === "calls" ? CALL_ARCS : []}
        arcStartLat={getArcStartLat}
        arcStartLng={getArcStartLng}
        arcEndLat={getArcEndLat}
        arcEndLng={getArcEndLng}
        arcColor={getCallArcColor}
        arcDashLength={0.4}
        arcDashGap={0.15}
        arcDashAnimateTime={2000}
        arcStroke={0.5}
        onGlobeReady={handleGlobeReady}
      />

      {view === "data" ? <DataLegend /> : <CallsLegend />}
    </div>
  );
}

const ButtonGroup = memo(function ButtonGroup({
  view,
  onViewChange,
  includeNorway,
  onNorwayChange,
}: {
  view: ViewType;
  onViewChange: (v: ViewType) => void;
  includeNorway: boolean;
  onNorwayChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: "rgba(7,22,39,0.88)",
        borderRadius: 10,
        padding: "5px 6px",
        border: "1px solid rgba(0,245,151,0.2)",
        backdropFilter: "blur(6px)",
        whiteSpace: "nowrap",
      }}
    >
      {(["data", "calls"] as ViewType[]).map((v) => (
        <button
          key={v}
          onClick={() => onViewChange(v)}
          style={{
            background: view === v ? "#00f597" : "transparent",
            color: view === v ? BG_COLOR : "#8a9bb0",
            border: "none",
            borderRadius: 6,
            padding: "6px 14px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
            transition: "background 0.15s, color 0.15s",
          }}
        >
          {v === "data" ? "Data Usage" : "Calls / SMS / MMS"}
        </button>
      ))}
      {view === "data" && (
        <>
          <div style={{ width: 1, height: 20, background: "rgba(0,245,151,0.2)", margin: "0 4px" }} />
          <label
            style={{
              color: "#8a9bb0",
              fontSize: 13,
              cursor: "pointer",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 8px",
            }}
          >
            <input
              type="checkbox"
              checked={includeNorway}
              onChange={(e) => onNorwayChange(e.target.checked)}
              style={{ accentColor: "#00f597", cursor: "pointer" }}
            />
            Include Norway
          </label>
        </>
      )}
    </div>
  );
});

const DataLegend = memo(function DataLegend() {
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
        <div style={{ width: 18, height: 18, background: GREY, borderRadius: 3, border: "1px solid #2a3a4a" }} />
        <div style={{ width: 12 }} />
        {Array.from({ length: steps }, (_, i) => {
          const value = minUsage + ((maxUsage - minUsage) * i) / (steps - 1);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 28, height: 14, background: colorScale(value), borderRadius: 2 }} />
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

const CallsLegend = memo(function CallsLegend() {
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
      <div style={{ marginBottom: 8, fontWeight: 600, letterSpacing: "0.04em" }}>
        International Traffic
      </div>
      {(
        [
          { type: "call", label: "Voice Calls" },
          { type: "sms",  label: "SMS" },
          { type: "mms",  label: "MMS" },
        ] as { type: CallArc["type"]; label: string }[]
      ).map(({ type, label }) => (
        <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <div style={{ width: 28, height: 3, background: ARC_COLORS[type][0], borderRadius: 2 }} />
          <span style={{ color: "#aaa" }}>{label}</span>
        </div>
      ))}
      <div style={{ marginTop: 6, color: "#666", fontSize: 11 }}>Arc thickness = volume</div>
    </div>
  );
});
