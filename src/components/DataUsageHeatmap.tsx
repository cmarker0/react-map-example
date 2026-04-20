import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import { scaleLinear } from "d3-scale";
import Button from "@intility/bifrost-react/Button";
import Dropdown from "@intility/bifrost-react/Dropdown";
import Switch from "@intility/bifrost-react/Switch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faPause, faPlay, faShuffle } from "@fortawesome/free-solid-svg-icons";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Hex values for WebGL (Globe) — CSS variables used in JSX styles
const BG_COLOR     = "#061527"; // var(--bfc-base)
const GREY         = "#435469"; // var(--bfc-base-disabled)
const STROKE_COLOR = "#223143"; // var(--bfc-base-dimmed)
const TEAL         = "#0cf2d7"; // var(--bfc-theme)
const SUCCESS      = "hsl(157, 100%, 48%)"; // var(--bfc-success) — heatmap max
const PURPLE       = "#ac89ff"; // var(--bfc-chill)
const PINK         = "#ff6bc3"; // var(--bfc-attn)

const BASE_USAGE: Record<string, { name: string; usage: number }> = {
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

function generateShuffledUsage(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const iso3 of Object.keys(BASE_USAGE)) {
    result[iso3] = Math.round((Math.random() * 90 + 2) * 10) / 10;
  }
  return result;
}

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
  call: [TEAL,   "rgba(12,242,215,0.05)"],
  sms:  [PURPLE, "rgba(172,137,255,0.05)"],
  mms:  [PINK,   "rgba(255,107,195,0.05)"],
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
const getStrokeColor = () => STROKE_COLOR;
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
  const [spinning, setSpinning] = useState(true);
  const [hiddenTypes, setHiddenTypes] = useState<Set<CallArc["type"]>>(new Set());
  const [usageOverrides, setUsageOverrides] = useState<Record<string, number>>({});

  // Globe settings
  const [rotateSpeed, setRotateSpeed] = useState(0.5);
  const [rotateDir, setRotateDir] = useState<1 | -1>(1);
  const [showAtmosphere, setShowAtmosphere] = useState(true);
  const [globeDay, setGlobeDay] = useState(false);

  // Arc settings
  const [arcHeight, setArcHeight] = useState(0.35);
  const [arcAnimateTime, setArcAnimateTime] = useState(5000);
  const [arcStroke, setArcStroke] = useState(0.5);

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

  const dataUsage = useMemo(() => {
    if (Object.keys(usageOverrides).length === 0) return BASE_USAGE;
    return Object.fromEntries(
      Object.entries(BASE_USAGE).map(([iso3, d]) => [
        iso3,
        { ...d, usage: usageOverrides[iso3] ?? d.usage },
      ]),
    );
  }, [usageOverrides]);

  const colorScale = useMemo(() => {
    const values = Object.values(dataUsage).map((d) => d.usage);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return scaleLinear<string>().domain([min, max]).range([GREY, SUCCESS]);
  }, [dataUsage]);

  useEffect(() => {
    if (globeRef.current) globeRef.current.controls().autoRotateSpeed = rotateSpeed * rotateDir;
  }, [rotateSpeed, rotateDir]);

  function handleGlobeReady() {
    const globe = globeRef.current;
    if (!globe) return;
    globe.controls().autoRotate = spinning;
    globe.controls().autoRotateSpeed = rotateSpeed * rotateDir;
    globe.pointOfView({ altitude: 2.2 });
  }

  function toggleSpin() {
    setSpinning((prev) => {
      if (globeRef.current) globeRef.current.controls().autoRotate = !prev;
      return !prev;
    });
  }

  function toggleType(type: CallArc["type"]) {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function shuffleData() {
    setUsageOverrides(generateShuffledUsage());
  }

  function resetData() {
    setUsageOverrides({});
  }

  const visibleArcs = useMemo(
    () => (view === "calls" ? CALL_ARCS.filter((a) => !hiddenTypes.has(a.type)) : []),
    [view, hiddenTypes],
  );

  const getCapColor = useCallback(
    (feat: object) => {
      if (view === "calls") return GREY;
      const iso3 = featIso3(feat);
      if (iso3 === "NOR" && !includeNorway) return GREY;
      const data = iso3 ? dataUsage[iso3] : undefined;
      return data ? colorScale(data.usage) : GREY;
    },
    [view, includeNorway, dataUsage, colorScale],
  );

  const getLabel = useCallback(
    (feat: object) => {
      const iso3 = featIso3(feat);
      const data = iso3 ? dataUsage[iso3] : undefined;
      if (!data) return "";
      const inner =
        view === "data"
          ? `<strong>${data.name}</strong><br/>${data.usage} GB / user / month`
          : data.name;
      return `<div style="background:var(--bfc-base-2);color:var(--bfc-base-c);padding:8px 12px;border-radius:6px;font-size:13px;border:1px solid var(--bfc-base-dimmed);pointer-events:none">${inner}</div>`;
    },
    [view, dataUsage],
  );

  const isShuffled = Object.keys(usageOverrides).length > 0;

  return (
    <div style={{ width: "100vw", height: "100vh", background: BG_COLOR, position: "relative" }}>
      <TopBar
        view={view}
        onViewChange={setView}
        includeNorway={includeNorway}
        onNorwayChange={setIncludeNorway}
        isShuffled={isShuffled}
        onShuffle={shuffleData}
        onReset={resetData}
        rotateSpeed={rotateSpeed}
        onRotateSpeed={setRotateSpeed}
        rotateDir={rotateDir}
        onRotateDir={setRotateDir}
        showAtmosphere={showAtmosphere}
        onShowAtmosphere={setShowAtmosphere}
        globeDay={globeDay}
        onGlobeDay={setGlobeDay}
        arcHeight={arcHeight}
        onArcHeight={setArcHeight}
        arcAnimateTime={arcAnimateTime}
        onArcAnimateTime={setArcAnimateTime}
        arcStroke={arcStroke}
        onArcStroke={setArcStroke}
      />
      <SpinControl spinning={spinning} onToggle={toggleSpin} />

      <Globe
        ref={globeRef}
        width={size.w}
        height={size.h}
        backgroundColor={BG_COLOR}
        globeImageUrl={
          globeDay
            ? "https://unpkg.com/three-globe/example/img/earth-day.jpg"
            : "https://unpkg.com/three-globe/example/img/earth-night.jpg"
        }
        atmosphereColor={TEAL}
        atmosphereAltitude={showAtmosphere ? 0.15 : 0}
        polygonsData={countries}
        polygonCapColor={getCapColor}
        polygonSideColor={getSideColor}
        polygonStrokeColor={getStrokeColor}
        polygonAltitude={getAltitude}
        polygonLabel={getLabel}
        arcsData={visibleArcs}
        arcStartLat={getArcStartLat}
        arcStartLng={getArcStartLng}
        arcEndLat={getArcEndLat}
        arcEndLng={getArcEndLng}
        arcColor={getCallArcColor}
        arcAltitude={arcHeight}
        arcDashLength={0.3}
        arcDashGap={0.15}
        arcDashAnimateTime={arcAnimateTime}
        arcStroke={arcStroke}
        onGlobeReady={handleGlobeReady}
      />

      {view === "data" ? (
        <DataLegend colorScale={colorScale} dataUsage={dataUsage} />
      ) : (
        <CallsLegend hiddenTypes={hiddenTypes} onToggle={toggleType} />
      )}
    </div>
  );
}

