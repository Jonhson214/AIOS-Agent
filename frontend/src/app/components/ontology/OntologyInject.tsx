import { useEffect, useRef, useState } from "react";
import {
  Hammer,
  Activity,
  FlaskConical,
  Cpu,
  Brain,
  Sparkles,
  Lock,
  Unlock,
  Send,
  CircleDot,
  Snowflake,
  Zap,
  ShieldAlert,
  CheckCircle2,
  X,
  Camera,
  Gauge,
  TrendingUp,
  TrendingDown,
  Radio,
  Waves,
  Wind,
  Thermometer,
  GitBranch,
  AlertTriangle,
  ChevronRight,
  MousePointerClick,
} from "lucide-react";

type Mode = "build" | "monitor" | "sim";

const panel = { background: "#ffffff", border: "1px solid #e5e7eb" };

const AI_PLUGINS = [
  { id: "p1", name: "排酸冷耗预测", tag: "Chill-Loss", desc: "基于LSTM · 预测 24h 冷耗曲线", gain: "+¥3,500/日" },
  { id: "p2", name: "动态分割出肉率优化器", tag: "Yield-Opt", desc: "强化学习 · 最优切割策略", gain: "+1.2% 出肉率" },
  { id: "p3", name: "卫检视觉病变识别", tag: "Vision-Vet", desc: "CNN · 甲状腺/淋巴异常", gain: "召回 99.3%" },
  { id: "p4", name: "冷库温度寻优", tag: "HVAC-Tune", desc: "MPC · 能耗 ↓ 同时保温", gain: "-8% 电耗" },
  { id: "p5", name: "SKU 需求反哺", tag: "Demand-Pull", desc: "市场需求 → 分割方案回调", gain: "库存 ↓ 14%" },
];

const NODES = [
  { id: "pig", x: 90, y: 60, w: 150, h: 60, title: "活猪个体", sub: "EarTag · P-0318", c: "#ef4444" },
  { id: "carcass", x: 90, y: 200, w: 150, h: 60, title: "带毛白条", sub: "Hook_RFID · HK-00247", c: "#ef4444" },
  { id: "chill", x: 90, y: 340, w: 150, h: 60, title: "排酸白条", sub: "预冷 24h", c: "#ef4444", showGhost: true },
  { id: "split", x: 360, y: 340, w: 150, h: 60, title: "分割矩阵", sub: "1:N 拆解", c: "#06b6d4" },
  { id: "pack", x: 630, y: 340, w: 150, h: 60, title: "成品生鲜箱", sub: "Box_QR", c: "#10b981" },
  { id: "chillroom", x: 360, y: 200, w: 150, h: 60, title: "排酸库 A-05", sub: "SCADA · 2.0°C", c: "#0ea5e9", device: true },
  { id: "scada", x: 630, y: 200, w: 150, h: 60, title: "SCADA 总线", sub: "PLC · WriteBack", c: "#64748b", device: true },
];

const EDGES: Array<{ from: string; to: string; label?: string; id: string }> = [
  { id: "e1", from: "pig", to: "carcass", label: "屠宰拆解" },
  { id: "e2", from: "carcass", to: "chill", label: "CHILLED_IN · 预冷熟成" },
  { id: "e3", from: "chill", to: "split", label: "进分割线" },
  { id: "e4", from: "split", to: "pack", label: "气调封装" },
  { id: "e5", from: "chillroom", to: "chill", label: "温控" },
  { id: "e6", from: "scada", to: "chillroom", label: "指令回写" },
];

function nodeCenter(id: string) {
  const n = NODES.find((x) => x.id === id)!;
  return { x: n.x + n.w / 2, y: n.y + n.h / 2, n };
}

function edgePath(e: { from: string; to: string }) {
  const a = nodeCenter(e.from);
  const b = nodeCenter(e.to);
  const dx = b.x - a.x;
  const mx = (a.x + b.x) / 2;
  if (Math.abs(dx) > 40 && Math.abs(b.y - a.y) < 40) {
    return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  }
  return `M ${a.x} ${a.y} C ${a.x} ${(a.y + b.y) / 2}, ${b.x} ${(a.y + b.y) / 2}, ${b.x} ${b.y}`;
}

