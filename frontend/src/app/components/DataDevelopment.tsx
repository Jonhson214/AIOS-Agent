import { Play, Save, FolderOpen, FileCode, Database, Clock } from "lucide-react";

const cardBg = { background: "#ffffff", border: "1px solid #e5e7eb" };

const treeData = [
  { name: "my_workspace", type: "folder", children: [
    { name: "ods", type: "folder", children: [
      { name: "ods_device_hourly.sql", type: "sql" },
      { name: "ods_feed_stock.sql", type: "sql" },
    ]},
    { name: "dwd", type: "folder", children: [
      { name: "dwd_production.sql", type: "sql" },
      { name: "dwd_env_sensor.sql", type: "sql" },
    ]},
    { name: "ads_reports.py", type: "py" },
  ]},
];

function Tree({ nodes, depth = 0 }: { nodes: any[]; depth?: number }) {
  return (
    <div>
      {nodes.map((n) => (
        <div key={n.name}>
          <div
            className="flex items-center gap-2 py-1 px-2 rounded hover:bg-slate-50 cursor-pointer text-sm"
            style={{ paddingLeft: depth * 12 + 8 }}
          >
            {n.type === "folder" ? (
              <FolderOpen size={14} className="text-amber-400" />
            ) : (
              <FileCode size={14} className={n.type === "sql" ? "text-cyan-500" : "text-purple-400"} />
            )}
            <span className="text-slate-700">{n.name}</span>
          </div>
          {n.children && <Tree nodes={n.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}

const sqlCode = `-- 按小时聚合养殖场环境数据
SELECT
  farm_id,
  DATE_TRUNC('hour', ts) AS hour,
  AVG(temperature) AS avg_temp,
  AVG(humidity)    AS avg_humidity,
  MAX(co2)         AS max_co2,
  COUNT(*)         AS sample_cnt
FROM ods.ods_env_sensor
WHERE ts >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY farm_id, DATE_TRUNC('hour', ts)
ORDER BY hour DESC
LIMIT 100;`;

export function DataDevelopment() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">数据开发</h1>
          <p className="text-slate-400 text-sm mt-1">SQL / 脚本 / 工作流一体化开发环境</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-700" style={{ background: "#ffffff" }}>
            <Save size={14} /> 保存
          </button>
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-white"
            style={{ background: "linear-gradient(135deg,#06b6d4,#0ea5e9)" }}
          >
            <Play size={14} /> 运行
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[240px_1fr_280px] gap-4" style={{ height: "calc(100vh - 220px)" }}>
        <div className="rounded-lg p-3 overflow-auto" style={cardBg}>
          <div className="text-slate-400 text-xs mb-2 px-2">项目结构</div>
          <Tree nodes={treeData} />
        </div>

        <div className="rounded-lg flex flex-col overflow-hidden" style={cardBg}>
          <div className="flex items-center border-b border-slate-200">
            <div className="px-4 py-2 text-sm text-cyan-600 border-r border-slate-200" style={{ background: "#f8fafc" }}>
              ods_device_hourly.sql
            </div>
            <div className="px-4 py-2 text-sm text-slate-400 border-r border-slate-200">dwd_production.sql</div>
          </div>
          <pre
            className="flex-1 p-4 text-xs overflow-auto text-slate-700"
            style={{ background: "#f1f5f9", fontFamily: "ui-monospace, SFMono-Regular, monospace", lineHeight: 1.7 }}
          >
            <code>{sqlCode}</code>
          </pre>
          <div className="border-t border-slate-200 p-3">
            <div className="text-slate-400 text-xs mb-2 flex items-center gap-2">
              <Clock size={12} /> 运行结果 · 用时 218ms · 返回 100 行
            </div>
            <div className="rounded overflow-auto" style={{ background: "#f1f5f9", maxHeight: 140 }}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-200">
                    <th className="text-left p-2">farm_id</th>
                    <th className="text-left p-2">hour</th>
                    <th className="text-left p-2">avg_temp</th>
                    <th className="text-left p-2">avg_humidity</th>
                    <th className="text-left p-2">max_co2</th>
                    <th className="text-left p-2">sample_cnt</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-200 text-slate-700">
                      <td className="p-2">F00{i + 1}</td>
                      <td className="p-2">2026-04-20 {(12 - i).toString().padStart(2, "0")}:00</td>
                      <td className="p-2">{(22 + Math.random() * 2).toFixed(1)}</td>
                      <td className="p-2">{(65 + Math.random() * 8).toFixed(1)}</td>
                      <td className="p-2">{Math.round(600 + Math.random() * 200)}</td>
                      <td className="p-2">3,600</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4 overflow-auto" style={cardBg}>
          <div className="text-slate-400 text-xs mb-3">数据资产</div>
          {["ods.ods_env_sensor", "ods.ods_feed_stock", "dwd.dwd_production", "dws.dws_daily_kpi", "ads.ads_report"].map((t) => (
            <div key={t} className="flex items-center gap-2 py-1.5 text-xs text-slate-700 hover:text-cyan-600 cursor-pointer">
              <Database size={12} className="text-cyan-500" />
              <span className="truncate">{t}</span>
            </div>
          ))}
          <div className="text-slate-400 text-xs mt-5 mb-2">运行历史</div>
          <div className="space-y-2">
            {["成功 · 218ms", "成功 · 184ms", "失败 · 2.1s", "成功 · 302ms"].map((h, i) => (
              <div key={i} className="text-xs p-2 rounded" style={{ background: "#f8fafc" }}>
                <div className={h.startsWith("成功") ? "text-emerald-400" : "text-rose-400"}>{h}</div>
                <div className="text-slate-400 mt-1">12分钟前</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
