import {
  Database,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Zap,
  Server,
  Link2,
  ArrowRight,
  Cpu,
  Thermometer,
  Truck,
  Scissors,
  ShieldCheck,
  Snowflake,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

const cardBg = { background: "#ffffff", border: "1px solid #e5e7eb" };

const runStats = [
  { label: "数据源", value: 5, sub: "接入中 4 · 离线 1", icon: Database, c: "#06b6d4" },
  { label: "接入任务", value: 3, sub: "实时 2 · 批量 1", icon: Activity, c: "#60a5fa" },
  { label: "实时接入", value: 7, sub: "MQTT / Kafka / OPC", icon: Zap, c: "#10b981" },
  { label: "待同步任务", value: 2, sub: "排队中", icon: Clock, c: "#f59e0b" },
];

const kpiCards = [
  { label: "24小时成功率", value: "100.0%", delta: "+0.2%", c: "#10b981" },
  { label: "接入成功率", value: "99.0%", delta: "+0.4%", c: "#06b6d4" },
  { label: "今日 SLA", value: "100.0%", delta: "稳定", c: "#a78bfa" },
  { label: "接入总量", value: "8.7万", delta: "+3.1K", c: "#f59e0b" },
];

const trendHours = Array.from({ length: 24 }, (_, i) => ({
  h: `${String(i).padStart(2, "0")}:00`,
  成功: 800 + Math.round(Math.random() * 1400),
  失败: Math.round(Math.random() * 60),
}));

const sources = [
  { name: "活猪地磅 / RFID 系统", type: "OPC UA", icon: Truck, status: "online", records: "12,480", rate: "48 /s", c: "#3b82f6" },
  { name: "屠宰产线 MES (SL-05/VS-01)", type: "Kafka", icon: Scissors, status: "online", records: "68,441", rate: "156 /s", c: "#10b981" },
  { name: "卫检视觉检测系统", type: "MQTT", icon: ShieldCheck, status: "online", records: "125,830", rate: "284 /s", c: "#06b6d4" },
  { name: "排酸/成品冷库温控", type: "Modbus TCP", icon: Thermometer, status: "online", records: "42,119", rate: "96 /s", c: "#60a5fa" },
  { name: "冷链物流 GPS / 温度回传", type: "API", icon: Snowflake, status: "warning", records: "8,230", rate: "18 /s", c: "#f59e0b" },
  { name: "ERP · WMS 成品入库", type: "MySQL CDC", icon: Database, status: "offline", records: "—", rate: "—", c: "#94a3b8" },
];

const keyTasks = [
  { name: "pig_weighbridge_to_ods_livestock", source: "活猪地磅", target: "ODS · 活体", state: "running" },
  { name: "slaughter_mes_to_ods_carcass", source: "屠宰 MES", target: "ODS · 胴体", state: "running" },
  { name: "vision_qc_to_ods_inspection", source: "卫检视觉", target: "ODS · 卫检", state: "running" },
  { name: "cold_chain_temp_to_ods_iot", source: "排酸库 PLC", target: "ODS · 冷链", state: "running" },
  { name: "wms_cutting_to_ods_product", source: "分割包装 WMS", target: "ODS · 成品", state: "queued" },
];

const distribution = [
  { name: "养殖场", val: 28, c: "#60a5fa" },
  { name: "屠宰车间", val: 42, c: "#06b6d4" },
  { name: "排酸/冷链", val: 18, c: "#10b981" },
  { name: "分割包装", val: 8, c: "#a78bfa" },
  { name: "物流 WMS", val: 4, c: "#f59e0b" },
];

const keyMetrics = [
  { label: "同步延迟", value: 0, unit: "", sub: "平均延时 (s)", c: "#10b981" },
  { label: "日均处理量", value: 0, unit: "万条", sub: "近 7 日", c: "#06b6d4" },
  { label: "离线次数", value: 0, unit: "", sub: "本月累计", c: "#f59e0b" },
  { label: "平均吞吐", value: 3604, unit: "/s", sub: "条/秒", c: "#60a5fa" },
  { label: "周吞吐量", value: 0.0, unit: "亿", sub: "条", c: "#a78bfa" },
];

function Ring({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="relative" style={{ width: 130, height: 130 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="78%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          data={[{ v: pct, fill: color }]}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: "#f1f5f9" }} dataKey="v" cornerRadius={10} fill={color} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl tabular-nums" style={{ color }}>{pct}%</div>
        <div className="text-xs text-slate-400 mt-0.5">运行正常</div>
      </div>
    </div>
  );
}

export function DataIngestion() {
  const [now, setNow] = useState(new Date());
  const [live, setLive] = useState({
    throughput: 3604,
    latency: 28,
    daily: 87.2,
    weekly: 6.1,
    offline: 2,
  });

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    const d = setInterval(() => {
      setLive((p) => ({
        throughput: Math.max(2800, Math.min(4600, p.throughput + Math.round((Math.random() - 0.5) * 120))),
        latency: Math.max(8, Math.min(120, p.latency + Math.round((Math.random() - 0.5) * 10))),
        daily: Number((p.daily + (Math.random() - 0.4) * 0.2).toFixed(1)),
        weekly: Number((p.weekly + (Math.random() - 0.4) * 0.02).toFixed(2)),
        offline: p.offline,
      }));
    }, 1500);
    return () => {
      clearInterval(t);
      clearInterval(d);
    };
  }, []);

  const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">接入概览</h1>
          <p className="text-slate-400 text-sm mt-1">
            生猪屠宰与肉食品加工全链路数据接入 · 养殖 → 屠宰 → 冷链 → 分割 → 物流
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 tabular-nums">更新于 {ts}</span>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-cyan-600"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)" }}
          >
            <RefreshCw size={14} />
            刷新
          </button>
        </div>
      </div>

      {/* Row 1: run stats + kpi cards */}
      <div className="grid grid-cols-[1.3fr_1fr] gap-4">
        <div className="rounded-lg p-5" style={cardBg}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-900 text-sm">运行数量</div>
            <div className="text-xs text-slate-400 tabular-nums">{now.toLocaleDateString()} · {ts}</div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {runStats.map((s) => (
              <div key={s.label} className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: `${s.c}1A`, color: s.c }}
                >
                  <s.icon size={18} />
                </div>
                <div>
                  <div className="text-xs text-slate-400">{s.label}</div>
                  <div className="text-2xl tabular-nums" style={{ color: s.c }}>{s.value}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {kpiCards.map((k) => (
            <div key={k.label} className="rounded-lg p-3 flex flex-col justify-between" style={cardBg}>
              <div className="text-[11px] text-slate-400">{k.label}</div>
              <div>
                <div className="text-xl mt-2 tabular-nums" style={{ color: k.c }}>{k.value}</div>
                <div className="text-[10px] mt-1" style={{ color: k.c }}>{k.delta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: trend ring + bar chart + sources list */}
      <div className="grid grid-cols-[220px_1fr_320px] gap-4">
        <div className="rounded-lg p-5 flex flex-col items-center justify-center" style={cardBg}>
          <div className="text-slate-900 text-sm self-start mb-2">运行状态</div>
          <Ring pct={99} color="#10b981" />
          <div className="mt-3 text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            实时心跳正常
          </div>
        </div>

        <div className="rounded-lg p-5" style={cardBg}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-900 text-sm">运行趋势 · 24h</div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500" />成功</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />失败</span>
              <span className="text-cyan-600 cursor-pointer">近 24小时 ▾</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="h" stroke="#94a3b8" fontSize={10} interval={2} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8 }} />
              <Bar dataKey="成功" stackId="a" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="失败" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg p-4" style={cardBg}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-900 text-sm">接入链路</div>
            <span className="text-xs text-slate-400">生产车间直连</span>
          </div>
          <div className="space-y-2 max-h-[240px] overflow-auto pr-1">
            {sources.map((s) => {
              const cfg =
                s.status === "online"
                  ? { c: "#10b981", t: "在线" }
                  : s.status === "warning"
                  ? { c: "#f59e0b", t: "延迟" }
                  : { c: "#94a3b8", t: "离线" };
              return (
                <div key={s.name} className="p-2.5 rounded flex items-center gap-2" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                    style={{ background: `${s.c}1A`, color: s.c }}
                  >
                    <s.icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-800 text-xs truncate">{s.name}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span>{s.type}</span>
                      <span className="text-slate-300">·</span>
                      <span>{s.rate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: cfg.c }}>
                    {s.status === "online" && (
                      <span className="relative flex w-1.5 h-1.5">
                        <span className="absolute inset-0 rounded-full animate-ping opacity-70" style={{ background: cfg.c }} />
                        <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: cfg.c }} />
                      </span>
                    )}
                    {s.status !== "online" && <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.c }} />}
                    {cfg.t}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: key metrics + distribution + tasks */}
      <div className="grid grid-cols-[1fr_1.1fr_320px] gap-4">
        <div className="rounded-lg p-5" style={cardBg}>
          <div className="text-slate-900 text-sm mb-4">关键指标</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "同步延迟", value: live.latency, unit: "ms", sub: "平均延时", c: "#10b981", I: Clock },
              { label: "日均处理量", value: live.daily, unit: "万条", sub: "近 7 日", c: "#06b6d4", I: Database },
              { label: "离线次数", value: live.offline, unit: "", sub: "本月累计", c: "#f59e0b", I: AlertTriangle },
              { label: "平均吞吐", value: live.throughput.toLocaleString(), unit: "/s", sub: "条/秒", c: "#60a5fa", I: Zap },
            ].map((m) => (
              <div key={m.label} className="p-3 rounded" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{m.label}</span>
                  <m.I size={12} style={{ color: m.c }} />
                </div>
                <div className="text-2xl mt-1 tabular-nums" style={{ color: m.c }}>
                  {m.value}
                  {m.unit && <span className="text-xs ml-1 text-slate-400">{m.unit}</span>}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{m.sub}</div>
              </div>
            ))}
            <div className="p-3 rounded col-span-2 flex items-center justify-between" style={{ background: "linear-gradient(90deg,#ecfeff,#ffffff)", border: "1px solid #a5f3fc" }}>
              <div>
                <div className="text-xs text-slate-400">周吞吐量</div>
                <div className="text-2xl tabular-nums text-cyan-600 mt-0.5">
                  {live.weekly.toFixed(2)}
                  <span className="text-xs ml-1 text-slate-400">亿条</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <Cpu size={12} />
                <span>负载 68%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-5" style={cardBg}>
          <div className="text-slate-900 text-sm mb-4">来源与同步分布</div>
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">来源环节</div>
              <div className="text-3xl tabular-nums text-slate-800">5<span className="text-xs text-slate-400 ml-1">个环节</span></div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">同步链路</div>
              <div className="text-3xl tabular-nums text-slate-800">5<span className="text-xs text-slate-400 ml-1">条</span></div>
            </div>
          </div>
          <div className="space-y-2.5">
            {distribution.map((d) => (
              <div key={d.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-700">{d.name}</span>
                  <span className="text-slate-400 tabular-nums">{d.val}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: "#f1f5f9" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${d.val}%`,
                      background: `linear-gradient(90deg, ${d.c}, ${d.c}99)`,
                      transition: "width 800ms ease-out",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-4" style={cardBg}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-900 text-sm">重点任务</div>
            <span className="text-xs text-cyan-600 cursor-pointer">查看全部 →</span>
          </div>
          <div className="space-y-2">
            {keyTasks.map((t) => {
              const st = t.state === "running"
                ? { c: "#10b981", t: "运行中" }
                : { c: "#f59e0b", t: "排队中" };
              return (
                <div key={t.name} className="p-2.5 rounded" style={{ background: "#f8fafc", borderLeft: `2px solid ${st.c}` }}>
                  <div className="flex items-center justify-between">
                    <div className="text-slate-800 text-xs truncate flex items-center gap-1.5" style={{ maxWidth: 190 }}>
                      <Link2 size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{t.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded tabular-nums" style={{ background: `${st.c}1A`, color: st.c }}>
                      {st.t}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <Server size={10} />
                    {t.source}
                    <ArrowRight size={10} className="text-slate-300" />
                    {t.target}
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
