import { Monitor, Activity, AlertTriangle, CheckCircle2, Clock, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

const cardBg = { background: "#ffffff", border: "1px solid #e5e7eb" };

const instances = [
  { id: "inst-2026042010050", dag: "dag_slaughter_cold_chain_etl", start: "10:00:18", dur: "6m 42s", status: "running", progress: 62, records: "2.1M" },
  { id: "inst-2026042010051", dag: "dag_daily_yield_mart", start: "10:02:05", dur: "4m 11s", status: "running", progress: 38, records: "840K" },
  { id: "inst-2026042010049", dag: "dag_vision_quality_agg", start: "10:00:02", dur: "12m 18s", status: "success", progress: 100, records: "4.8M" },
  { id: "inst-2026042010048", dag: "dag_cold_chain_breach_scan", start: "09:55:40", dur: "2m 08s", status: "success", progress: 100, records: "126K" },
  { id: "inst-2026042010047", dag: "dag_feed_cost_allocation", start: "09:50:12", dur: "18m 56s", status: "warn", progress: 100, records: "1.2M" },
  { id: "inst-2026042010046", dag: "dag_env_sensor_outlier", start: "09:45:00", dur: "3m 22s", status: "success", progress: 100, records: "312K" },
  { id: "inst-2026042010045", dag: "dag_carcass_lineage_build", start: "09:40:35", dur: "8m 04s", status: "failed", progress: 78, records: "-" },
];

export function LabMonitor() {
  const [cpu, setCpu] = useState(() => Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 50 + Math.random() * 30, mem: 60 + Math.random() * 20 })));

  useEffect(() => {
    const id = setInterval(() => {
      setCpu((prev) => {
        const n = prev.slice(1);
        const last = prev[prev.length - 1];
        n.push({
          t: last.t + 1,
          cpu: Math.max(20, Math.min(95, last.cpu + (Math.random() - 0.5) * 12)),
          mem: Math.max(40, Math.min(92, last.mem + (Math.random() - 0.5) * 8)),
        });
        return n;
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">实例监控</h1>
          <p className="text-slate-400 text-sm mt-1">ETL / AI 作业实例实时运行监控</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          自动刷新 1.5s
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {[
          { l: "运行中实例", v: 12, c: "#06b6d4", I: Activity },
          { l: "今日已完成", v: 328, c: "#10b981", I: CheckCircle2 },
          { l: "告警 / 失败", v: 3, c: "#f59e0b", I: AlertTriangle },
          { l: "平均耗时", v: "8m 42s", c: "#60a5fa", I: Clock },
          { l: "集群负载", v: `${Math.round(cpu[cpu.length - 1].cpu)}%`, c: "#a78bfa", I: Cpu },
        ].map((s) => (
          <div key={s.l} className="rounded-lg p-4" style={cardBg}>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">{s.l}</span>
              <s.I size={14} style={{ color: s.c }} />
            </div>
            <div className="text-2xl mt-2 tabular-nums" style={{ color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg p-5" style={cardBg}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-slate-900">集群资源使用</div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500" />CPU</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" />内存</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={cpu}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="t" stroke="#94a3b8" fontSize={10} />
            <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8 }} />
            <Line type="monotone" dataKey="cpu" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="mem" stroke="#a78bfa" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg p-5" style={cardBg}>
        <div className="text-slate-900 mb-4">实例列表</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs border-b border-slate-200">
              <th className="text-left py-2">实例 ID</th>
              <th className="text-left py-2">DAG</th>
              <th className="text-left py-2">开始时间</th>
              <th className="text-left py-2">耗时</th>
              <th className="text-left py-2">记录数</th>
              <th className="text-left py-2">进度</th>
              <th className="text-left py-2">状态</th>
            </tr>
          </thead>
          <tbody>
            {instances.map((i) => {
              const cfg =
                i.status === "running" ? { c: "#06b6d4", t: "运行中" }
                : i.status === "success" ? { c: "#10b981", t: "成功" }
                : i.status === "warn" ? { c: "#f59e0b", t: "告警" }
                : { c: "#ef4444", t: "失败" };
              return (
                <tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 text-slate-600 font-mono text-xs">{i.id}</td>
                  <td className="text-slate-800 font-mono text-xs">{i.dag}</td>
                  <td className="text-slate-500 tabular-nums">{i.start}</td>
                  <td className="text-slate-500 tabular-nums">{i.dur}</td>
                  <td className="text-slate-500 tabular-nums">{i.records}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 rounded-full w-24" style={{ background: "#f1f5f9" }}>
                        <div className="h-full rounded-full" style={{ width: `${i.progress}%`, background: cfg.c, transition: "width 600ms ease" }} />
                      </div>
                      <span className="text-xs tabular-nums text-slate-500">{i.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${cfg.c}1A`, color: cfg.c }}>{cfg.t}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
