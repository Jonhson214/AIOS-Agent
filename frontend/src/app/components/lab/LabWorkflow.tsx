import { GitBranch, Play, Clock, CheckCircle2, Circle, AlertCircle } from "lucide-react";

const cardBg = { background: "#ffffff", border: "1px solid #e5e7eb" };

type Node = { id: string; x: number; y: number; label: string; type: string; status: "done" | "running" | "pending" | "warn" };

const nodes: Node[] = [
  { id: "s", x: 60, y: 180, label: "活猪批次抽取", type: "Source · MySQL", status: "done" },
  { id: "a", x: 220, y: 80, label: "屠宰 MES 事件", type: "Kafka", status: "done" },
  { id: "b", x: 220, y: 180, label: "卫检视觉结果", type: "MQTT", status: "done" },
  { id: "c", x: 220, y: 280, label: "冷链 PLC 数据", type: "Modbus", status: "done" },
  { id: "j", x: 400, y: 180, label: "批次血缘关联", type: "Join", status: "running" },
  { id: "q", x: 580, y: 100, label: "出肉率计算", type: "PySpark", status: "running" },
  { id: "t", x: 580, y: 260, label: "冷链异常检测", type: "Python", status: "pending" },
  { id: "w", x: 760, y: 140, label: "写入 DWS", type: "Sink · Hive", status: "pending" },
  { id: "n", x: 760, y: 260, label: "告警推送", type: "Webhook", status: "pending" },
];

const edges = [
  ["s", "j"], ["a", "j"], ["b", "j"], ["c", "j"],
  ["j", "q"], ["j", "t"],
  ["q", "w"], ["t", "w"], ["t", "n"],
];

const runs = [
  { id: "202604200800", start: "08:00:00", dur: "12m 18s", status: "success" },
  { id: "202604200700", start: "07:00:00", dur: "11m 42s", status: "success" },
  { id: "202604200600", start: "06:00:00", dur: "12m 04s", status: "success" },
  { id: "202604200500", start: "05:00:00", dur: "18m 22s", status: "warn" },
  { id: "202604200400", start: "04:00:00", dur: "12m 01s", status: "success" },
];

function statusColor(s: string) {
  return s === "done" ? "#10b981" : s === "running" ? "#06b6d4" : s === "warn" ? "#f59e0b" : "#94a3b8";
}

export function LabWorkflow() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">工作流编排</h1>
          <p className="text-slate-400 text-sm mt-1">DAG 工作流 · 屠宰 / 冷链 / 分割 数据流水线</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-1.5 rounded-md text-sm border border-slate-200 outline-none bg-white text-slate-700">
            <option>dag_slaughter_cold_chain_etl</option>
            <option>dag_daily_yield_mart</option>
            <option>dag_vision_quality_agg</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm text-white" style={{ background: "linear-gradient(135deg,#06b6d4,#0ea5e9)" }}>
            <Play size={14} /> 立即运行
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        <div className="rounded-lg p-5 relative" style={cardBg}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-900">dag_slaughter_cold_chain_etl</div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-emerald-500" />已完成</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />运行中</span>
              <span className="flex items-center gap-1"><Circle size={11} className="text-slate-400" />待执行</span>
            </div>
          </div>
          <style>{`@keyframes flow { to { stroke-dashoffset: -20; } } .edge-run { stroke-dasharray: 6 4; animation: flow 1.2s linear infinite; }`}</style>
          <svg viewBox="0 0 860 380" className="w-full" style={{ background: "#f8fafc", borderRadius: 8 }}>
            {edges.map(([a, b]) => {
              const na = nodes.find((n) => n.id === a)!;
              const nb = nodes.find((n) => n.id === b)!;
              const animate = nb.status === "running" || na.status === "running";
              return (
                <line
                  key={`${a}-${b}`}
                  x1={na.x + 60} y1={na.y}
                  x2={nb.x - 60} y2={nb.y}
                  stroke={animate ? "#06b6d4" : "#cbd5e1"}
                  strokeWidth="2"
                  className={animate ? "edge-run" : ""}
                />
              );
            })}
            {nodes.map((n) => {
              const c = statusColor(n.status);
              return (
                <g key={n.id}>
                  <rect
                    x={n.x - 60} y={n.y - 26}
                    width="120" height="52" rx="8"
                    fill="#ffffff"
                    stroke={c}
                    strokeWidth="1.5"
                    style={{ filter: n.status === "running" ? `drop-shadow(0 0 6px ${c})` : "none" }}
                  />
                  <circle cx={n.x - 48} cy={n.y - 10} r="4" fill={c} />
                  <text x={n.x - 38} y={n.y - 6} fontSize="11" fill="#1e293b">{n.label}</text>
                  <text x={n.x - 38} y={n.y + 10} fontSize="9" fill="#94a3b8">{n.type}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="rounded-lg p-4" style={cardBg}>
          <div className="text-slate-900 text-sm mb-3">运行历史</div>
          <div className="space-y-2">
            {runs.map((r) => {
              const cfg = r.status === "success" ? { c: "#10b981", I: CheckCircle2, t: "成功" } : { c: "#f59e0b", I: AlertCircle, t: "告警" };
              return (
                <div key={r.id} className="p-3 rounded flex items-center gap-3" style={{ background: "#f8fafc", borderLeft: `2px solid ${cfg.c}` }}>
                  <cfg.I size={14} style={{ color: cfg.c }} />
                  <div className="flex-1">
                    <div className="text-slate-800 text-xs font-mono">{r.id}</div>
                    <div className="text-slate-400 text-[10px] flex items-center gap-2 mt-0.5">
                      <span>{r.start}</span>
                      <Clock size={9} />
                      <span>{r.dur}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${cfg.c}1A`, color: cfg.c }}>{cfg.t}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 space-y-1.5">
            <div className="flex justify-between"><span>调度周期</span><span className="text-slate-700">每小时 (0 * * * *)</span></div>
            <div className="flex justify-between"><span>下次运行</span><span className="text-cyan-600 tabular-nums">12:00:00</span></div>
            <div className="flex justify-between"><span>负责人</span><span className="text-slate-700">数据平台组</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
