import {
  Truck,
  Scissors,
  PackageCheck,
  AlertTriangle,
  Thermometer,
  Activity,
  CheckCircle2,
  Clock,
  Beef,
  Snowflake,
  ChevronRight,
  TrendingUp,
  Zap,
  Gauge,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

const cardBg = { background: "#ffffff", border: "1px solid #e5e7eb" };

type TopStat = {
  k: string;
  v: number;
  icon: typeof Truck;
  c: string;
  bg: string;
  trend: number[];
  delta: string;
};

const initialTopStats: TopStat[] = [
  { k: "待处理活猪批次", v: 5, icon: Truck, c: "#3b82f6", bg: "rgba(59,130,246,0.1)", trend: [3, 4, 4, 5, 6, 5, 5], delta: "+1" },
  { k: "胴体加工与冷链中", v: 6, icon: Scissors, c: "#10b981", bg: "rgba(16,185,129,0.1)", trend: [4, 5, 6, 6, 7, 6, 6], delta: "+2" },
  { k: "已完工成品入库", v: 4, icon: PackageCheck, c: "#a78bfa", bg: "rgba(167,139,250,0.1)", trend: [1, 2, 2, 3, 3, 4, 4], delta: "+3" },
  { k: "冷链预警", v: 2, icon: AlertTriangle, c: "#f59e0b", bg: "rgba(245,158,11,0.1)", trend: [0, 1, 1, 2, 1, 2, 2], delta: "+1" },
];

type PigBatch = { id: string; src: string; weight: string; head: number; arrive: string; eta: number };
const initialBatches: PigBatch[] = [
  { id: "MY-PIG-2026-0050", src: "内乡 F3 养殖场", weight: "15.1 吨", head: 120, arrive: "08:20", eta: 12 },
  { id: "MY-PIG-2026-0051", src: "南阳 F5 养殖场", weight: "14.6 吨", head: 118, arrive: "09:05", eta: 28 },
  { id: "MY-PIG-2026-0052", src: "商水 F2 养殖场", weight: "15.8 吨", head: 122, arrive: "09:40", eta: 46 },
  { id: "MY-PIG-2026-0053", src: "正阳 F1 养殖场", weight: "14.2 吨", head: 115, arrive: "10:15", eta: 64 },
  { id: "MY-PIG-2026-0054", src: "浚县 F4 养殖场", weight: "15.4 吨", head: 121, arrive: "10:50", eta: 82 },
];

type Order = { id: string; stage: string; progress: number; back: string; lean: string; pig: string };
const initialOrders: Order[] = [
  { id: "SC-CW-2026-0120", stage: "白条劈半", progress: 68, back: "2.1 cm", lean: "60.5%", pig: "MY-PIG-2026-0047" },
  { id: "SC-CW-2026-0119", stage: "排酸预冷", progress: 82, back: "2.3 cm", lean: "59.8%", pig: "MY-PIG-2026-0046" },
  { id: "SC-CW-2026-0118", stage: "分割剔骨", progress: 94, back: "2.0 cm", lean: "61.2%", pig: "MY-PIG-2026-0045" },
  { id: "SC-CW-2026-0117", stage: "包装贴标", progress: 100, back: "2.2 cm", lean: "60.1%", pig: "MY-PIG-2026-0044" },
  { id: "SC-CW-2026-0116", stage: "同步卫检", progress: 42, back: "2.1 cm", lean: "60.8%", pig: "MY-PIG-2026-0048" },
  { id: "SC-CW-2026-0115", stage: "开膛去脏", progress: 25, back: "—", lean: "—", pig: "MY-PIG-2026-0049" },
];

const finished = [
  { spec: "25kg/箱 梅花肉 (Boston Butt)", net: "248.6 kg", loc: "C-02 / A12-03", from: "SC-CW-2026-0117" },
  { spec: "20kg/箱 里脊肉 (Tenderloin)", net: "198.2 kg", loc: "C-02 / A08-11", from: "SC-CW-2026-0116" },
  { spec: "30kg/箱 五花肉 (Pork Belly)", net: "296.4 kg", loc: "C-02 / B02-05", from: "SC-CW-2026-0115" },
  { spec: "25kg/箱 后腿肉 (Ham)", net: "250.8 kg", loc: "C-02 / B05-09", from: "SC-CW-2026-0114" },
];

type Step = {
  k: string;
  t: string;
  sub: string;
  dev: string;
  metricLabel: string;
  baseMetric: number;
  unit: string;
  status: "done" | "running" | "pending" | "warn";
};
const initialSteps: Step[] = [
  { k: "1", t: "活猪静养 Lairage", sub: "地磅 #LB-01 · RFID", dev: "静养圈 L-A/L-B", metricLabel: "头数", baseMetric: 120, unit: "头", status: "done" },
  { k: "2", t: "致昏放血 Stunning & Bleeding", sub: "CO₂ 致昏线 #SB-01", dev: "悬挂系统运行", metricLabel: "致昏率", baseMetric: 100, unit: "%", status: "done" },
  { k: "3", t: "烫毛打毛 Scalding & Dehairing", sub: "蒸汽隧道 #TH-02", dev: "螺旋打毛机 #DH-03", metricLabel: "温度", baseMetric: 62, unit: "°C", status: "done" },
  { k: "4", t: "开膛去脏 Evisceration", sub: "自动开膛机器人 #VS-01", dev: "红脏/白脏分流", metricLabel: "节拍", baseMetric: 720, unit: "头/h", status: "done" },
  { k: "5", t: "同步卫检 Synced Inspection", sub: "智能检测线 #IN-01", dev: "头/脏/体同步", metricLabel: "合格率", baseMetric: 99.6, unit: "%", status: "done" },
  { k: "6", t: "白条劈半 Carcass Splitting", sub: "自动劈半电锯 #SL-05", dev: "运行中", metricLabel: "锯速", baseMetric: 2100, unit: "rpm", status: "running" },
  { k: "7", t: "卫检称重 Weighing & Grading", sub: "称重轨道秤 #WS-07", dev: "分级入库预冷", metricLabel: "白条重", baseMetric: 110.0, unit: "吨", status: "running" },
  { k: "8", t: "排酸预冷 Chilling & Aging", sub: "排酸库 A-05", dev: "温控调整中", metricLabel: "库温", baseMetric: 1.8, unit: "°C", status: "warn" },
  { k: "9", t: "分割剔骨 Cutting & Deboning", sub: "分割线 #CU-01", dev: "待机", metricLabel: "锯速", baseMetric: 0, unit: "rpm", status: "pending" },
  { k: "10", t: "包装贴标 Packing & Labeling", sub: "气调保鲜机 #PK-01", dev: "待机", metricLabel: "节拍", baseMetric: 0, unit: "箱/h", status: "pending" },
  { k: "11", t: "成品入库 Product WMS", sub: "冷库 C-02", dev: "待机", metricLabel: "入库", baseMetric: 0, unit: "箱", status: "pending" },
];

function StatusPill({ s }: { s: Step["status"] }) {
  const m = {
    done: { c: "#10b981", bg: "rgba(16,185,129,0.12)", t: "已完成", I: CheckCircle2 },
    running: { c: "#06b6d4", bg: "rgba(6,182,212,0.12)", t: "运行中", I: Activity },
    pending: { c: "#94a3b8", bg: "rgba(148,163,184,0.15)", t: "待机", I: Clock },
    warn: { c: "#f59e0b", bg: "rgba(245,158,11,0.15)", t: "温控调整", I: AlertTriangle },
  }[s];
  const I = m.I;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${s === "running" || s === "warn" ? "animate-pulse" : ""}`}
      style={{ background: m.bg, color: m.c }}
    >
      <I size={11} />
      {m.t}
    </span>
  );
}

function LiveDot({ color }: { color: string }) {
  return (
    <span className="relative inline-flex w-2 h-2">
      <span className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ background: color }} />
      <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: color }} />
    </span>
  );
}

function formatClock(d: Date) {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function ProductionOverview() {
  const [now, setNow] = useState(new Date());
  const [stats, setStats] = useState<TopStat[]>(initialTopStats);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [batches, setBatches] = useState<PigBatch[]>(initialBatches);
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [throughput, setThroughput] = useState<{ t: number; v: number }[]>(
    Array.from({ length: 24 }, (_, i) => ({ t: i, v: 600 + Math.round(Math.random() * 180) }))
  );
  const [chillTemp, setChillTemp] = useState(1.8);
  const [flashOrder, setFlashOrder] = useState<string | null>(null);
  const tickRef = useRef(0);

  useEffect(() => {
    const clockId = setInterval(() => setNow(new Date()), 1000);
    const dataId = setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;

      // throughput chart: slide in new point
      setThroughput((prev) => {
        const next = prev.slice(1);
        next.push({ t: prev[prev.length - 1].t + 1, v: 620 + Math.round(Math.random() * 180) });
        return next;
      });

      // chill temperature oscillates while "adjusting"
      setChillTemp((t) => {
        const target = 0.5;
        const delta = (Math.random() - 0.45) * 0.3;
        const next = Math.max(0.3, Math.min(3.0, t + delta - (t - target) * 0.08));
        return Number(next.toFixed(2));
      });

      // live metrics per step
      setSteps((prev) =>
        prev.map((s) => {
          if (s.status === "pending") return s;
          if (s.k === "6") return { ...s, baseMetric: 2080 + Math.round(Math.random() * 60) };
          if (s.k === "7") return { ...s, baseMetric: Number((108 + Math.random() * 4).toFixed(1)) };
          if (s.k === "3") return { ...s, baseMetric: Number((61 + Math.random() * 2).toFixed(1)) };
          if (s.k === "4") return { ...s, baseMetric: 700 + Math.round(Math.random() * 40) };
          if (s.k === "5") return { ...s, baseMetric: Number((99.2 + Math.random() * 0.6).toFixed(2)) };
          return s;
        })
      );

      // order progress ticks
      setOrders((prev) => {
        const next = prev.map((o) => {
          if (o.progress >= 100) return o;
          const inc = 1 + Math.round(Math.random() * 3);
          return { ...o, progress: Math.min(100, o.progress + inc) };
        });
        // flash the order that just completed
        const completed = next.find((o, i) => prev[i].progress < 100 && o.progress === 100);
        if (completed) setFlashOrder(completed.id);
        return next;
      });

      // ETA countdown for pig batches
      setBatches((prev) => prev.map((b) => ({ ...b, eta: Math.max(0, b.eta - 1) })));

      // top stats pulse
      if (tick % 5 === 0) {
        setStats((prev) =>
          prev.map((s, i) => {
            const delta = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
            const newV = Math.max(0, s.v + delta);
            const newTrend = [...s.trend.slice(1), newV];
            return { ...s, v: newV, trend: newTrend };
          })
        );
      }
    }, 1500);

    return () => {
      clearInterval(clockId);
      clearInterval(dataId);
    };
  }, []);

  useEffect(() => {
    if (!flashOrder) return;
    const id = setTimeout(() => setFlashOrder(null), 1400);
    return () => clearTimeout(id);
  }, [flashOrder]);

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes moveDash { to { stroke-dashoffset: -24; } }
        @keyframes slideStripes { from { background-position: 0 0 } to { background-position: 24px 0 } }
        @keyframes flash { 0%,100%{background:#ffffff} 50%{background:#ecfdf5} }
        .stripe-bar { background-image: linear-gradient(45deg, rgba(255,255,255,0.35) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.35) 75%, transparent 75%, transparent); background-size: 24px 24px; animation: slideStripes 1s linear infinite; }
        .flash-row { animation: flash 1.4s ease-in-out 1; }
        .conveyor { stroke-dasharray: 6 6; animation: moveDash 1.2s linear infinite; }
      `}</style>

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">生产总览 · 肉食品加工厂</h1>
          <p className="text-slate-400 text-sm mt-1">个体 → 胴体 → 肉块 全链路追溯 · 实时冷链与设备监控</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded" style={{ background: "#ecfeff", color: "#0891b2" }}>
            <LiveDot color="#06b6d4" />
            实时在线
          </span>
          <span className="flex items-center gap-1"><Snowflake size={12} className="text-cyan-500" />冷链在线</span>
          <span>·</span>
          <span className="text-slate-600 tabular-nums">{formatClock(now)}</span>
        </div>
      </div>

      {/* Top Stats with mini trend */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => {
          const data = s.trend.map((v, i) => ({ i, v }));
          return (
            <div key={s.k} className="rounded-lg p-5 relative overflow-hidden" style={cardBg}>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-md flex items-center justify-center relative" style={{ background: s.bg, color: s.c }}>
                  <s.icon size={22} />
                  <span className="absolute top-0 right-0 translate-x-1 -translate-y-1">
                    <LiveDot color={s.c} />
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-slate-400 text-sm flex items-center justify-between">
                    <span>{s.k}</span>
                    <span className="text-xs flex items-center gap-0.5" style={{ color: s.c }}>
                      <TrendingUp size={10} />
                      {s.delta}
                    </span>
                  </div>
                  <div className="text-3xl mt-1 tabular-nums" style={{ color: s.c }}>{s.v}</div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-10 opacity-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                    <defs>
                      <linearGradient id={`g-${s.k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={s.c} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={s.c} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={s.c} strokeWidth={1.5} fill={`url(#g-${s.k})`} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* Throughput strip */}
      <div className="rounded-lg p-4 flex items-center gap-5" style={cardBg}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: "rgba(6,182,212,0.12)", color: "#06b6d4" }}>
            <Gauge size={18} />
          </div>
          <div>
            <div className="text-slate-400 text-xs">节拍 · 头/h</div>
            <div className="text-slate-900 text-xl tabular-nums">{throughput[throughput.length - 1].v}</div>
          </div>
        </div>
        <div className="flex-1" style={{ height: 54 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={throughput}>
              <defs>
                <linearGradient id="thru" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12 }} labelFormatter={() => ""} />
              <Area type="monotone" dataKey="v" stroke="#06b6d4" strokeWidth={2} fill="url(#thru)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded" style={{ background: "#f0fdf4", color: "#059669" }}>
          <Zap size={14} />
          <span className="text-xs">设备稼动率 <span className="tabular-nums">92.{((tickRef.current % 9) + 1)}%</span></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded" style={{ background: "#fffbeb", color: "#d97706" }}>
          <Thermometer size={14} />
          <span className="text-xs">排酸库 A-05 <span className="tabular-nums">{chillTemp.toFixed(2)}°C</span></span>
        </div>
      </div>

      <div className="grid grid-cols-[380px_1fr] gap-4">
        {/* Left cards */}
        <div className="space-y-4">
          {/* 待处理活猪 */}
          <div className="rounded-lg p-4" style={cardBg}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>
                  <Truck size={14} />
                </div>
                <span className="text-slate-900 text-sm">待处理活猪</span>
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1"><LiveDot color="#3b82f6" />{batches.length} 批次</span>
            </div>
            <div className="space-y-2">
              {batches.map((p) => (
                <div key={p.id} className="p-2.5 rounded" style={{ background: "#f8fafc", borderLeft: "2px solid #3b82f6" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-800 text-sm">{p.id}</span>
                    <span className="text-xs text-blue-600 tabular-nums">预计 {p.eta} 分钟</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>{p.src}</span>
                    <span className="text-slate-300">·</span>
                    <span>{p.head} 头</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-blue-600">{p.weight}</span>
                  </div>
                  <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: "#e5e7eb" }}>
                    <div
                      className="h-full stripe-bar"
                      style={{
                        width: `${Math.max(5, 100 - p.eta)}%`,
                        background: "linear-gradient(90deg,#3b82f6,#60a5fa)",
                        transition: "width 600ms linear",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 生产订单 */}
          <div className="rounded-lg p-4" style={cardBg}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                  <Beef size={14} />
                </div>
                <span className="text-slate-900 text-sm">生产订单 · 胴体</span>
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1"><LiveDot color="#10b981" />{orders.length} 单</span>
            </div>
            <div className="space-y-2">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className={`p-2.5 rounded ${flashOrder === o.id ? "flash-row" : ""}`}
                  style={{ background: "#f8fafc", borderLeft: "2px solid #10b981" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-800 text-sm">{o.id}</span>
                    <span className={`text-xs ${o.progress < 100 ? "text-emerald-500" : "text-emerald-600"}`}>
                      {o.stage}{o.progress < 100 && <span className="ml-1 tabular-nums">{o.progress}%</span>}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>背膘 <span className="text-slate-700">{o.back}</span></span>
                    <span className="text-slate-300">·</span>
                    <span>瘦肉率 <span className="text-slate-700">{o.lean}</span></span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <span>来源</span>
                    <span className="text-slate-500">{o.pig}</span>
                    <ChevronRight size={10} />
                  </div>
                  <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: "#e5e7eb" }}>
                    <div
                      className={`h-full ${o.progress < 100 ? "stripe-bar" : ""}`}
                      style={{
                        width: `${o.progress}%`,
                        background: o.progress < 100 ? "linear-gradient(90deg,#10b981,#34d399)" : "#10b981",
                        transition: "width 800ms ease-out",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 完工入库 */}
          <div className="rounded-lg p-4" style={cardBg}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>
                  <PackageCheck size={14} />
                </div>
                <span className="text-slate-900 text-sm">完工入库 · 成品</span>
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1"><LiveDot color="#a78bfa" />{finished.length} 批</span>
            </div>
            <div className="space-y-2">
              {finished.map((f) => (
                <div key={f.spec} className="p-2.5 rounded" style={{ background: "#f8fafc", borderLeft: "2px solid #a78bfa" }}>
                  <div className="text-slate-800 text-sm">{f.spec}</div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>净重 <span className="text-purple-500">{f.net}</span></span>
                    <span className="text-slate-300">·</span>
                    <span>{f.loc}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">溯源 {f.from}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 预警 */}
          <div className="rounded-lg p-4" style={cardBg}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded flex items-center justify-center animate-pulse" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                  <AlertTriangle size={14} />
                </div>
                <span className="text-slate-900 text-sm">冷链预警</span>
              </div>
              <span className="text-xs text-amber-500 flex items-center gap-1"><LiveDot color="#f59e0b" />2 条</span>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded cursor-pointer hover:shadow-sm transition-shadow" style={{ background: "#fffbeb", borderLeft: "2px solid #f59e0b" }}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-800 text-sm flex items-center gap-1.5">
                    <Thermometer size={13} className="text-amber-500" />
                    排酸库 A-05 温度偏高
                  </span>
                  <span className="text-xs text-amber-600 tabular-nums">+{(chillTemp - 0.5).toFixed(2)}°C</span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>当前 <span className="text-amber-600 tabular-nums">{chillTemp.toFixed(2)}°C</span></span>
                  <span className="text-slate-300">·</span>
                  <span>标准 0.5°C</span>
                </div>
                <div className="text-[11px] mt-1.5 text-cyan-600 flex items-center gap-1">
                  触发温控调优 <ChevronRight size={10} />
                </div>
              </div>
              <div className="p-3 rounded cursor-pointer hover:shadow-sm transition-shadow" style={{ background: "#fffbeb", borderLeft: "2px solid #f59e0b" }}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-800 text-sm flex items-center gap-1.5">
                    <Thermometer size={13} className="text-amber-500" />
                    成品冷库 C-02 湿度偏低
                  </span>
                  <span className="text-xs text-amber-600">-5%RH</span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>当前 <span className="text-amber-600">80%RH</span></span>
                  <span className="text-slate-300">·</span>
                  <span>标准 85%RH</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right process */}
        <div className="rounded-lg p-5" style={cardBg}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-slate-900">数字化屠宰与排酸流程</div>
              <div className="text-xs text-slate-400 mt-1">11 道工序 · 实时设备与工艺参数</div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-500"><span className="w-2 h-2 rounded-full bg-emerald-500" />已完成</span>
              <span className="flex items-center gap-1 text-cyan-500"><LiveDot color="#06b6d4" />运行中</span>
              <span className="flex items-center gap-1 text-amber-500"><LiveDot color="#f59e0b" />温控</span>
              <span className="flex items-center gap-1 text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-400" />待机</span>
            </div>
          </div>

          <div className="relative">
            {steps.map((p, i) => {
              const color =
                p.status === "done" ? "#10b981"
                : p.status === "running" ? "#06b6d4"
                : p.status === "warn" ? "#f59e0b"
                : "#94a3b8";
              const live = p.status === "running" || p.status === "warn";
              const metricValue = p.k === "8" ? chillTemp.toFixed(2) : p.baseMetric;
              return (
                <div key={p.k} className="flex gap-4 relative">
                  <div className="flex flex-col items-center" style={{ width: 36 }}>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 z-10"
                      style={{
                        background: color,
                        boxShadow: live ? `0 0 0 4px ${color}22, 0 0 12px ${color}55` : "none",
                      }}
                    >
                      {p.k}
                    </div>
                    {i < steps.length - 1 && (
                      <svg width="2" height="100%" style={{ minHeight: 32, flex: 1 }} className="my-1">
                        <line
                          x1="1" y1="0" x2="1" y2="100%"
                          stroke={p.status === "done" ? "#10b981" : live ? color : "#e5e7eb"}
                          strokeWidth="2"
                          className={live ? "conveyor" : ""}
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div
                      className="rounded-md p-3 relative overflow-hidden"
                      style={{
                        background: p.status === "warn" ? "#fffbeb" : p.status === "running" ? "#ecfeff" : "#f8fafc",
                        border: `1px solid ${p.status === "warn" ? "#fde68a" : p.status === "running" ? "#a5f3fc" : "#e5e7eb"}`,
                      }}
                    >
                      {live && (
                        <div
                          className="absolute top-0 left-0 h-0.5 stripe-bar"
                          style={{ width: "100%", background: `linear-gradient(90deg, ${color}, ${color}77)` }}
                        />
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-900 text-sm flex items-center gap-2">
                          {live && <LiveDot color={color} />}
                          {p.t}
                        </span>
                        <StatusPill s={p.status} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                        <div>
                          <div className="text-slate-400">设备 / 线体</div>
                          <div className="text-slate-700 mt-0.5">{p.sub}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">状态</div>
                          <div className="text-slate-700 mt-0.5">{p.dev}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">{p.metricLabel}</div>
                          <div className="mt-0.5 tabular-nums" style={{ color }}>
                            {p.status === "pending" ? "—" : `${metricValue} ${p.unit}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