const TopBar = memo(function TopBar({
  view,
  onViewChange,
  includeNorway,
  onNorwayChange,
  isShuffled,
  onShuffle,
  onReset,
  rotateSpeed,
  onRotateSpeed,
  rotateDir,
  onRotateDir,
  showAtmosphere,
  onShowAtmosphere,
  globeDay,
  onGlobeDay,
  arcHeight,
  onArcHeight,
  arcAnimateTime,
  onArcAnimateTime,
  arcStroke,
  onArcStroke,
}: {
  view: ViewType;
  onViewChange: (v: ViewType) => void;
  includeNorway: boolean;
  onNorwayChange: (v: boolean) => void;
  isShuffled: boolean;
  onShuffle: () => void;
  onReset: () => void;
  rotateSpeed: number;
  onRotateSpeed: (v: number) => void;
  rotateDir: 1 | -1;
  onRotateDir: (v: 1 | -1) => void;
  showAtmosphere: boolean;
  onShowAtmosphere: (v: boolean) => void;
  globeDay: boolean;
  onGlobeDay: (v: boolean) => void;
  arcHeight: number;
  onArcHeight: (v: number) => void;
  arcAnimateTime: number;
  onArcAnimateTime: (v: number) => void;
  arcStroke: number;
  onArcStroke: (v: number) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        padding: "12px 16px",
        paddingTop: "max(12px, env(safe-area-inset-top))",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        background: "linear-gradient(to bottom, rgba(6,21,39,0.9) 60%, transparent)",
      }}
    >
      {/* Row 1: view switcher + settings */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button.Group style={{ flex: 1, minWidth: 0 }}>
          <Button
            active={view === "data"}
            onClick={() => onViewChange("data")}
            small
            style={{ flex: 1, whiteSpace: "nowrap" }}
          >
            Data Usage
          </Button>
          <Button
            active={view === "calls"}
            onClick={() => onViewChange("calls")}
            small
            style={{ flex: 1, whiteSpace: "nowrap" }}
          >
            Calls / SMS / MMS
          </Button>
        </Button.Group>

        <Dropdown
          placement="bottom-end"
          noPadding
          strategy="fixed"
          content={
            <SettingsPanel
              isShuffled={isShuffled}
              onShuffle={onShuffle}
              onReset={onReset}
              rotateSpeed={rotateSpeed}
              onRotateSpeed={onRotateSpeed}
              rotateDir={rotateDir}
              onRotateDir={onRotateDir}
              showAtmosphere={showAtmosphere}
              onShowAtmosphere={onShowAtmosphere}
              globeDay={globeDay}
              onGlobeDay={onGlobeDay}
              arcHeight={arcHeight}
              onArcHeight={onArcHeight}
              arcAnimateTime={arcAnimateTime}
              onArcAnimateTime={onArcAnimateTime}
              arcStroke={arcStroke}
              onArcStroke={onArcStroke}
            />
          }
        >
          <Button small pill noPadding title="Settings" style={{ width: 36, height: 36, flexShrink: 0 }}>
            <FontAwesomeIcon icon={faGear} />
          </Button>
        </Dropdown>
      </div>

      {/* Row 2: Norway toggle (data view only) */}
      {view === "data" && (
        <Switch
          label="Include Norway"
          checked={includeNorway}
          onChange={(e) => onNorwayChange(e.target.checked)}
        />
      )}
    </div>
  );
});

