import { useEffect, useMemo, useRef, useState } from "react";
import {
  ShieldAlert,
  FlaskConical,
  Search,
  ScanLine,
  Target,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Radar,
  Waves,
  TrendingUp,
  TrendingDown,
  Thermometer,
  Wind,
  Droplets,
  Zap,
  Play,
  RotateCcw,
  ChevronRight,
  Package,
  QrCode,
  Snowflake,
  Factory,
  Truck,
  Boxes,
  CircleDot,
  Activity,
  Fingerprint,
  Sparkles,
  DollarSign,
  Gauge,
  X,
} from "lucide-react";

type Scenario = null | "trace" | "sandbox";
type TraceStage = "idle" | "scanning" | "located" | "blast" | "isolating" | "done";
type SandboxStage = "idle" | "warn" | "tuning" | "deploying" | "synced";

export function OntologyApp() {
  const [scenario, setScenario] = useState<Scenario>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">本体应用 · MVP 验证场景</h1>
          <p className="text-slate-400 text-sm mt-1">
            垂直切片验证 · 守红线 (食品安全) × 赚真金 (出肉冷耗) · 用本体证明降维价值
          </p>
        </div>
        {scenario && (
          <button
            onClick={() => setScenario(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-slate-600"
            style={{ background: "#f1f5f9", border: "1px solid #e5e7eb" }}
          >
            <X size={12} /> 退出场景 · 返回矩阵
          </button>
        )}
      </div>

      {!scenario && <ScenarioPicker onPick={setScenario} />}
      {scenario === "trace" && <TraceScenario />}
      {scenario === "sandbox" && <SandboxScenario />}
    </div>
  );
}

// ============== PICKER ==============
function ScenarioPicker({ onPick }: { onPick: (s: Scenario) => void }) {
  const cards = [
    {
      id: "trace" as const,
      title: "场景一 · 精准异常溯源与物理熔断",
      sub: "基于逆向 BOM 的 Trace-back + Blast-Radius",
      value: "召回响应 ↓99% · 误伤损失 ↓90%",
      desc: "将传统批量召回升级为同一头猪的个体级精准阻断。商超客诉二维码 → 5 秒溯源 + 顺流爆炸 + 一键跨系统熔断。",
      icon: ShieldAlert, color: "#ef4444",
      tags: ["Neo4j 图谱", "MES / WMS 回写", "物理锁定"],
      kpi: [
        { k: "传统响应", v: "2-4 h", bad: true },
        { k: "本体响应", v: "≈ 5 s", good: true },
        { k: "封存范围", v: "同一头猪", good: true },
      ],
    },
    {
      id: "sandbox" as const,
      title: "场景二 · 排酸冷耗 AI 沙箱调优",
      sub: "What-If 推演 + SCADA 参数回写",
      value: "冷耗率 2.4% → 1.75% · +¥6,500/批",
      desc: "拖动滑块的同时 AI 模型实时推演，幽灵属性与利润数字像老虎机般翻滚，确认后参数下发至 SCADA。",
      icon: FlaskConical, color: "#1e90ff",
      tags: ["AI 预测", "SCADA 写回", "幽灵属性"],
      kpi: [
        { k: "凭经验", v: "2.0%~2.5%", bad: true },
        { k: "AI 动态", v: "1.7%~1.9%", good: true },
        { k: "年化挽回", v: "¥ 数百万", good: true },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* MVP 战术提示条 */}
      <div className="rounded-lg p-4 flex items-start gap-3"
        style={{ background: "linear-gradient(135deg,#ecfeff,#eff6ff)", border: "1px solid #bae6fd" }}>
        <div className="w-9 h-9 rounded-md flex items-center justify-center text-white shrink-0"
          style={{ background: "linear-gradient(135deg,#06b6d4,#0284c7)" }}>
          <Sparkles size={16} />
        </div>
        <div className="flex-1">
          <div className="text-sm text-slate-800">MVP 战术 · 取昨日某班次 500 头真实数据做时光机回放</div>
          <div className="text-xs text-slate-600 mt-1 leading-relaxed">
            不接入全厂实时流 · 两个场景各完成一次端到端演示即可震撼高层。下方选择场景开始演示。
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c.id)}
            className="text-left rounded-xl p-5 transition-all hover:-translate-y-1 relative overflow-hidden group"
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 6px 20px rgba(15,23,42,0.04)",
            }}
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10 transition-all group-hover:scale-110"
              style={{ background: `radial-gradient(circle, ${c.color}, transparent)` }} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                  style={{ background: `linear-gradient(135deg,${c.color},${c.color}cc)` }}>
                  <c.icon size={22} />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full tabular-nums"
                  style={{ background: `${c.color}14`, color: c.color }}>
                  MVP READY
                </span>
              </div>
              <div className="mt-4 text-slate-900 text-lg">{c.title}</div>
              <div className="text-xs text-slate-400 mt-0.5">{c.sub}</div>
              <div className="text-sm mt-3" style={{ color: c.color }}>{c.value}</div>
              <div className="text-xs text-slate-500 mt-2 leading-relaxed">{c.desc}</div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
                {c.kpi.map((k) => (
                  <div key={k.k}>
                    <div className="text-[10px] text-slate-400">{k.k}</div>
                    <div className={`text-sm tabular-nums ${k.good ? "text-emerald-600" : k.bad ? "text-red-500" : "text-slate-700"}`}>
                      {k.v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex flex-wrap gap-1">
                  {c.tags.map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded text-slate-600"
                      style={{ background: "#f1f5f9", border: "1px solid #e5e7eb" }}>{t}</span>
                  ))}
                </div>
                <span className="text-sm flex items-center gap-1" style={{ color: c.color }}>
                  开始演示 <ChevronRight size={14} />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============== SCENARIO 1: TRACE ==============

type TraceNode = {
  id: string;
  label: string;
  sub?: string;
  x: number; y: number;
  kind: "source" | "final" | "hub" | "sku" | "warehouse" | "line" | "dock";
  icon: any;
  color: string;
  inTracePath?: boolean; // reverse path
  inBlast?: boolean;     // blast radius
};

const TRACE_NODES: TraceNode[] = [
  { id: "pig", label: "活猪 EarTag_1092", sub: "今日 08:30 屠宰", x: 100, y: 70, kind: "source", icon: CircleDot, color: "#ef4444", inTracePath: true },
  { id: "hook", label: "白条 Hook_A405", sub: "97.8kg · 同步卫检 PASS", x: 280, y: 70, kind: "hub", icon: CircleDot, color: "#ef4444", inTracePath: true },
  { id: "cut", label: "分割事件 CUT-0812", sub: "分割线-02 · 08:54", x: 460, y: 70, kind: "hub", icon: Boxes, color: "#06b6d4", inTracePath: true },

  // Blast radius SKUs (siblings from same pig)
  { id: "tray_rib", label: "精肋排 Tray_B05", sub: "追溯目标", x: 620, y: 40, kind: "sku", icon: Package, color: "#ef4444", inTracePath: true },
  { id: "tray_belly", label: "五花肉 Tray_B11", sub: "气调包装线 #2", x: 620, y: 130, kind: "sku", icon: Package, color: "#ef4444", inBlast: true },
  { id: "tray_leg", label: "前腿肉 Tray_B17", sub: "WMS 冷库 C-12", x: 620, y: 220, kind: "sku", icon: Package, color: "#ef4444", inBlast: true },
  { id: "tray_butt", label: "后腿肉 Tray_B23", sub: "冷库 D-04", x: 620, y: 310, kind: "sku", icon: Package, color: "#ef4444", inBlast: true },
  { id: "tray_meh", label: "梅花肉 Tray_B29", sub: "冷库 C-08", x: 620, y: 400, kind: "sku", icon: Package, color: "#ef4444", inBlast: true },

  // Downstream locations
  { id: "pack_line2", label: "气调包装线 #2", sub: "MES · 在制", x: 820, y: 130, kind: "line", icon: Factory, color: "#0ea5e9", inBlast: true },
  { id: "wms_c12", label: "冷库 C-12", sub: "WMS 货位", x: 820, y: 220, kind: "warehouse", icon: Snowflake, color: "#0ea5e9", inBlast: true },
  { id: "wms_d04", label: "冷库 D-04", sub: "WMS 货位", x: 820, y: 310, kind: "warehouse", icon: Snowflake, color: "#0ea5e9", inBlast: true },
  { id: "wms_c08", label: "冷库 C-08", sub: "WMS 货位", x: 820, y: 400, kind: "warehouse", icon: Snowflake, color: "#0ea5e9", inBlast: true },

  // Final target (rib)
  { id: "box", label: "生鲜箱 QR-8821", sub: "商超客诉 · 脓包", x: 820, y: 40, kind: "final", icon: QrCode, color: "#10b981", inTracePath: true },
  { id: "dock", label: "待发货月台", sub: "承运 · SF-0420", x: 960, y: 40, kind: "dock", icon: Truck, color: "#64748b", inTracePath: true },
];

const TRACE_EDGES: Array<{ from: string; to: string; blast?: boolean; path?: boolean }> = [
  { from: "pig", to: "hook", path: true },
  { from: "hook", to: "cut", path: true },
  { from: "cut", to: "tray_rib", path: true },
  { from: "cut", to: "tray_belly", blast: true },
  { from: "cut", to: "tray_leg", blast: true },
  { from: "cut", to: "tray_butt", blast: true },
  { from: "cut", to: "tray_meh", blast: true },
  { from: "tray_belly", to: "pack_line2", blast: true },
  { from: "tray_leg", to: "wms_c12", blast: true },
  { from: "tray_butt", to: "wms_d04", blast: true },
  { from: "tray_meh", to: "wms_c08", blast: true },
  { from: "tray_rib", to: "box", path: true },
  { from: "box", to: "dock", path: true },
];

function TraceScenario() {
  const [stage, setStage] = useState<TraceStage>("idle");
  const [query, setQuery] = useState("");
  const [holdPct, setHoldPct] = useState(0);
  const [holding, setHolding] = useState(false);
  const [logs, setLogs] = useState<Array<{ t: string; text: string; ok: boolean }>>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 70);
    return () => clearInterval(t);
  }, []);

  const kickoff = () => {
    setQuery("QR-8821");
    setStage("scanning");
    setTimeout(() => setStage("located"), 1400);
    setTimeout(() => setStage("blast"), 3000);
  };

  const reset = () => {
    setStage("idle"); setQuery(""); setHoldPct(0); setHolding(false); setLogs([]);
  };

  useEffect(() => {
    if (!holding) return;
    const t = setInterval(() => {
      setHoldPct((p) => {
        if (p >= 100) {
          clearInterval(t);
          setHolding(false);
          setStage("isolating");
          setLogs([]);
          // cascade logs
          const entries = [
            { delay: 200, t: "[WMS]", text: "C-12 / D-04 / C-08 货位库存已变更为冻结态", ok: true, at: "120ms" },
            { delay: 600, t: "[MES]", text: "气调包装线 #2 已停机 · 拦截 Tray_B11", ok: true, at: "85ms" },
            { delay: 1000, t: "[ERP]", text: "当日预期产出 85.2kg 已冲销 ¥4,260", ok: true, at: "200ms" },
            { delay: 1500, t: "[溯源]", text: "EarTag_1092 已标记 QUARANTINE · 同栏加严抽检", ok: true, at: "60ms" },
          ];
          entries.forEach((e) => {
            setTimeout(() => {
              setLogs((prev) => [...prev, { t: `${e.t} ✓ ${e.at}`, text: e.text, ok: e.ok }]);
            }, e.delay);
          });
          setTimeout(() => setStage("done"), 2200);
          return 0;
        }
        return p + 4;
      });
    }, 120);
    return () => clearInterval(t);
  }, [holding]);

  const spotlight = stage !== "idle";
  const showBlast = stage === "blast" || stage === "isolating" || stage === "done";
  const showLocked = stage === "isolating" || stage === "done";

  const affectedCount = TRACE_NODES.filter((n) => n.inBlast || n.id === "tray_rib").length;

  return (
    <div className="space-y-3">
      {/* Stepper */}
      <Stepper
        steps={[
          { id: "scanning", label: "1 · 逆向溯源", active: stage !== "idle", done: ["located","blast","isolating","done"].includes(stage) },
          { id: "blast", label: "2 · 顺流爆炸", active: showBlast, done: ["isolating","done"].includes(stage) },
          { id: "isolating", label: "3 · 物理熔断", active: ["isolating","done"].includes(stage), done: stage === "done" },
          { id: "done", label: "4 · 闭环反馈", active: stage === "done", done: stage === "done" },
        ]}
      />

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 300px" }}>
        {/* canvas */}
        <div className="rounded-xl relative overflow-hidden" style={{ background: "#FAFAFA", border: "1px solid #e5e7eb", height: 560 }}>
          {/* crosshair grid */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(#0000000a 1px,transparent 1px),linear-gradient(90deg,#0000000a 1px,transparent 1px)",
              backgroundSize: "32px 32px",
            }} />
          {spotlight && (
            <div className="absolute inset-0 pointer-events-none transition-opacity"
              style={{ background: "radial-gradient(circle at 50% 50%, rgba(15,23,42,0) 0%, rgba(15,23,42,0.45) 100%)" }} />
          )}

          {/* search bar (acrylic) */}
          <div className="absolute top-4 left-4 z-20 rounded-xl p-2.5 flex items-center gap-2 w-96"
            style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(0,0,0,0.05)",
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
            }}>
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-white shrink-0"
              style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}>
              <ScanLine size={14} />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入包装追溯码 (如 QR-8821) · 回车溯源"
              onKeyDown={(e) => { if (e.key === "Enter" && query.trim()) kickoff(); }}
              className="flex-1 bg-transparent outline-none text-xs text-slate-700 placeholder:text-slate-400"
            />
            <button onClick={kickoff} className="px-2 py-1 rounded text-[11px] text-white"
              style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}>
              一键溯源
            </button>
            <button onClick={reset} className="px-2 py-1 rounded text-[11px] text-slate-500" style={{ background: "#f1f5f9" }}>
              <RotateCcw size={11} className="inline" />
            </button>
          </div>

          {/* radar pulse during scan */}
          {stage === "scanning" && (
            <div className="absolute z-10 pointer-events-none" style={{ left: 820, top: 40, transform: "translate(-50%,-50%)" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="absolute rounded-full border-2 border-amber-400"
                  style={{ width: 30, height: 30, left: -15, top: -15, animation: `radarRing 1.2s ease-out ${i * 0.3}s infinite` }} />
              ))}
              <div className="absolute -left-16 -top-10 px-2 py-1 rounded text-[11px] text-white flex items-center gap-1"
                style={{ background: "#f59e0b" }}>
                <Radar size={10} /> 扫描中...
              </div>
            </div>
          )}

          {/* SVG edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 480">
            <defs>
              <marker id="arrT" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="#2C3E50" />
              </marker>
              <filter id="trG" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {TRACE_EDGES.map((e, i) => {
              const a = TRACE_NODES.find((n) => n.id === e.from)!;
              const b = TRACE_NODES.find((n) => n.id === e.to)!;
              const d = `M ${a.x} ${a.y} C ${(a.x + b.x) / 2} ${a.y}, ${(a.x + b.x) / 2} ${b.y}, ${b.x} ${b.y}`;
              const isPath = e.path && stage !== "idle";
              const isBlast = e.blast && showBlast;
              const dim = stage !== "idle" && !isPath && !isBlast;

              return (
                <g key={i}>
                  <path d={d} stroke="#2C3E50" strokeWidth={isPath || isBlast ? 2.2 : 1.5} fill="none"
                    opacity={dim ? 0.08 : 0.6} markerEnd="url(#arrT)" />
                  {isPath && (
                    <path d={d} stroke="#1e90ff" strokeWidth={3} fill="none"
                      strokeDasharray="8 10" strokeDashoffset={tick * 3} opacity={0.9} filter="url(#trG)" />
                  )}
                  {isBlast && (
                    <path d={d} stroke="#f97316" strokeWidth={2.5} fill="none"
                      strokeDasharray="6 8" strokeDashoffset={-tick * 2} opacity={0.85} filter="url(#trG)" />
                  )}
                </g>
              );
            })}

            {/* Fission ripple from cut hub */}
            {stage === "blast" && (
              [0, 1, 2].map((i) => (
                <circle key={i} cx={460} cy={70} r={20 + i * 25}
                  fill="none" stroke="#f97316" strokeWidth={1.5} opacity={0.6 - i * 0.2}
                  style={{ animation: `fission 1.6s ease-out ${i * 0.2}s infinite` }} />
              ))
            )}
          </svg>

          {/* Nodes */}
          {TRACE_NODES.map((n) => {
            const isPath = n.inTracePath && stage !== "idle";
            const isBlast = n.inBlast && showBlast;
            const dim = stage !== "idle" && !isPath && !isBlast;
            const isFinal = n.id === "box";
            const isHub = n.id === "hook";
            const locked = showLocked && (n.inBlast || n.id === "tray_rib");

            return (
              <div key={n.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-all"
                style={{
                  left: n.x, top: n.y,
                  opacity: dim ? 0.22 : 1,
                  filter: dim ? "grayscale(1)" : "none",
                }}>
                <div className="relative flex flex-col items-center">
                  {/* pulse rings */}
                  {(isFinal && stage === "located") || (isHub && stage === "located") ? (
                    <div className="absolute w-14 h-14 rounded-full border-2"
                      style={{ borderColor: "#f97316", animation: "pulseRing 1.2s ease-in-out infinite" }} />
                  ) : null}
                  {isBlast && !locked && (
                    <div className="absolute w-12 h-12 rounded-full border-2"
                      style={{ borderColor: "#f97316", animation: "pulseRing 1s ease-in-out infinite" }} />
                  )}

                  <div className="relative w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{
                      background: locked ? "#475569" : n.color,
                      boxShadow: locked ? "0 0 0 3px rgba(71,85,105,0.2)" : isPath ? "0 0 14px rgba(30,144,255,0.55)" : isBlast ? "0 0 14px rgba(249,115,22,0.55)" : `0 0 0 2px ${n.color}22`,
                      transition: "all 300ms",
                    }}>
                    {locked ? <Lock size={16} /> : <n.icon size={16} />}
                  </div>

                  <div className="mt-1 text-center whitespace-nowrap">
                    <div className={`text-[11px] ${dim ? "text-slate-400" : "text-slate-800"}`}>{n.label}</div>
                    {n.sub && <div className="text-[10px] text-slate-400">{n.sub}</div>}
                  </div>

                  {/* location chip for blast nodes */}
                  {isBlast && !locked && n.kind !== "line" && n.kind !== "warehouse" && (
                    <div className="absolute -top-6 px-1.5 py-0.5 rounded text-[10px] text-white whitespace-nowrap"
                      style={{ background: "#f97316", animation: "blink 1.2s ease-in-out infinite" }}>
                      ⚠ 在制 / 待发
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Source info panel (left acrylic) */}
          {stage !== "idle" && (
            <div className="absolute bottom-4 left-4 z-20 rounded-xl p-3 w-72"
              style={{
                background: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(0,0,0,0.05)",
                boxShadow: "0 10px 30px rgba(15,23,42,0.1)",
              }}>
              <div className="text-sm text-slate-800 flex items-center gap-1.5">
                <Target size={14} className="text-amber-500" /> 异常源头锁定
              </div>
              <div className="mt-2 space-y-1 text-[11px]">
                <InfoRow k="成品" v="QR-8821 · 精肋排 500g/盒" />
                <InfoRow k="所属托盘" v="Tray_B05" />
                <InfoRow k="溯源白条" v="Hook_A405 · 97.8kg" hi />
                <InfoRow k="源头活猪" v="EarTag_1092 · 08:30 屠宰" hi />
                <InfoRow k="批次" v="#2026-0420-A2" />
                <InfoRow k="同源 SKU" v={`${affectedCount} 件（见右侧）`} warn />
              </div>
            </div>
          )}
        </div>

        {/* Right action drawer */}
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          {stage === "idle" ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#fed7aa,#fecaca)" }}>
                <ShieldAlert size={22} className="text-red-500" />
              </div>
              <div className="text-sm text-slate-800">场景待命</div>
              <div className="text-xs text-slate-500 leading-relaxed px-2">
                在左上角输入 <b>QR-8821</b> 或点击"一键溯源"启动演示 · 黄金 15 秒完成排雷拆弹
              </div>
              <button onClick={() => {
                const evt = new Event("kickoff"); // placeholder
                setQuery("QR-8821");
                setTimeout(() => document.dispatchEvent(evt), 0);
              }} className="hidden">hidden</button>
            </div>
          ) : stage !== "done" && stage !== "isolating" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-red-500" />
                  批次 Hook_A405 熔断
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded text-white"
                  style={{ background: "#ef4444", animation: "blink 1.4s ease-in-out infinite" }}>ARMED</span>
              </div>

              <div className="rounded-md p-3 space-y-1.5 text-[11px]"
                style={{ background: "#fff7ed", border: "1px solid #fdba74" }}>
                <InfoRow k="受影响在制 SKU" v={`${affectedCount} 件`} warn />
                <InfoRow k="冷库冻结货位" v="3 处 (C-08 / C-12 / D-04)" warn />
                <InfoRow k="在线包装线" v="#2 气调线" warn />
                <InfoRow k="预估拦截重量" v="85.2 kg" warn />
                <InfoRow k="预估经济损失" v="¥ 4,260" warn />
              </div>

              {stage === "blast" ? (
                <div>
                  <button
                    onMouseDown={() => setHolding(true)}
                    onMouseUp={() => { setHolding(false); setHoldPct(0); }}
                    onMouseLeave={() => { setHolding(false); setHoldPct(0); }}
                    className="relative w-full h-11 rounded-md overflow-hidden text-white text-sm select-none"
                    style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)", boxShadow: "0 6px 18px rgba(239,68,68,0.35)" }}
                  >
                    <div className="absolute inset-y-0 left-0 transition-all"
                      style={{ width: `${holdPct}%`, background: "rgba(255,255,255,0.22)" }} />
                    <span className="relative flex items-center justify-center gap-1.5">
                      <Lock size={14} />
                      {holdPct > 0 ? `熔断充能中 ${holdPct}%` : "长按 3 秒 · 确认熔断"}
                    </span>
                  </button>
                  <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={10} /> 操作不可逆 · 将冻结 WMS 库存并停线
                  </div>
                </div>
              ) : (
                <div className="rounded-md p-3 text-[11px] text-slate-500"
                  style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                  <Activity size={11} className="inline text-cyan-500 mr-1" />
                  正在展开顺流 Blast-Radius · 染色同源 SKU...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {stage === "done" ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <Zap size={16} className="text-red-500" />
                )}
                <div className="text-sm text-slate-800">{stage === "done" ? "熔断已闭环" : "跨系统指令飞梭中..."}</div>
              </div>

              <div className="rounded-md p-3 space-y-1.5 text-[11px] max-h-64 overflow-auto"
                style={{ background: "#0f172a" }}>
                {logs.length === 0 && (
                  <div className="text-slate-500">等待底层系统 ACK...</div>
                )}
                {logs.map((l, i) => (
                  <div key={i} className="flex items-start gap-2 text-emerald-300 font-mono">
                    <span className="text-emerald-400">{l.t}</span>
                    <span className="text-slate-200 flex-1">{l.text}</span>
                  </div>
                ))}
              </div>

              {stage === "done" && (
                <>
                  <div className="rounded-md p-3 text-[11px]"
                    style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857" }}>
                    <CheckCircle2 size={11} className="inline mr-1" />
                    已将传统 2-4h 的召回压缩至 ≈ 5 秒 · 误伤重量下降 92%
                  </div>
                  <button onClick={reset}
                    className="w-full px-3 py-2 rounded-md text-sm text-slate-600"
                    style={{ background: "#f1f5f9" }}>
                    <RotateCcw size={12} className="inline mr-1" /> 重新演示
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulseRing { 0%,100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.25); opacity: 0.4; } }
        @keyframes radarRing { 0% { transform: scale(0.2); opacity: 0.9; } 100% { transform: scale(3); opacity: 0; } }
        @keyframes fission { 0% { r: 20; opacity: 0.7; } 100% { r: 140; opacity: 0; } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
      `}</style>
    </div>
  );
}

function InfoRow({ k, v, hi, warn }: { k: string; v: string; hi?: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{k}</span>
      <span className={`tabular-nums ${hi ? "text-cyan-700" : warn ? "text-orange-600" : "text-slate-800"}`}>{v}</span>
    </div>
  );
}

function Stepper({ steps }: { steps: Array<{ id: string; label: string; active: boolean; done: boolean }> }) {
  return (
    <div className="rounded-lg p-3 flex items-center justify-between" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs"
            style={{
              background: s.done ? "#10b981" : s.active ? "#06b6d4" : "#e2e8f0",
              color: s.active || s.done ? "#fff" : "#94a3b8",
              boxShadow: s.active && !s.done ? "0 0 0 4px rgba(6,182,212,0.18)" : "none",
            }}>
            {s.done ? <CheckCircle2 size={13} /> : i + 1}
          </div>
          <span className={`text-xs ${s.active ? "text-slate-800" : "text-slate-400"}`}>{s.label}</span>
          {i < steps.length - 1 && (
            <div className="flex-1 h-px mx-2" style={{ background: s.done ? "#10b981" : "#e2e8f0" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ============== SCENARIO 2: SANDBOX ==============

function SandboxScenario() {
  const [stage, setStage] = useState<SandboxStage>("warn");
  const [temp, setTemp] = useState(2.0);
  const [fan, setFan] = useState(45);
  const [humid, setHumid] = useState(85);
  const [deployHold, setDeployHold] = useState(false);
  const [deployPct, setDeployPct] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 80);
    return () => clearInterval(t);
  }, []);

  // deploy long-press
  useEffect(() => {
    if (!deployHold) return;
    const t = setInterval(() => {
      setDeployPct((p) => {
        if (p >= 100) {
          clearInterval(t);
          setDeployHold(false);
          setStage("deploying");
          setTimeout(() => setStage("synced"), 1800);
          return 0;
        }
        return p + 5;
      });
    }, 120);
    return () => clearInterval(t);
  }, [deployHold]);

  // Prediction model
  const predLoss = useMemo(() => {
    // baseline 2.4% at temp=2.0 fan=45 humid=85
    const t = (2.0 - temp) * 0.28;          // lower temp → lower loss
    const h = (humid - 85) * 0.015;          // higher humid → lower loss
    const f = (fan - 45) * -0.01;            // lower fan → lower loss
    const pred = Math.max(0.9, 2.4 - t - h - f);
    return +pred.toFixed(2);
  }, [temp, fan, humid]);

  const gainKg = Math.max(0, Math.round((2.4 - predLoss) * 500)); // 500 carcasses
  const gainYuan = gainKg * 20;

  const isTuning = temp !== 2.0 || fan !== 45 || humid !== 85;

  useEffect(() => {
    if (isTuning && stage === "warn") setStage("tuning");
  }, [isTuning, stage]);

  const reset = () => {
    setStage("warn"); setTemp(2.0); setFan(45); setHumid(85); setDeployPct(0); setDeployHold(false);
  };

  // generate dual curves for mini chart
  const curves = useMemo(() => {
    const hours = 24;
    const baseline = Array.from({ length: hours + 1 }, (_, i) => 30 - 28 * (1 - Math.exp(-i / 6)));
    const predicted = Array.from({ length: hours + 1 }, (_, i) => {
      const decay = 6 - (2.0 - temp) * 1.2 - (humid - 85) * 0.05;
      return 30 - (30 - temp) * (1 - Math.exp(-i / Math.max(2, decay)));
    });
    return { baseline, predicted };
  }, [temp, humid]);

  return (
    <div className="space-y-3">
      <Stepper
        steps={[
          { id: "warn", label: "1 · AI 预测示警", active: true, done: stage !== "warn" },
          { id: "tuning", label: "2 · 沙箱调参", active: stage === "tuning" || stage === "deploying" || stage === "synced", done: stage === "deploying" || stage === "synced" },
          { id: "deploying", label: "3 · SCADA 回写", active: stage === "deploying" || stage === "synced", done: stage === "synced" },
          { id: "synced", label: "4 · 现实同步", active: stage === "synced", done: stage === "synced" },
        ]}
      />

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 340px" }}>
        {/* canvas — sandbox */}
        <div className="rounded-xl relative overflow-hidden" style={{ height: 560, border: "1px solid #e5e7eb",
          background: stage === "synced" ? "#FAFAFA" : "linear-gradient(180deg,#eef2f9 0%,#e5ecf7 100%)",
          transition: "background 600ms",
        }}>
          {/* Klein-blue holographic grid in sim mode */}
          {stage !== "synced" && (
            <div className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "linear-gradient(rgba(30,144,255,0.10) 1px,transparent 1px),linear-gradient(90deg,rgba(30,144,255,0.10) 1px,transparent 1px)",
                backgroundSize: "32px 32px",
                animation: "gridShift 12s linear infinite",
              }} />
          )}

          {/* mode badge */}
          <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded text-[10px] flex items-center gap-1"
            style={{
              background: stage === "synced" ? "#ecfdf5" : "rgba(30,144,255,0.14)",
              color: stage === "synced" ? "#047857" : "#1e40af",
              border: `1px solid ${stage === "synced" ? "#a7f3d0" : "#bfdbfe"}`,
            }}>
            <CircleDot size={9} className="animate-pulse" />
            {stage === "synced" ? "REALITY · SYNCED" : "PARALLEL UNIVERSE"}
          </div>

          {/* Central focus: ChillRoom A-05 */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            {/* outer pulse ring */}
            <div className="relative">
              {stage === "warn" && (
                <div className="absolute -inset-4 rounded-3xl border-2"
                  style={{ borderColor: "#f59e0b", animation: "pulseRing 1.6s ease-in-out infinite" }} />
              )}
              {stage === "synced" && (
                <div className="absolute -inset-4 rounded-3xl border-2"
                  style={{ borderColor: "#10b981", animation: "pulseRing 1.6s ease-in-out infinite" }} />
              )}

              <div className="relative px-8 py-6 rounded-2xl"
                style={{
                  background: "#ffffff",
                  border: `2px solid ${stage === "synced" ? "#10b981" : "#0ea5e9"}`,
                  boxShadow: "0 20px 50px rgba(15,23,42,0.1)",
                  minWidth: 280,
                }}>
                <div className="flex items-center justify-center gap-2 text-slate-900">
                  <Snowflake size={18} className="text-cyan-500" />
                  <span className="text-lg">排酸库 A-05</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">500 头 · 偏瘦白条入库</div>

                {/* Current state */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Stat icon={Thermometer} label="库温" value={`${temp.toFixed(1)}°C`} was="2.0" changed={temp !== 2.0} />
                  <Stat icon={Wind} label="风机" value={`${fan} Hz`} was="45" changed={fan !== 45} />
                  <Stat icon={Droplets} label="湿度" value={`${humid}%`} was="85" changed={humid !== 85} />
                </div>

                {/* Ghost property — loss prediction */}
                <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                  <div className="text-[11px] text-slate-400">AI 预测冷耗</div>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    {isTuning && (
                      <span className="text-sm tabular-nums text-slate-300 line-through">2.40%</span>
                    )}
                    <span
                      key={predLoss}
                      className="text-3xl tabular-nums"
                      style={{
                        color: predLoss < 1.9 ? "#1e40af" : predLoss > 2.2 ? "#ea580c" : "#64748b",
                        textShadow: predLoss < 1.9 ? "0 0 14px rgba(30,64,175,0.5)" : "none",
                        animation: "digitFlip 260ms ease",
                      }}
                    >
                      {predLoss.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">基准线 1.8%</div>
                </div>

                {/* Profit counter */}
                {isTuning && gainYuan > 0 && (
                  <div className="mt-3 rounded-md p-2"
                    style={{ background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", border: "1px solid #6ee7b7" }}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-700 flex items-center gap-1">
                        <DollarSign size={11} /> 利润印钞机
                      </span>
                      <span className="tabular-nums text-emerald-700">+{gainKg} kg</span>
                    </div>
                    <div
                      key={gainYuan}
                      className="text-center text-2xl tabular-nums text-emerald-600 mt-1"
                      style={{ animation: "coinPop 400ms ease" }}>
                      +¥ {gainYuan.toLocaleString()}
                    </div>
                  </div>
                )}

                {stage === "synced" && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ background: "#10b981", boxShadow: "0 4px 12px rgba(16,185,129,0.45)" }}>
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>
            </div>

            {/* Warn tooltip initially */}
            {stage === "warn" && !isTuning && (
              <div className="mt-4 mx-auto rounded-lg px-3 py-2 w-72 text-left"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid #fdba74",
                  boxShadow: "0 10px 30px rgba(249,115,22,0.15)",
                }}>
                <div className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertTriangle size={11} /> AI 预测超标 · 右侧唤醒沙箱推演
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  预估经济损失 <span className="text-red-500 tabular-nums">-¥8,500</span> / 批次 · 2.4% 冷耗 · 建议降温 + 补湿
                </div>
              </div>
            )}
          </div>

          {/* Deploy beam animation when deploying */}
          {stage === "deploying" && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 560">
              <defs>
                <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1e90ff" stopOpacity="0" />
                  <stop offset="50%" stopColor="#1e90ff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#1e90ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1={800} y1={280} x2={400} y2={280} stroke="url(#beam)" strokeWidth={6}
                strokeDasharray="200 800" strokeDashoffset={-tick * 20} />
            </svg>
          )}

          {/* SCADA gateway node bottom-right */}
          <div className="absolute bottom-4 right-4 z-10 rounded-lg px-3 py-2 text-xs"
            style={{
              background: stage === "synced" ? "#ecfdf5" : "#ffffff",
              border: `1px solid ${stage === "synced" ? "#a7f3d0" : "#e5e7eb"}`,
              color: stage === "synced" ? "#047857" : "#475569",
            }}>
            <Gauge size={11} className="inline mr-1" />
            SCADA 网关 {stage === "synced" && <CheckCircle2 size={11} className="inline ml-1" />}
          </div>
        </div>

        {/* Right console */}
        <div className="rounded-xl p-4 space-y-4" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-800 flex items-center gap-1.5">
              <FlaskConical size={14} className="text-blue-500" />
              排酸调优控制舱
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"
              style={{ background: "#eff6ff", color: "#1e40af" }}>
              <Waves size={9} className="animate-pulse" /> V3.0 已连接
            </span>
          </div>

          <Slider icon={<Thermometer size={12} />} label="目标库温" value={temp} min={0.5} max={3.5} step={0.1} unit="°C"
            color="#1e90ff" onChange={setTemp} />
          <Slider icon={<Wind size={12} />} label="风机频率" value={fan} min={20} max={60} step={1} unit="Hz"
            color="#0ea5e9" onChange={setFan} />
          <Slider icon={<Droplets size={12} />} label="湿度补偿" value={humid} min={70} max={98} step={1} unit="%"
            color="#06b6d4" onChange={setHumid} />

          {/* Dual curve */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span>排酸降温曲线 · 24h</span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-slate-300" />原设定</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500" />推演</span>
              </div>
            </div>
            <DualCurve baseline={curves.baseline} predicted={curves.predicted} />
          </div>

          {/* Deploy */}
          {stage === "deploying" ? (
            <div className="rounded-md p-3 text-xs text-blue-700"
              style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <Activity size={12} className="inline mr-1 animate-pulse" />
              参数光束注入 SCADA · PLC 响应中...
            </div>
          ) : stage === "synced" ? (
            <div className="space-y-2">
              <div className="rounded-md p-3 text-xs"
                style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857" }}>
                <CheckCircle2 size={12} className="inline mr-1" />
                [15:30] A-05 库温曲线已重置 · 预计降冷耗 {(2.4 - predLoss).toFixed(2)}%
              </div>
              <button onClick={reset} className="w-full px-3 py-2 rounded-md text-sm text-slate-600"
                style={{ background: "#f1f5f9" }}>
                <RotateCcw size={12} className="inline mr-1" /> 重新演示
              </button>
            </div>
          ) : (
            <div>
              <button
                disabled={!isTuning}
                onMouseDown={() => isTuning && setDeployHold(true)}
                onMouseUp={() => { setDeployHold(false); setDeployPct(0); }}
                onMouseLeave={() => { setDeployHold(false); setDeployPct(0); }}
                className="relative w-full h-11 rounded-md overflow-hidden text-white text-sm select-none"
                style={{
                  background: isTuning ? "linear-gradient(135deg,#1e90ff,#1d4ed8)" : "#cbd5e1",
                  boxShadow: isTuning ? "0 6px 18px rgba(30,144,255,0.35)" : "none",
                  cursor: isTuning ? "pointer" : "not-allowed",
                }}>
                <div className="absolute inset-y-0 left-0 transition-all"
                  style={{ width: `${deployPct}%`, background: "rgba(255,255,255,0.22)" }} />
                <span className="relative flex items-center justify-center gap-1.5">
                  <Fingerprint size={14} />
                  {deployPct > 0 ? `验证身份中 ${deployPct}%` : "按住下发至 SCADA 控制层"}
                </span>
              </button>
              <div className="text-[10px] text-slate-400 mt-1.5 text-center">
                {isTuning ? "防误触双重确认 · 工业级严谨" : "先调参使模型产生正收益后再下发"}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes gridShift { to { background-position: 32px 32px; } }
        @keyframes digitFlip { 0% { transform: translateY(-6px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes coinPop { 0% { transform: scale(0.85); } 60% { transform: scale(1.08); } 100% { transform: scale(1); } }
        @keyframes pulseRing { 0%,100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.08); opacity: 0.4; } }
      `}</style>
    </div>
  );
}

function Stat({ icon: I, label, value, was, changed }: { icon: any; label: string; value: string; was: string; changed: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
        <I size={9} /> {label}
      </div>
      <div className="flex items-center justify-center gap-1 mt-0.5">
        {changed && <span className="text-[10px] text-slate-300 line-through tabular-nums">{was}</span>}
        <span className={`text-sm tabular-nums ${changed ? "text-blue-700" : "text-slate-800"}`}
          style={changed ? { textShadow: "0 0 8px rgba(30,144,255,0.4)" } : {}}>
          {value}
        </span>
      </div>
    </div>
  );
}

function Slider({ icon, label, value, min, max, step, unit, color, onChange }: {
  icon: React.ReactNode; label: string; value: number; min: number; max: number; step: number; unit: string; color: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-600 flex items-center gap-1">{icon}{label}</span>
        <span className="tabular-nums" style={{ color }}>{typeof value === "number" && step < 1 ? value.toFixed(1) : value} {unit}</span>
      </div>
      <div className="relative h-6 rounded-full" style={{ background: "#e2e8f0" }}>
        <div className="absolute left-0 top-0 bottom-0 rounded-full"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}cc)` }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-pointer w-full" />
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)`, boxShadow: `0 2px 6px ${color}66`, border: `2px solid ${color}` }} />
      </div>
    </div>
  );
}

function DualCurve({ baseline, predicted }: { baseline: number[]; predicted: number[] }) {
  const w = 300, h = 70;
  const toPath = (arr: number[]) =>
    arr
      .map((v, i) => {
        const x = (i / (arr.length - 1)) * w;
        const y = h - (v / 32) * h;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="predFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e90ff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1e90ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* target zone 0-4°C */}
      <rect x={0} y={h - (4 / 32) * h} width={w} height={(4 / 32) * h} fill="#10b981" opacity={0.08} />
      <path d={toPath(baseline)} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" fill="none" />
      <path d={`${toPath(predicted)} L ${w} ${h} L 0 ${h} Z`} fill="url(#predFill)" />
      <path d={toPath(predicted)} stroke="#1e90ff" strokeWidth={2} fill="none" />
    </svg>
  );
}
