import { Database, Plus, CheckCircle2, AlertCircle, Settings } from "lucide-react";

const cardBg = { background: "#ffffff", border: "1px solid #e5e7eb" };

const sources = [
  { name: "mes_slaughter_prod", type: "MySQL 8.0", host: "10.32.5.12:3306", owner: "屠宰车间 MES", tables: 48, status: "ok", ping: "8ms" },
  { name: "wms_cold_chain", type: "PostgreSQL 14", host: "10.32.5.18:5432", owner: "冷链 WMS", tables: 36, status: "ok", ping: "12ms" },
  { name: "iot_chilling_room", type: "InfluxDB 2.7", host: "10.32.6.22:8086", owner: "排酸库物联网", tables: 12, status: "ok", ping: "6ms" },
  { name: "vision_inspection", type: "Kafka", host: "10.32.6.30:9092", owner: "卫检视觉检测", tables: 8, status: "ok", ping: "4ms" },
  { name: "erp_finance", type: "Oracle 19c", host: "10.32.4.8:1521", owner: "财务 ERP", tables: 142, status: "warn", ping: "318ms" },
  { name: "farm_environment", type: "MQTT", host: "10.32.7.15:1883", owner: "养殖场环境", tables: 6, status: "ok", ping: "22ms" },
  { name: "logistics_gps", type: "REST API", host: "api.logistics.muyuan", owner: "冷链物流", tables: 4, status: "err", ping: "超时" },
  { name: "quality_lab", type: "SQL Server 2022", host: "10.32.5.25:1433", owner: "质检实验室 LIMS", tables: 28, status: "ok", ping: "18ms" },
];

export function LabDataSource() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">数据源管理</h1>
          <p className="text-slate-400 text-sm mt-1">屠宰 · 冷链 · 养殖 · ERP 全域数据源统一接入与连接管理</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white" style={{ background: "linear-gradient(135deg,#06b6d4,#0ea5e9)" }}>
          <Plus size={14} /> 新建数据源
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { l: "数据源总数", v: sources.length, c: "#06b6d4" },
          { l: "正常连接", v: sources.filter(s => s.status === "ok").length, c: "#10b981" },
          { l: "告警 / 异常", v: sources.filter(s => s.status !== "ok").length, c: "#f59e0b" },
          { l: "纳管表总数", v: sources.reduce((s, x) => s + x.tables, 0), c: "#60a5fa" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg p-5" style={cardBg}>
            <div className="text-slate-400 text-sm">{s.l}</div>
            <div className="text-3xl mt-2 tabular-nums" style={{ color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg p-5" style={cardBg}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs border-b border-slate-200">
              <th className="text-left py-2.5">数据源</th>
              <th className="text-left py-2.5">类型</th>
              <th className="text-left py-2.5">地址</th>
              <th className="text-left py-2.5">归属业务</th>
              <th className="text-left py-2.5">表数</th>
              <th className="text-left py-2.5">连通性</th>
              <th className="text-left py-2.5">操作</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.name} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 text-slate-800 flex items-center gap-2">
                  <Database size={14} className="text-cyan-500" />
                  {s.name}
                </td>
                <td className="text-slate-600">{s.type}</td>
                <td className="text-slate-500 text-xs font-mono">{s.host}</td>
                <td className="text-slate-600">{s.owner}</td>
                <td className="text-slate-600 tabular-nums">{s.tables}</td>
                <td>
                  {s.status === "ok" && <span className="text-xs flex items-center gap-1 text-emerald-500"><CheckCircle2 size={12} />{s.ping}</span>}
                  {s.status === "warn" && <span className="text-xs flex items-center gap-1 text-amber-500"><AlertCircle size={12} />慢 {s.ping}</span>}
                  {s.status === "err" && <span className="text-xs flex items-center gap-1 text-rose-500"><AlertCircle size={12} />{s.ping}</span>}
                </td>
                <td>
                  <button className="text-xs text-cyan-600 flex items-center gap-1"><Settings size={11} />配置</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
