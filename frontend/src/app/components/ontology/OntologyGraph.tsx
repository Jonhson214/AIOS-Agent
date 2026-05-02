import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Sparkles,
  Play,
  Pause,
  Rewind,
  FastForward,
  Zap,
  AlertTriangle,
  Thermometer,
  Flame,
  Waves,
  Target,
  ChevronRight,
  Layers,
  Radio,
  ScanLine,
  History,
  TrendingUp,
  X,
  Snowflake,
  Factory,
  Package,
  Tag,
  CircleDot,
  MousePointerClick,
  QrCode,
} from "lucide-react";

type NodeKind = "physical" | "rule" | "exception" | "cluster";

type GNode = {
  id: string;
  kind: NodeKind;
  label: string;
  sub?: string;
  x: number;
  y: number;
  weight: number; // visual size
  bornAt: number; // timeline hour 0-24
  diedAt?: number; // fades after this
  meta?: Record<string, string>;
  cluster?: number; // for cluster ring
  anomaly?: boolean;
};

type GEdge = {
  id: string;
  from: string;
  to: string;
  thickness: number; // 1..6 data flux
  kind: "flow" | "rule" | "exc";
  bornAt: number;
};

const W = 780;
const H = 480;

// Hand-tuned force-like layout — radial spread from center
const NODES: GNode[] = [
  { id: "batch", kind: "physical", label: "批次 #2026-0420", sub: "380 头 · LivePigBatch", x: 80, y: 80, weight: 32, bornAt: 6, meta: { EarTag: "P-0318~0697" } },
  { id: "pig", kind: "physical", label: "活猪个体", sub: "EarTag P-0318", x: 190, y: 150, weight: 20, bornAt: 8 },
  { id: "stun", kind: "rule", label: "致昏标准", sub: "CO₂ 85% / 90s", x: 190, y: 60, weight: 14, bornAt: 8 },

  { id: "carcass", kind: "physical", label: "白条 HK-00247", sub: "97.9kg · Hook_RFID", x: 310, y: 210, weight: 28, bornAt: 10 },
  { id: "vet", kind: "rule", label: "同步卫检", sub: "GB/T 标准", x: 290, y: 110, weight: 14, bornAt: 10 },
  { id: "vet_exc", kind: "exception", label: "⚠ 病变拦截", sub: "#2026-0420-031", x: 390, y: 80, weight: 16, bornAt: 14, anomaly: true },

  { id: "chillroom", kind: "rule", label: "排酸库 A-05", sub: "预冷 24h · 4°C", x: 430, y: 280, weight: 22, bornAt: 11 },
  { id: "chill_alarm", kind: "exception", label: "温度超标", sub: "2.1°C → 5.3°C", x: 560, y: 200, weight: 15, bornAt: 13, anomaly: true },

  { id: "chilled", kind: "physical", label: "排酸白条", sub: "冷耗 -2.1%", x: 430, y: 370, weight: 24, bornAt: 12 },

  // cluster ring for 156 SKUs
  { id: "cluster", kind: "cluster", label: "分割肉块集合", sub: "SKU: 156", x: 580, y: 380, weight: 38, bornAt: 14 },

  { id: "sku10", kind: "physical", label: "五花肉 A1", sub: "SKU_10 · 8.4kg", x: 680, y: 310, weight: 14, bornAt: 15 },
  { id: "sku01", kind: "physical", label: "梅花肉", sub: "SKU_01 · 4.1kg", x: 700, y: 400, weight: 12, bornAt: 15 },
  { id: "sku20", kind: "physical", label: "后腿肉", sub: "SKU_20 · 10.3kg", x: 660, y: 460, weight: 15, bornAt: 15 },

  { id: "pack", kind: "physical", label: "气调封装", sub: "O₂/N₂/CO₂", x: 560, y: 120, weight: 18, bornAt: 17 },
  { id: "box", kind: "physical", label: "生鲜箱 BOX-QR-8823", sub: "客诉目标节点", x: 700, y: 150, weight: 22, bornAt: 18 },

  { id: "iot", kind: "rule", label: "IoT 温湿传感器", sub: "@5s · 高频", x: 320, y: 360, weight: 14, bornAt: 6 },
];