function SettingsPanel({
  isShuffled,
  onShuffle,
  onReset,
  rotateSpeed,
  onRotateSpeed,
  rotateDir,
  onRotateDir,
  showAtmosphere,
  onShowAtmosphere,
  globeDay,
  onGlobeDay,
  arcHeight,
  onArcHeight,
  arcAnimateTime,
  onArcAnimateTime,
  arcStroke,
  onArcStroke,
}: {
  isShuffled: boolean;
  onShuffle: () => void;
  onReset: () => void;
  rotateSpeed: number;
  onRotateSpeed: (v: number) => void;
  rotateDir: 1 | -1;
  onRotateDir: (v: 1 | -1) => void;
  showAtmosphere: boolean;
  onShowAtmosphere: (v: boolean) => void;
  globeDay: boolean;
  onGlobeDay: (v: boolean) => void;
  arcHeight: number;
  onArcHeight: (v: number) => void;
  arcAnimateTime: number;
  onArcAnimateTime: (v: number) => void;
  arcStroke: number;
  onArcStroke: (v: number) => void;
}) {
  return (
    <div style={{ width: 240, padding: "8px 0", fontSize: 13 }}>
      {/* Globe section */}
      <div style={{ padding: "6px 14px 4px", color: "var(--bfc-base-c-2)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Globe
      </div>
      <div style={{ padding: "4px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Switch
          label="Atmosphere"
          checked={showAtmosphere}
          onChange={(e) => onShowAtmosphere(e.target.checked)}
        />
        <Switch
          label="Day mode"
          checked={globeDay}
          onChange={(e) => onGlobeDay(e.target.checked)}
        />
        <SettingSlider
          label="Rotation speed"
          value={rotateSpeed}
          min={0.1}
          max={3}
          step={0.1}
          display={`${rotateSpeed.toFixed(1)}×`}
          onChange={onRotateSpeed}
        />
        <div>
          <div style={{ marginBottom: 6, color: "var(--bfc-base-c)", fontSize: 13 }}>Rotation direction</div>
          <Button.Group>
            <Button small active={rotateDir === 1} onClick={() => onRotateDir(1)}>← West</Button>
            <Button small active={rotateDir === -1} onClick={() => onRotateDir(-1)}>East →</Button>
          </Button.Group>
        </div>
      </div>

      <div style={{ margin: "8px 14px", borderTop: "1px solid var(--bfc-base-dimmed)" }} />

      {/* Arcs section */}
      <div style={{ padding: "6px 14px 4px", color: "var(--bfc-base-c-2)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Arcs
      </div>
      <div style={{ padding: "4px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        <SettingSlider
          label="Height"
          value={arcHeight}
          min={0.05}
          max={0.8}
          step={0.05}
          display={arcHeight.toFixed(2)}
          onChange={onArcHeight}
        />
        <SettingSlider
          label="Speed"
          value={arcAnimateTime}
          min={1000}
          max={12000}
          step={500}
          display={arcAnimateTime <= 2000 ? "fast" : arcAnimateTime >= 10000 ? "slow" : `${(arcAnimateTime / 1000).toFixed(1)}s`}
          onChange={onArcAnimateTime}
        />
        <SettingSlider
          label="Thickness"
          value={arcStroke}
          min={0.2}
          max={2}
          step={0.1}
          display={arcStroke.toFixed(1)}
          onChange={onArcStroke}
        />
      </div>

      <div style={{ margin: "8px 14px", borderTop: "1px solid var(--bfc-base-dimmed)" }} />

      {/* Data section */}
      <div style={{ padding: "6px 14px 4px", color: "var(--bfc-base-c-2)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Mock data
      </div>
      <button
        onClick={onShuffle}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 14px", background: "none", border: "none", color: "var(--bfc-base-c)", fontSize: 13, cursor: "pointer", textAlign: "left" }}
      >
        <FontAwesomeIcon icon={faShuffle} style={{ color: "var(--bfc-base-c-2)", width: 14 }} />
        Shuffle data
      </button>
      {isShuffled && (
        <button
          onClick={onReset}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 14px", background: "none", border: "none", color: "var(--bfc-base-c-2)", fontSize: 13, cursor: "pointer", textAlign: "left" }}
        >
          Reset to defaults
        </button>
      )}
    </div>
  );
}

function SettingSlider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "var(--bfc-base-c)", fontSize: 13 }}>
        <span>{label}</span>
        <span style={{ color: "var(--bfc-base-c-2)", fontVariantNumeric: "tabular-nums" }}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "var(--bfc-theme)", cursor: "pointer" }}
      />
    </div>
  );
}

const SpinControl = memo(function SpinControl({
  spinning,
  onToggle,
}: {
  spinning: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100px + env(safe-area-inset-bottom, 0px))",
        right: 16,
        zIndex: 10,
      }}
    >
      <Button
        pill
        noPadding
        small
        onClick={onToggle}
        title={spinning ? "Pause rotation" : "Resume rotation"}
        style={{ width: 36, height: 36 }}
      >
        <FontAwesomeIcon icon={spinning ? faPause : faPlay} />
      </Button>
    </div>
  );
});

function DataLegend({
  colorScale,
  dataUsage,
}: {
  colorScale: (v: number) => string;
  dataUsage: Record<string, { name: string; usage: number }>;
}) {
  const steps = 6;
  const values = Object.values(dataUsage).map((d) => d.usage);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100px + env(safe-area-inset-bottom, 0px))",
        left: 16,
        background: "var(--bfc-base-2)",
        borderRadius: 8,
        padding: "12px 16px",
        backdropFilter: "blur(4px)",
        border: "1px solid var(--bfc-base-dimmed)",
        color: "var(--bfc-base-c)",
        fontSize: 12,
      }}
    >
      <div style={{ marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em" }}>
        Data usage (GB/user/month)
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ color: "var(--bfc-base-c-2)", marginRight: 4 }}>Other</span>
        <div
          style={{
            width: 18,
            height: 18,
            background: GREY,
            borderRadius: 3,
            border: `1px solid ${STROKE_COLOR}`,
          }}
        />
        <div style={{ width: 12 }} />
        {Array.from({ length: steps }, (_, i) => {
          const value = min + ((max - min) * i) / (steps - 1);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 28, height: 14, background: colorScale(value), borderRadius: 2 }} />
              {(i === 0 || i === steps - 1) && (
                <span style={{ marginTop: 3, color: "var(--bfc-base-c-2)" }}>{value.toFixed(0)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CallsLegend({
  hiddenTypes,
  onToggle,
}: {
  hiddenTypes: Set<CallArc["type"]>;
  onToggle: (type: CallArc["type"]) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100px + env(safe-area-inset-bottom, 0px))",
        left: 16,
        background: "var(--bfc-base-2)",
        borderRadius: 8,
        padding: "12px 16px",
        backdropFilter: "blur(4px)",
        border: "1px solid var(--bfc-base-dimmed)",
        color: "var(--bfc-base-c)",
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
      ).map(({ type, label }) => {
        const hidden = hiddenTypes.has(type);
        return (
          <div
            key={type}
            onClick={() => onToggle(type)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 5,
              cursor: "pointer",
              opacity: hidden ? 0.35 : 1,
              transition: "opacity 0.15s",
              userSelect: "none",
            }}
          >
            <div style={{ width: 28, height: 3, background: ARC_COLORS[type][0], borderRadius: 2 }} />
            <span style={{ color: "var(--bfc-base-c-2)" }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
