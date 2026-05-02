import { Play, Save, Download, Database, ChevronRight, ChevronDown, Table2, Clock } from "lucide-react";
import { useState } from "react";

const cardBg = { background: "#ffffff", border: "1px solid #e5e7eb" };

const sampleSQL = `-- 按养殖场统计近 7 天白条平均瘦肉率
SELECT
  f.farm_name,
  COUNT(DISTINCT c.carcass_id) AS carcass_cnt,
  ROUND(AVG(c.lean_ratio) * 100, 2) AS lean_pct,
  ROUND(AVG(c.backfat_mm), 2) AS backfat_mm,
  ROUND(SUM(c.net_weight_kg) / 1000, 1) AS total_tons
FROM ods.carcass_weighing c
JOIN dim.pig_batch b ON c.batch_id = b.batch_id
JOIN dim.farm f ON b.source_farm_id = f.farm_id
WHERE c.weigh_time >= NOW() - INTERVAL '7 day'
GROUP BY f.farm_name
ORDER BY lean_pct DESC;`;

const result = [
  { farm: "内乡 F3", cnt: 3284, lean: 61.2, back: 2.1, tons: 360.5 },
  { farm: "商水 F2", cnt: 2918, lean: 60.8, back: 2.0, tons: 321.4 },
  { farm: "南阳 F5", cnt: 2756, lean: 60.1, back: 2.3, tons: 298.7 },
  { farm: "浚县 F4", cnt: 2612, lean: 59.8, back: 2.2, tons: 284.2 },
  { farm: "正阳 F1", cnt: 2488, lean: 59.2, back: 2.4, tons: 266.1 },
  { farm: "滑县 F6", cnt: 2214, lean: 58.4, back: 2.6, tons: 241.8 },
];

const catalog = [
  { db: "ods (原始层)", tables: ["ods_pig_weighbridge", "ods_carcass_mes", "ods_inspection_vision", "ods_chill_room_iot", "ods_cutting_wms"] },
  { db: "dwd (明细层)", tables: ["dwd_pig_batch_d", "dwd_carcass_event_i", "dwd_chill_temp_5m", "dwd_product_sku_d"] },
  { db: "dws (汇总层)", tables: ["dws_farm_yield_d", "dws_slaughter_kpi_h", "dws_cold_chain_alert_d"] },
];

export function LabSqlWorkbench() {
  const [sql, setSql] = useState(sampleSQL);
  const [open, setOpen] = useState<string | null>("ods (原始层)");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">SQL 工作台</h1>
          <p className="text-slate-400 text-sm mt-1">交互式查询屠宰 / 冷链 / 分割 业务数据</p>
        </div>
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-4" style={{ height: "calc(100vh - 220px)" }}>
        <div className="rounded-lg p-3 overflow-auto" style={cardBg}>
          <div className="text-xs text-slate-400 mb-2 px-2">数据目录</div>
          <div className="text-xs mb-3 px-2">
            <div className="flex items-center gap-1 text-slate-600">
              <Database size={12} className="text-cyan-500" />
              muyuan_dw
            </div>
          </div>
          {catalog.map((c) => (
            <div key={c.db} className="mb-1">
              <button
                onClick={() => setOpen(open === c.db ? null : c.db)}
                className="w-full flex items-center gap-1 px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded"
              >
                {open === c.db ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {c.db}
              </button>
              {open === c.db && (
                <div className="ml-5 space-y-0.5 mt-0.5">
                  {c.tables.map((t) => (
                    <div key={t} className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 rounded cursor-pointer">
                      <Table2 size={11} />
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 min-h-0">
          <div className="rounded-lg flex flex-col overflow-hidden" style={{ ...cardBg, height: 280 }}>
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50">
              <button className="flex items-center gap-1 px-3 py-1 rounded text-xs text-white" style={{ background: "linear-gradient(135deg,#06b6d4,#0ea5e9)" }}>
                <Play size={11} /> 运行 (F5)
              </button>
              <button className="flex items-center gap-1 px-3 py-1 rounded text-xs text-slate-600 hover:bg-slate-100">
                <Save size={11} /> 保存
              </button>
              <span className="text-xs text-slate-400 ml-3">查询 · 未命名-01</span>
              <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                <Database size={11} /> muyuan_dw
              </span>
            </div>
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className="flex-1 outline-none p-4 text-sm font-mono text-slate-800 resize-none"
              style={{ background: "#fafbfc" }}
              spellCheck={false}
            />
          </div>

          <div className="rounded-lg flex flex-col overflow-hidden flex-1 min-h-0" style={cardBg}>
            <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-200 bg-slate-50 text-xs">
              <span className="text-emerald-500">● 执行成功</span>
              <span className="text-slate-400 flex items-center gap-1"><Clock size={11} />耗时 218ms</span>
              <span className="text-slate-400">行数 {result.length}</span>
              <button className="ml-auto flex items-center gap-1 text-cyan-600"><Download size={11} />导出</button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-slate-400 text-xs border-b border-slate-200">
                    <th className="text-left py-2 px-3">farm_name</th>
                    <th className="text-left py-2 px-3">carcass_cnt</th>
                    <th className="text-left py-2 px-3">lean_pct</th>
                    <th className="text-left py-2 px-3">backfat_mm</th>
                    <th className="text-left py-2 px-3">total_tons</th>
                  </tr>
                </thead>
                <tbody>
                  {result.map((r) => (
                    <tr key={r.farm} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-800">{r.farm}</td>
                      <td className="py-2 px-3 text-slate-600 tabular-nums">{r.cnt}</td>
                      <td className="py-2 px-3 tabular-nums" style={{ color: r.lean >= 60 ? "#10b981" : "#f59e0b" }}>{r.lean}%</td>
                      <td className="py-2 px-3 text-slate-600 tabular-nums">{r.back}</td>
                      <td className="py-2 px-3 text-slate-600 tabular-nums">{r.tons}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