const EDGES: GEdge[] = [
  { id: "e1", from: "batch", to: "pig", thickness: 4, kind: "flow", bornAt: 8 },
  { id: "e2", from: "stun", to: "pig", thickness: 1, kind: "rule", bornAt: 8 },
  { id: "e3", from: "pig", to: "carcass", thickness: 5, kind: "flow", bornAt: 10 },
  { id: "e4", from: "vet", to: "carcass", thickness: 1, kind: "rule", bornAt: 10 },
  { id: "e5", from: "vet", to: "vet_exc", thickness: 1, kind: "exc", bornAt: 14 },
  { id: "e6", from: "carcass", to: "chilled", thickness: 5, kind: "flow", bornAt: 12 },
  { id: "e7", from: "chillroom", to: "chilled", thickness: 2, kind: "rule", bornAt: 12 },
  { id: "e8", from: "chillroom", to: "chill_alarm", thickness: 1, kind: "exc", bornAt: 13 },
  { id: "e9", from: "iot", to: "chillroom", thickness: 6, kind: "rule", bornAt: 6 },
  { id: "e10", from: "chilled", to: "cluster", thickness: 6, kind: "flow", bornAt: 14 },
  { id: "e11", from: "cluster", to: "sku10", thickness: 2, kind: "flow", bornAt: 15 },
  { id: "e12", from: "cluster", to: "sku01", thickness: 2, kind: "flow", bornAt: 15 },
  { id: "e13", from: "cluster", to: "sku20", thickness: 2, kind: "flow", bornAt: 15 },
  { id: "e14", from: "sku10", to: "pack", thickness: 3, kind: "flow", bornAt: 17 },
  { id: "e15", from: "pack", to: "box", thickness: 4, kind: "flow", bornAt: 18 },
  { id: "e16", from: "chill_alarm", to: "chilled", thickness: 1, kind: "exc", bornAt: 13 },
];

// Blast-radius trace: box → pack → sku10 → cluster → chilled → carcass → pig → batch
const TRACE_PATH = ["box", "pack", "sku10", "cluster", "chilled", "carcass", "pig", "batch"];
const TRACE_EDGES = ["e15", "e14", "e11", "e10", "e6", "e3", "e1"];

const COLORS = {
  physical: "#FF6B6B",
  rule: "#1e90ff",
  exception: "#F97316",
  cluster: "#06b6d4",
  edge: "#2C3E50",
  ruleEdge: "#94a3b8",
  excEdge: "#F97316",
};