export function OntologyInject() {
  const [mode, setMode] = useState<Mode>("sim");
  const [injected, setInjected] = useState<Record<string, string>>({ e2: "p1" }); // edgeId → pluginId
  const [dragPlugin, setDragPlugin] = useState<string | null>(null);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);
  const [simTemp, setSimTemp] = useState(2.0);
  const [simChillHours, setSimChillHours] = useState(24);
  const [simFanSpeed, setSimFanSpeed] = useState(75);
  const [tick, setTick] = useState(0);
  const [alertOpen, setAlertOpen] = useState(true);
  const [locked, setLocked] = useState(true);
  const [commandNode, setCommandNode] = useState<string | null>(null);
  const [pushPct, setPushPct] = useState(0);
  const [pushing, setPushing] = useState(false);
  const [ackToast, setAckToast] = useState<string | null>(null);

  // flow tick
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 60);
    return () => clearInterval(t);
  }, []);

  // long-press push
  useEffect(() => {
    if (!pushing) return;
    const t = setInterval(() => {
      setPushPct((p) => {
        if (p >= 100) {
          clearInterval(t);
          setPushing(false);
          setAckToast("指令已生效：风机转速调至 " + simFanSpeed + "%");
          setTimeout(() => setAckToast(null), 3600);
          return 0;
        }
        return p + 4;
      });
    }, 120);
    return () => clearInterval(t);
  }, [pushing, simFanSpeed]);

  const predYield = (62 + (2.0 - simTemp) * 0.4 + (simFanSpeed - 75) * 0.02).toFixed(2);
  const predProfit = Math.round((2.0 - simTemp) * 3500 + (simFanSpeed - 75) * 50);
  const predWeight = (97.9 + (2.0 - simTemp) * 0.25).toFixed(2);

  const bgByMode: React.CSSProperties =
    mode === "sim"
      ? { background: "linear-gradient(180deg,#f0f4fb 0%,#eaf1fb 100%)" }
      : mode === "monitor"
      ? { background: "#fafafa" }
      : { background: "#ffffff" };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">本体注入</h1>
          <p className="text-slate-400 text-sm mt-1">
            数字生命体管控台 · 构建 / 监控执行 / AI 仿真沙箱 · 三档无缝切换
          </p>
        </div>
        <ModeSwitcher mode={mode} setMode={setMode} />
      </div>

      {/* stat strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { k: "已挂载 AI 芯片", v: String(Object.keys(injected).length), sub: "磁吸注入 · 实时监听", c: "#06b6d4", I: Brain },
          { k: "可下发写点", v: "12", sub: "SCADA 寄存器 · 长按确认", c: "#f59e0b", I: Zap },
          { k: "今日预测收益", v: "¥ 18.2K", sub: "AI 沙箱推演 · 累计", c: "#10b981", I: TrendingUp },
          { k: "异常阻断次数", v: "3", sub: "今日自动拦截 · 闭环", c: "#ef4444", I: ShieldAlert },
        ].map((s) => (
          <div key={s.k} className="rounded-lg p-4" style={panel}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{s.k}</span>
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${s.c}14`, color: s.c }}>
                <s.I size={14} />
              </div>
            </div>
            <div className="text-2xl text-slate-900 mt-2 tabular-nums">{s.v}</div>
            <div className="text-xs text-slate-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Main workspace */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "240px 1fr 300px" }}>
        {/* LEFT panel */}
        <div className="rounded-lg p-3 space-y-3" style={panel}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-800 flex items-center gap-1.5">
              <Cpu size={14} className="text-cyan-600" />
              {mode === "sim" ? "AI 算力舱" : mode === "monitor" ? "设备节点" : "物料库"}
            </div>
            <span className="text-[10px] text-slate-400">{mode === "sim" ? "拖拽至连线注入" : mode === "monitor" ? "右键呼出指令" : "第一步预置"}</span>
          </div>

          {mode === "sim" ? (
            <div className="space-y-2">
              {AI_PLUGINS.map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => setDragPlugin(p.id)}
                  onDragEnd={() => { setDragPlugin(null); setHoverEdge(null); }}
                  className="p-3 rounded-md cursor-grab active:cursor-grabbing transition-all hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg,#f0f9ff,#eff6ff)",
                    border: "1px solid #bfdbfe",
                    boxShadow: "0 2px 8px rgba(30,144,255,0.08)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-white"
                      style={{ background: "linear-gradient(135deg,#1e90ff,#6366f1)", boxShadow: "0 0 12px rgba(30,144,255,0.5)" }}
                    >
                      <Brain size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-900 truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{p.tag}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 leading-relaxed">{p.desc}</div>
                  <div className="text-[10px] text-emerald-600 mt-1">预估收益 {p.gain}</div>
                </div>
              ))}
            </div>
          ) : mode === "monitor" ? (
            <div className="space-y-2">
              {NODES.filter((n) => n.device).map((n) => (
                <button
                  key={n.id}
                  onClick={() => setCommandNode(n.id)}
                  className={`w-full p-3 rounded-md text-left transition-all ${commandNode === n.id ? "ring-2 ring-cyan-300" : ""}`}
                  style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}
                >
                  <div className="flex items-center gap-2">
                    <Radio size={12} className="text-cyan-600" />
                    <span className="text-xs text-slate-800">{n.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{n.sub}</div>
                </button>
              ))}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                <MousePointerClick size={10} className="inline" /> 点击设备节点 → 右侧呼出动作指令舱
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {["🔴 物理实体", "🔵 规范资产", "🟠 管理流程"].map((s) => (
                <div key={s} className="p-2 rounded-md text-xs text-slate-600" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>{s}</div>
              ))}
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">切换到 Monitor / Sim 解锁高级能力</div>
            </div>
          )}
        </div>

        {/* CENTER canvas */}
        <div className="rounded-lg relative overflow-hidden" style={panel}>
          <div
            className="relative"
            style={{ ...bgByMode, height: 460, transition: "background 400ms ease" }}
          >
            {/* Klein blue grid for sim */}
            {mode === "sim" && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(30,144,255,0.10) 1px,transparent 1px),linear-gradient(90deg,rgba(30,144,255,0.10) 1px,transparent 1px)",
                  backgroundSize: "28px 28px",
                  animation: "gridShift 12s linear infinite",
                }}
              />
            )}
            {mode !== "sim" && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: "linear-gradient(#0000000a 1px,transparent 1px),linear-gradient(90deg,#0000000a 1px,transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
            )}

            {/* mode badge */}
            <div
              className="absolute top-3 right-3 px-2 py-1 rounded text-[10px] tabular-nums flex items-center gap-1 z-10"
              style={{
                background: mode === "sim" ? "rgba(30,144,255,0.12)" : mode === "monitor" ? "rgba(6,182,212,0.12)" : "#f1f5f9",
                color: mode === "sim" ? "#1e40af" : mode === "monitor" ? "#0e7490" : "#475569",
                border: `1px solid ${mode === "sim" ? "#bfdbfe" : mode === "monitor" ? "#a5f3fc" : "#e5e7eb"}`,
              }}
            >
              <CircleDot size={10} className={mode !== "build" ? "animate-pulse" : ""} />
              {mode === "sim" ? "PARALLEL UNIVERSE" : mode === "monitor" ? "LIVE · ARMED" : "DESIGN MODE"}
            </div>

            {/* Alert intercept pill */}
            {mode === "monitor" && alertOpen && (
              <div
                className="absolute z-20 rounded-lg p-3 text-xs"
                style={{
                  left: 90, top: 125, width: 280,
                  background: "#ffffff",
                  border: "1px solid #fb923c",
                  boxShadow: "0 12px 30px rgba(251,146,60,0.25)",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-orange-600 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    AI 异常拦截触发
                  </span>
                  <button onClick={() => setAlertOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={12} /></button>
                </div>
                <div className="text-slate-700 leading-relaxed">
                  批次 <b>#2026-0420</b> 疑似甲状腺病变，已锁定后续加工。
                </div>
                <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                  <div><span className="text-emerald-600">✓</span> [10:24:01] 悬挂轨道 → 3 号无害化处理线</div>
                  <div><span className="text-emerald-600">✓</span> [10:24:02] ERP 冲销预计产出 95kg</div>
                </div>
                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                  <button className="flex-1 px-2 py-1 rounded text-[11px] text-cyan-700 flex items-center justify-center gap-1"
                    style={{ background: "#ecfeff", border: "1px solid #a5f3fc" }}>
                    <Camera size={10} /> 现场抓拍
                  </button>
                  <button onClick={() => setLocked(false)} className="flex-1 px-2 py-1 rounded text-[11px] text-slate-600"
                    style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                    人工强制放行
                  </button>
                </div>
              </div>
            )}

            {/* Ack toast */}
            {ackToast && (
              <div
                className="absolute z-30 top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md text-xs flex items-center gap-2"
                style={{ background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", boxShadow: "0 10px 25px rgba(16,185,129,0.18)" }}
              >
                <CheckCircle2 size={14} /> {ackToast}
              </div>
            )}

            {/* SVG edges */}
            <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" viewBox="0 0 880 460">
              <defs>
                <marker id="arrInj" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill="#1f2937" />
                </marker>
                <marker id="arrCmd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill="#f43f5e" />
                </marker>
                <filter id="aiGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" />
                </filter>
              </defs>

              {EDGES.map((e) => {
                const path = edgePath(e);
                const hasAI = injected[e.id];
                const isBlocked = e.id === "e2" && alertOpen && locked && mode === "monitor";
                const isCmd = e.id === "e6" && mode === "monitor";
                const hover = hoverEdge === e.id && dragPlugin;
                const stroke = isBlocked ? "#94a3b8" : isCmd ? "#f43f5e" : "#1f2937";
                const dash = isBlocked ? "6 6" : isCmd ? "8 6" : "0";

                return (
                  <g key={e.id}>
                    {/* hit area */}
                    <path
                      d={path} stroke="transparent" strokeWidth={24} fill="none"
                      style={{ pointerEvents: "stroke" }}
                      onDragOver={(ev) => { ev.preventDefault(); setHoverEdge(e.id); }}
                      onDragLeave={() => setHoverEdge(null)}
                      onDrop={() => {
                        if (dragPlugin) setInjected({ ...injected, [e.id]: dragPlugin });
                        setDragPlugin(null); setHoverEdge(null);
                      }}
                    />
                    <path
                      d={path}
                      stroke={stroke}
                      strokeWidth={hover ? 5 : 2.5}
                      strokeDasharray={dash}
                      fill="none"
                      markerEnd={`url(#${isCmd ? "arrCmd" : "arrInj"})`}
                      style={{
                        transition: "stroke-width 200ms",
                        animation: isCmd ? `cmdFlow 1.2s linear infinite` : "none",
                      }}
                    />
                    {/* Monitor-mode data packets */}
                    {mode === "monitor" && !isBlocked && !isCmd && (
                      <path
                        d={path} stroke="#06b6d4" strokeWidth={2.5} fill="none"
                        strokeDasharray="6 14" strokeDashoffset={-tick * 2} opacity={0.7}
                      />
                    )}
                    {/* Sim-mode ghost packets */}
                    {mode === "sim" && hasAI && (
                      <path
                        d={path} stroke="#1e90ff" strokeWidth={3} fill="none"
                        strokeDasharray="4 10" strokeDashoffset={-tick * 3} opacity={0.55}
                        filter="url(#aiGlow)"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {NODES.map((n) => {
              const locked_ = n.id === "chill" && alertOpen && locked && mode === "monitor";
              const ghost = n.showGhost && mode === "sim";
              return (
                <div
                  key={n.id}
                  onClick={() => n.device && mode === "monitor" && setCommandNode(n.id)}
                  className="absolute rounded-lg px-3 py-2"
                  style={{
                    left: n.x, top: n.y, width: n.w, height: n.h,
                    background: "#ffffff",
                    border: locked_ ? "2px solid #fb923c" : `1px solid ${n.c}55`,
                    boxShadow: locked_ ? "0 0 0 4px rgba(251,146,60,0.15)" : `0 4px 12px ${n.c}1c`,
                    cursor: n.device && mode === "monitor" ? "pointer" : "default",
                    animation: locked_ ? "lockPulse 1.6s ease-in-out infinite" : "none",
                  }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{ background: n.c }} />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-900">{n.title}</span>
                    {locked_ && <Lock size={12} className="text-orange-500" />}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{n.sub}</div>

                  {/* Ghost property overlay in sim mode */}
                  {ghost && (
                    <div className="absolute -top-8 left-0 right-0 flex items-center justify-center gap-1">
                      <span className="text-[10px] text-slate-300 line-through">97.9kg</span>
                      <span
                        className="text-[11px] tabular-nums px-1.5 py-0.5 rounded"
                        style={{
                          color: "#1e40af",
                          background: "rgba(30,144,255,0.12)",
                          textShadow: "0 0 8px rgba(30,144,255,0.6)",
                          border: "1px solid rgba(30,144,255,0.35)",
                        }}
                      >
                        → {predWeight}kg
                      </span>
                    </div>
                  )}

                  {n.device && mode === "monitor" && (
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
              );
            })}

            {/* AI chip markers on injected edges */}
            {Object.entries(injected).map(([edgeId, pluginId]) => {
              const e = EDGES.find((x) => x.id === edgeId);
              if (!e) return null;
              const a = nodeCenter(e.from);
              const b = nodeCenter(e.to);
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
              const plugin = AI_PLUGINS.find((p) => p.id === pluginId);
              return (
                <div
                  key={edgeId}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: mx, top: my }}
                  title={plugin?.name}
                >
                  <div
                    className="w-9 h-9 rounded-md flex items-center justify-center text-white"
                    style={{
                      background: "linear-gradient(135deg,#1e90ff,#6366f1)",
                      boxShadow: "0 0 0 3px rgba(30,144,255,0.2), 0 0 14px rgba(30,144,255,0.6)",
                      animation: "aiBreath 2s ease-in-out infinite",
                    }}
                  >
                    <Brain size={15} />
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 whitespace-nowrap text-[10px] text-blue-700 px-1.5 py-0.5 rounded"
                    style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    {plugin?.tag}
                  </div>
                </div>
              );
            })}

            {/* Drop hint */}
            {dragPlugin && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-md text-xs text-blue-700"
                style={{ background: "rgba(239,246,255,0.9)", border: "1px dashed #60a5fa", backdropFilter: "blur(6px)" }}>
                <Waves size={12} className="inline mr-1" />
                拖至连线即可磁吸注入 · 连线将加粗并点亮
              </div>
            )}
          </div>
        </div>

        {/* RIGHT panel */}
        <div className="rounded-lg p-4" style={panel}>
          {mode === "sim" ? (
            <SimConsole
              simTemp={simTemp} setSimTemp={setSimTemp}
              simChillHours={simChillHours} setSimChillHours={setSimChillHours}
              simFanSpeed={simFanSpeed} setSimFanSpeed={setSimFanSpeed}
              predYield={predYield} predProfit={predProfit} predWeight={predWeight}
            />
          ) : mode === "monitor" ? (
            <CommandDrawer
              commandNode={commandNode}
              simFanSpeed={simFanSpeed} setSimFanSpeed={setSimFanSpeed}
              simTemp={simTemp} setSimTemp={setSimTemp}
              pushing={pushing} setPushing={setPushing}
              pushPct={pushPct} setPushPct={setPushPct}
            />
          ) : (
            <BuildHint />
          )}
        </div>
      </div>

      <style>{`
        @keyframes gridShift { to { background-position: 28px 28px; } }
        @keyframes aiBreath {
          0%,100% { box-shadow: 0 0 0 3px rgba(30,144,255,0.2), 0 0 14px rgba(30,144,255,0.6); }
          50% { box-shadow: 0 0 0 6px rgba(30,144,255,0.12), 0 0 22px rgba(30,144,255,0.9); }
        }
        @keyframes lockPulse {
          0%,100% { box-shadow: 0 0 0 4px rgba(251,146,60,0.15); }
          50% { box-shadow: 0 0 0 8px rgba(251,146,60,0.28); }
        }
        @keyframes cmdFlow { to { stroke-dashoffset: -28; } }
        @keyframes digitFlip {
          0% { transform: translateY(-6px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function ModeSwitcher({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const items: Array<{ id: Mode; label: string; icon: any; c: string }> = [
    { id: "build", label: "构建", icon: Hammer, c: "#475569" },
    { id: "monitor", label: "监控执行", icon: Activity, c: "#06b6d4" },
    { id: "sim", label: "AI 仿真沙箱", icon: FlaskConical, c: "#1e90ff" },
  ];
  return (
    <div
      className="flex items-center p-1 rounded-xl"
      style={{ background: "#f1f5f9", border: "1px solid #e5e7eb", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {items.map((it) => {
        const active = mode === it.id;
        return (
          <button
            key={it.id}
            onClick={() => setMode(it.id)}
            className="relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              background: active ? "#ffffff" : "transparent",
              color: active ? it.c : "#64748b",
              boxShadow: active ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <it.icon size={14} />
            {it.label}
            {active && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ background: it.c }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function SimConsole(p: {
  simTemp: number; setSimTemp: (v: number) => void;
  simChillHours: number; setSimChillHours: (v: number) => void;
  simFanSpeed: number; setSimFanSpeed: (v: number) => void;
  predYield: string; predProfit: number; predWeight: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-800 flex items-center gap-1.5">
          <Sparkles size={14} className="text-blue-500" />
          What-If 调参控制台
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#eff6ff", color: "#1e40af" }}>SANDBOX</span>
      </div>

      <div className="rounded-lg p-3" style={{ background: "linear-gradient(135deg,#f0f9ff,#eff6ff)", border: "1px solid #bfdbfe" }}>
        <div className="text-[10px] text-blue-700 mb-1">AI 实时推演</div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <div className="text-[10px] text-slate-400">预测出肉率</div>
            <div key={p.predYield} className="text-xl tabular-nums text-blue-700" style={{ animation: "digitFlip 300ms ease" }}>
              {p.predYield}%
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">预测冷后重</div>
            <div key={p.predWeight} className="text-xl tabular-nums text-blue-700" style={{ animation: "digitFlip 300ms ease" }}>
              {p.predWeight}kg
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-blue-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">利润差值</span>
          <span className={`tabular-nums flex items-center gap-1 ${p.predProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {p.predProfit >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {p.predProfit >= 0 ? "+" : ""}¥{p.predProfit.toLocaleString()}/日
          </span>
        </div>
      </div>

      <MixerSlider label="模拟排酸库温度" icon={<Thermometer size={12} />}
        value={p.simTemp} min={0.5} max={4} step={0.1} unit="°C"
        onChange={p.setSimTemp} />

      <MixerSlider label="排酸时长" icon={<Snowflake size={12} />}
        value={p.simChillHours} min={12} max={48} step={1} unit="h"
        onChange={p.setSimChillHours} />

      <MixerSlider label="风机转速" icon={<Wind size={12} />}
        value={p.simFanSpeed} min={30} max={100} step={1} unit="%"
        onChange={p.setSimFanSpeed} />

      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
        提示：拖动滑块，画布上幽灵属性将像老虎机一样翻滚 · 不影响真实生产
      </div>
    </div>
  );
}

function MixerSlider({ label, icon, value, min, max, step, unit, onChange }: {
  label: string; icon: React.ReactNode; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-600 flex items-center gap-1">{icon}{label}</span>
        <span className="tabular-nums text-blue-700">{value.toFixed(step < 1 ? 1 : 0)} {unit}</span>
      </div>
      <div className="relative h-6 rounded-full" style={{ background: "#e2e8f0" }}>
        <div className="absolute left-0 top-0 bottom-0 rounded-full"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#1e90ff,#6366f1)" }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-pointer w-full" />
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)`, boxShadow: "0 2px 6px rgba(30,144,255,0.4)", border: "2px solid #1e90ff" }} />
      </div>
    </div>
  );
}

function CommandDrawer(p: {
  commandNode: string | null;
  simFanSpeed: number; setSimFanSpeed: (v: number) => void;
  simTemp: number; setSimTemp: (v: number) => void;
  pushing: boolean; setPushing: (v: boolean) => void;
  pushPct: number; setPushPct: (v: number) => void;
}) {
  if (!p.commandNode) {
    return (
      <div className="text-center py-10">
        <Send size={28} className="mx-auto text-slate-300" />
        <div className="text-sm text-slate-500 mt-3">动作指令舱</div>
        <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          点击画布左侧"设备节点"列表中的任一设备，<br />呼出可写寄存器与下发面板
        </div>
      </div>
    );
  }
  const n = NODES.find((x) => x.id === p.commandNode)!;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-800 flex items-center gap-1.5">
          <Zap size={14} className="text-amber-500" />
          动作指令舱
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#fef3c7", color: "#92400e" }}>ARMED</span>
      </div>
      <div className="rounded-md p-2.5" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
        <div className="text-xs text-slate-800">{n.title}</div>
        <div className="text-[11px] text-slate-400">{n.sub}</div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600 flex items-center gap-1"><Thermometer size={11} /> 目标温度</span>
            <span className="tabular-nums text-slate-800">{p.simTemp.toFixed(1)} °C</span>
          </div>
          <input type="range" min={0} max={6} step={0.1} value={p.simTemp}
            onChange={(e) => p.setSimTemp(Number(e.target.value))} className="w-full accent-cyan-500" />
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600 flex items-center gap-1"><Wind size={11} /> 风机转速</span>
            <span className="tabular-nums text-slate-800">{p.simFanSpeed} %</span>
          </div>
          <input type="range" min={0} max={100} step={1} value={p.simFanSpeed}
            onChange={(e) => p.setSimFanSpeed(Number(e.target.value))} className="w-full accent-cyan-500" />
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600 flex items-center gap-1"><Gauge size={11} /> 写入寄存器</span>
            <span className="tabular-nums text-slate-500">D1024 / D1025</span>
          </div>
          <div className="text-[10px] text-slate-400">SCADA OPC-UA · 双写确认</div>
        </div>
      </div>

      {/* Long-press confirm */}
      <button
        onMouseDown={() => p.setPushing(true)}
        onMouseUp={() => { p.setPushing(false); p.setPushPct(0); }}
        onMouseLeave={() => { p.setPushing(false); p.setPushPct(0); }}
        className="relative w-full h-10 rounded-md overflow-hidden text-white text-sm select-none"
        style={{ background: "linear-gradient(135deg,#f43f5e,#e11d48)" }}
      >
        <div
          className="absolute inset-y-0 left-0 transition-all"
          style={{ width: `${p.pushPct}%`, background: "rgba(255,255,255,0.25)" }}
        />
        <span className="relative flex items-center justify-center gap-1.5">
          <Unlock size={13} />
          {p.pushPct > 0 ? `确认下发中… ${p.pushPct}%` : "长按 3 秒确认下发"}
        </span>
      </button>

      <div className="text-[11px] text-slate-400 leading-relaxed flex items-start gap-1">
        <ShieldAlert size={11} className="mt-0.5 text-amber-500 shrink-0" />
        工业控制防误触 · 必须长按注满进度条，珊瑚红光束将沿连线飞向 SCADA，PLC 返回 ACK 后节点外圈变翠绿
      </div>
    </div>
  );
}

function BuildHint() {
  return (
    <div className="space-y-3 text-xs text-slate-600">
      <div className="flex items-center gap-1.5 text-slate-800 text-sm">
        <Hammer size={14} className="text-slate-500" />
        构建模式
      </div>
      <div className="rounded-md p-3" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
        纯白背景 · 拖拽节点 / 拉线映射 · 完成基础本体定义与关系建模后，切换至 Monitor / Sim 模式解锁下述能力：
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-cyan-600" />
          <span>监控执行：右键设备节点呼出指令舱，长按下发</span>
        </div>
        <div className="flex items-center gap-2">
          <FlaskConical size={12} className="text-blue-500" />
          <span>AI 仿真：拖 AI 芯片磁吸至连线，What-If 推演</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldAlert size={12} className="text-orange-500" />
          <span>异常阻断：AI 拦截自动锁定节点与工单回写</span>
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 flex items-center gap-1 text-[11px] text-cyan-600">
        <ChevronRight size={12} /> 顶部档位切换即刻生效
      </div>
    </div>
  );
}