export function OntologyGraph() {
  const [now, setNow] = useState(18);
  const [playing, setPlaying] = useState(false);
  const [spotlight, setSpotlight] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(1);
  const [rippleFrom, setRippleFrom] = useState<string | null>(null);
  const [whatIfTemp, setWhatIfTemp] = useState(2.0);
  const [tick, setTick] = useState(0);
  const [insightOpen, setInsightOpen] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 60);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setNow((n) => {
        if (n >= 24) { setPlaying(false); return 24; }
        return +(n + 0.2).toFixed(1);
      });
    }, 220);
    return () => clearInterval(t);
  }, [playing]);

  const nodeMap = useMemo(() => {
    const m: Record<string, GNode> = {};
    NODES.forEach((n) => (m[n.id] = n));
    return m;
  }, []);

  // Visible at current time
  const visibleNodes = NODES.filter((n) => n.bornAt <= now);
  const visibleEdges = EDGES.filter((e) => e.bornAt <= now);

  // Trace set
  const inTrace = (id: string) => spotlight && TRACE_PATH.includes(id);
  const edgeInTrace = (id: string) => spotlight && TRACE_EDGES.includes(id);

  const dimmed = (id: string) => spotlight && !inTrace(id);
  const edgeDimmed = (id: string) => spotlight && !edgeInTrace(id);

  // What-If ripple targets (downstream from rippleFrom)
  const rippleTargets = rippleFrom
    ? ["chilled", "cluster", "sku10", "sku01", "sku20", "pack", "box"]
    : [];

  const predictedGain = Math.round((2.0 - whatIfTemp) * 12);

  const selected = spotlight ? nodeMap[spotlight] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">图数据建模</h1>
          <p className="text-slate-400 text-sm mt-1">
            牧原全息追溯探索台 · 时空穿梭 · 探照灯根因溯源 · What-If 涟漪预测
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Layers size={12} />
            节点 {visibleNodes.length} · 关系 {visibleEdges.length}
          </span>
          <button
            onClick={() => setSpotlight(null)}
            className="px-3 py-1.5 rounded-md text-sm text-slate-600 flex items-center gap-1.5"
            style={{ background: "#f1f5f9", border: "1px solid #e5e7eb" }}
          >
            <X size={12} /> 退出聚焦
          </button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="relative rounded-lg overflow-hidden" style={{ background: "#FAFAFA", border: "1px solid #e5e7eb", minHeight: 720 }}>
        {/* grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(#0000000a 1px,transparent 1px),linear-gradient(90deg,#0000000a 1px,transparent 1px)",
            backgroundSize: "32px 32px",
          }} />

        {/* Spotlight overlay */}
        {spotlight && (
          <div className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: "radial-gradient(circle at 50% 55%, rgba(15,23,42,0) 0%, rgba(15,23,42,0.28) 60%, rgba(15,23,42,0.55) 100%)",
            }} />
        )}

        {/* LEFT search panel */}
        <div
          className="absolute top-4 left-4 w-64 rounded-xl p-3 z-20"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(10px)",
            border: "1px solid #e5e7eb",
            boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
          }}
        >
          <div className="text-sm text-slate-800 flex items-center gap-1.5 mb-2">
            <ScanLine size={14} className="text-cyan-600" />
            智能检索舱
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
            <Search size={12} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="批次号 / 二维码 / 自然语言..."
              className="flex-1 bg-transparent outline-none text-xs placeholder:text-slate-400 text-slate-700"
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-2">建议检索</div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {["BOX-QR-8823", "HK-00247", "昨天 排酸异常", "批次 #2026-0420"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSearch(s);
                  if (s === "BOX-QR-8823") setSpotlight("box");
                  if (s === "HK-00247") setSpotlight("carcass");
                }}
                className="text-[10px] px-2 py-0.5 rounded-full text-slate-600 hover:text-cyan-700"
                style={{ background: "#f1f5f9", border: "1px solid #e5e7eb" }}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="text-[10px] text-slate-400">维度筛选</div>
            {[
              { label: "物理实体", c: COLORS.physical, count: 10 },
              { label: "规则/环境", c: COLORS.rule, count: 5 },
              { label: "异常事件", c: COLORS.exception, count: 2 },
              { label: "聚合环", c: COLORS.cluster, count: 1 },
            ].map((f) => (
              <label key={f.label} className="flex items-center justify-between text-xs cursor-pointer">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: f.c }} />
                  <span className="text-slate-700">{f.label}</span>
                </span>
                <span className="text-[10px] text-slate-400 tabular-nums">{f.count}</span>
              </label>
            ))}
          </div>

          <button
            onClick={() => setSpotlight("box")}
            className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs text-white"
            style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}
          >
            <Target size={12} />
            客诉追溯：BOX-QR-8823
          </button>
        </div>

        {/* RIGHT insight panel */}
        {insightOpen && (
          <div
            className="absolute top-4 right-4 w-72 rounded-xl p-3 z-20"
            style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(10px)",
              border: "1px solid #e5e7eb",
              boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-800 flex items-center gap-1.5">
                <Sparkles size={14} className="text-cyan-600" />
                洞察与行动
              </div>
              <button onClick={() => setInsightOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={12} />
              </button>
            </div>

            {!selected ? (
              <div className="mt-3 text-xs text-slate-500 leading-relaxed">
                <div className="rounded-md p-2.5" style={{ background: "#f8fafc", border: "1px dashed #cbd5e1" }}>
                  <MousePointerClick size={12} className="inline mr-1 text-slate-400" />
                  点选画布任意节点 · 展开属性、曲线与反向控制
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-1.5"><History size={11} className="text-cyan-600" />时空穿梭：拖动底部时轴回放</div>
                  <div className="flex items-center gap-1.5"><Target size={11} className="text-amber-500" />探照灯：点 BOX 节点反向追溯</div>
                  <div className="flex items-center gap-1.5"><Waves size={11} className="text-blue-500" />What-If：拖温度滑块激活涟漪</div>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="rounded-md p-3" style={{ background: "#fff", border: `1px solid ${kindColor(selected.kind)}55` }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: kindColor(selected.kind) }} />
                    <span className="text-sm text-slate-900">{selected.label}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{selected.sub}</div>
                </div>

                {/* mini live chart */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="flex items-center gap-1"><Thermometer size={10} /> 温度 24h</span>
                    <span className="tabular-nums text-slate-700">{whatIfTemp.toFixed(1)}°C</span>
                  </div>
                  <MiniLine data={miniSeries} warnAt={13} />
                </div>

                {/* What-If */}
                <div className="rounded-md p-2.5" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                  <div className="flex items-center justify-between text-[11px] text-blue-700 mb-1.5">
                    <span className="flex items-center gap-1"><Waves size={11} /> What-If 涟漪</span>
                    <span className="tabular-nums">{whatIfTemp.toFixed(1)}°C</span>
                  </div>
                  <input
                    type="range" min={0.5} max={4} step={0.1} value={whatIfTemp}
                    onChange={(e) => {
                      setWhatIfTemp(Number(e.target.value));
                      setRippleFrom(spotlight);
                      setTimeout(() => setRippleFrom(null), 1800);
                    }}
                    className="w-full accent-blue-500"
                  />
                  <div className="mt-2 text-[11px] flex items-center justify-between">
                    <span className="text-slate-500">下游预测收益</span>
                    <span className="text-emerald-600 flex items-center gap-1">
                      <TrendingUp size={11} />
                      +{predictedGain}% 冷耗挽回
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button className="px-2 py-1.5 rounded-md text-[11px] text-cyan-700 flex items-center justify-center gap-1"
                    style={{ background: "#ecfeff", border: "1px solid #a5f3fc" }}>
                    <Radio size={11} /> 查看实时流
                  </button>
                  <button className="px-2 py-1.5 rounded-md text-[11px] text-white flex items-center justify-center gap-1"
                    style={{ background: "linear-gradient(135deg,#f43f5e,#e11d48)" }}>
                    <Zap size={11} /> 反向控制
                  </button>
                </div>

                {selected.id === "box" && (
                  <div className="rounded-md p-2.5 text-[11px]"
                    style={{ background: "#fff7ed", border: "1px solid #fdba74", color: "#9a3412" }}>
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle size={11} /> 根因定位
                    </div>
                    <div className="text-slate-700 leading-relaxed">
                      链路追溯命中：<b>排酸库 A-05</b> 于 13:00 温度超标 5.3°C。
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CANVAS */}
        <div className="absolute inset-0" style={{ top: 0, bottom: 96 }}>
          <svg
            width="100%" height="100%" viewBox={`0 0 ${W} ${H + 40}`}
            style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
          >
            <defs>
              <marker id="graphArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill={COLORS.edge} />
              </marker>
              <marker id="traceArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="#fbbf24" />
              </marker>
              <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
              <filter id="traceGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <radialGradient id="clusterHalo" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Edges */}
            {visibleEdges.map((e) => {
              const a = nodeMap[e.from];
              const b = nodeMap[e.to];
              if (!a || !b) return null;
              const drift = driftOffset(e.from, tick);
              const drift2 = driftOffset(e.to, tick);
              const x1 = a.x + drift.x, y1 = a.y + drift.y;
              const x2 = b.x + drift2.x, y2 = b.y + drift2.y;
              const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
              const d = `M ${x1} ${y1} Q ${mx} ${my - 20}, ${x2} ${y2}`;

              const isTrace = edgeInTrace(e.id);
              const isDim = edgeDimmed(e.id);
              const stroke =
                e.kind === "exc" ? COLORS.excEdge :
                e.kind === "rule" ? COLORS.ruleEdge : COLORS.edge;
              const baseOpacity = isDim ? 0.08 : 1;

              return (
                <g key={e.id}>
                  <path
                    d={d}
                    stroke={isTrace ? "#fbbf24" : stroke}
                    strokeWidth={isTrace ? e.thickness + 2 : e.thickness}
                    strokeDasharray={e.kind === "rule" ? "5 4" : "0"}
                    fill="none"
                    opacity={baseOpacity}
                    markerEnd={`url(#${isTrace ? "traceArr" : "graphArr"})`}
                    filter={isTrace ? "url(#traceGlow)" : undefined}
                  />
                  {/* flowing particles */}
                  {e.kind === "flow" && !isDim && (
                    <path
                      d={d}
                      stroke={isTrace ? "#fde68a" : "#06b6d4"}
                      strokeWidth={e.thickness}
                      strokeDasharray="4 14"
                      strokeDashoffset={-tick * 2}
                      fill="none"
                      opacity={isTrace ? 0.9 : 0.55}
                    />
                  )}
                </g>
              );
            })}

            {/* Ripple waves from rippleFrom */}
            {rippleFrom && nodeMap[rippleFrom] && (
              [0, 1, 2].map((i) => {
                const n = nodeMap[rippleFrom];
                return (
                  <circle
                    key={i}
                    cx={n.x} cy={n.y} r={20 + i * 20}
                    fill="none" stroke="#1e90ff" strokeWidth={1.5}
                    opacity={0.6 - i * 0.18}
                    style={{ animation: `rippleOut 1.8s ease-out ${i * 0.2}s forwards` }}
                  />
                );
              })
            )}
            {rippleTargets.map((id) => {
              const n = nodeMap[id];
              if (!n) return null;
              return (
                <g key={"rt-" + id}>
                  <circle cx={n.x} cy={n.y - n.weight - 6} r={7} fill="#10b981" opacity={rippleFrom ? 0.9 : 0} style={{ transition: "opacity 400ms" }} />
                  <text x={n.x} y={n.y - n.weight - 2} textAnchor="middle" fontSize="9" fill="#fff" opacity={rippleFrom ? 1 : 0}>↑</text>
                </g>
              );
            })}

            {/* Nodes */}
            {visibleNodes.map((n) => {
              const drift = driftOffset(n.id, tick);
              const x = n.x + drift.x, y = n.y + drift.y;
              const isTrace = inTrace(n.id);
              const isDim = dimmed(n.id);
              const isHover = hover === n.id;
              const r = n.weight;
              const opacity = isDim ? 0.18 : 1;

              if (n.kind === "cluster") {
                return (
                  <g key={n.id} opacity={opacity} style={{ cursor: "pointer" }}
                    onClick={() => setSpotlight(n.id)} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}>
                    <circle cx={x} cy={y} r={r + 14} fill="url(#clusterHalo)" />
                    {[0, 1, 2].map((i) => (
                      <circle
                        key={i}
                        cx={x} cy={y} r={r - i * 4}
                        fill="none" stroke={COLORS.cluster} strokeWidth={2}
                        opacity={0.75 - i * 0.22}
                        style={{ transformOrigin: `${x}px ${y}px`, animation: `clusterSpin ${8 + i * 3}s linear infinite ${i % 2 ? "reverse" : ""}` }}
                      />
                    ))}
                    <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fill={COLORS.cluster}>SKU</text>
                    <text x={x} y={y + 16} textAnchor="middle" fontSize="13" fill="#0e7490">156</text>
                    <text x={x} y={y + r + 16} textAnchor="middle" fontSize="10" fill="#475569">{n.label}</text>
                  </g>
                );
              }

              const c = kindColor(n.kind);
              return (
                <g key={n.id} opacity={opacity} style={{ cursor: "pointer" }}
                  onClick={() => setSpotlight(n.id)}
                  onMouseEnter={() => setHover(n.id)}
                  onMouseLeave={() => setHover(null)}>
                  {/* anomaly heartbeat */}
                  {(n.anomaly || (isTrace && n.id === "chillroom")) && (
                    <circle cx={x} cy={y} r={r + 10} fill="none" stroke="#f43f5e" strokeWidth={2}
                      style={{ animation: "anomalyPulse 1.1s ease-in-out infinite" }} />
                  )}
                  {isTrace && (
                    <circle cx={x} cy={y} r={r + 6} fill="none" stroke="#fbbf24" strokeWidth={2} filter="url(#traceGlow)" />
                  )}

                  {n.kind === "physical" || n.kind === "exception" ? (
                    <>
                      <circle cx={x} cy={y} r={r} fill={c} opacity={0.15} />
                      <circle cx={x} cy={y} r={r * 0.65} fill={c} filter="url(#nodeGlow)" opacity={0.55} />
                      <circle cx={x} cy={y} r={r * 0.5} fill={c} />
                      {n.kind === "exception" && (
                        <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fill="#fff">!</text>
                      )}
                    </>
                  ) : (
                    <>
                      <rect x={x - r} y={y - r * 0.55} width={r * 2} height={r * 1.1} rx={r * 0.35}
                        fill="#fff" stroke={c} strokeWidth={1.5} />
                      <rect x={x - r + 3} y={y - r * 0.55 + 3} width={4} height={r * 1.1 - 6} rx={2} fill={c} />
                    </>
                  )}

                  {(isHover || isTrace || n.kind === "exception") && (
                    <g>
                      <rect x={x - 60} y={y + r + 4} width={120} height={28} rx={4} fill="#fff" stroke="#e5e7eb" />
                      <text x={x} y={y + r + 16} textAnchor="middle" fontSize="10" fill="#0f172a">{n.label}</text>
                      {n.sub && <text x={x} y={y + r + 27} textAnchor="middle" fontSize="9" fill="#94a3b8">{n.sub}</text>}
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* zoom control */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
            <button onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))} className="w-8 h-8 rounded-md text-slate-700" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>＋</button>
            <div className="text-center text-[10px] text-slate-400 tabular-nums">{(zoom * 100).toFixed(0)}%</div>
            <button onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))} className="w-8 h-8 rounded-md text-slate-700" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>－</button>
          </div>

          {/* legend */}
          <div className="absolute bottom-4 left-4 px-3 py-2 rounded-lg flex items-center gap-4 text-[11px] text-slate-600 z-10"
            style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", border: "1px solid #e5e7eb" }}>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.physical }} />物理实体</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.rule }} />规则/环境</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.exception }} />异常事件</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: COLORS.cluster }} />聚合环</span>
          </div>
        </div>

        {/* BOTTOM time scrubber */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 px-6 py-3 z-20"
          style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", borderTop: "1px solid #e5e7eb" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-800 flex items-center gap-1.5">
              <History size={14} className="text-cyan-600" />
              时空穿梭轴
              <span className="text-[10px] text-slate-400 ml-2">2026-04-20 · T = {fmtHour(now)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setNow(Math.max(0, now - 1))} className="w-7 h-7 rounded text-slate-600" style={{ background: "#f1f5f9" }}><Rewind size={12} /></button>
              <button onClick={() => setPlaying((p) => !p)}
                className="w-8 h-8 rounded-md text-white flex items-center justify-center"
                style={{ background: playing ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#06b6d4,#0284c7)" }}>
                {playing ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button onClick={() => setNow(Math.min(24, now + 1))} className="w-7 h-7 rounded text-slate-600" style={{ background: "#f1f5f9" }}><FastForward size={12} /></button>
            </div>
          </div>

          <div className="relative h-8">
            {/* event markers */}
            {[
              { h: 8, c: "#FF6B6B", label: "致昏放血" },
              { h: 10, c: "#FF6B6B", label: "开膛" },
              { h: 12, c: "#06b6d4", label: "排酸入库" },
              { h: 13, c: "#F97316", label: "温度超标" },
              { h: 14, c: "#F97316", label: "卫检拦截" },
              { h: 15, c: "#FF6B6B", label: "分割下线" },
              { h: 17, c: "#10b981", label: "气调封装" },
              { h: 18, c: "#10b981", label: "成品入库" },
            ].map((m) => (
              <div key={m.h + m.label} className="absolute -top-0.5" style={{ left: `${(m.h / 24) * 100}%`, transform: "translateX(-50%)" }} title={`${m.h}:00 · ${m.label}`}>
                <div className="w-2 h-2 rounded-full" style={{ background: m.c, boxShadow: `0 0 0 2px rgba(255,255,255,0.9)` }} />
              </div>
            ))}
            {/* track */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full" style={{ background: "#e2e8f0" }} />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full"
              style={{ width: `${(now / 24) * 100}%`, background: "linear-gradient(90deg,#06b6d4,#0ea5e9)" }} />
            <input
              type="range" min={0} max={24} step={0.1} value={now}
              onChange={(e) => setNow(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full pointer-events-none"
              style={{
                left: `calc(${(now / 24) * 100}% - 8px)`,
                background: "#fff", border: "2px solid #06b6d4",
                boxShadow: "0 2px 8px rgba(6,182,212,0.5)",
              }} />
            {/* hour ticks */}
            <div className="absolute left-0 right-0 bottom-0 flex justify-between text-[10px] text-slate-400 tabular-nums">
              {[0, 6, 12, 18, 24].map((h) => <span key={h}>{h}:00</span>)}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes clusterSpin { to { transform: rotate(360deg); } }
        @keyframes anomalyPulse {
          0%,100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.15); }
        }
        @keyframes rippleOut {
          0% { r: 0; opacity: 0.7; }
          100% { r: 200; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function kindColor(k: NodeKind) {
  return k === "physical" ? COLORS.physical : k === "rule" ? COLORS.rule : k === "exception" ? COLORS.exception : COLORS.cluster;
}

function driftOffset(id: string, tick: number) {
  const h = hash(id);
  const t = (tick + h) / 40;
  return { x: Math.sin(t) * 1.5, y: Math.cos(t * 0.9) * 1.2 };
}
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
  return h;
}
function fmtHour(h: number) {
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

const miniSeries = Array.from({ length: 24 }, (_, i) => {
  // slight rise, spike at 13h, then drop back
  const base = 2 + Math.sin(i / 3) * 0.3;
  const spike = i === 13 ? 3.3 : i === 12 ? 1.8 : i === 14 ? 2.1 : 0;
  return { h: i, v: base + spike };
});

function MiniLine({ data, warnAt }: { data: { h: number; v: number }[]; warnAt?: number }) {
  const w = 240, h = 60;
  const min = 0, max = 6;
  const path = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d.v - min) / (max - min)) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
      <line x1={0} y1={h - ((4 - min) / (max - min)) * h} x2={w} y2={h - ((4 - min) / (max - min)) * h}
        stroke="#fca5a5" strokeDasharray="3 3" strokeWidth={1} />
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#miniFill)" opacity={0.3} />
      <path d={path} stroke="#06b6d4" strokeWidth={1.8} fill="none" />
      {warnAt !== undefined && (
        <circle cx={(warnAt / (data.length - 1)) * w} cy={h - ((data[warnAt].v - min) / (max - min)) * h}
          r={4} fill="#f43f5e">
          <animate attributeName="r" values="3;6;3" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}
      <defs>
        <linearGradient id="miniFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
