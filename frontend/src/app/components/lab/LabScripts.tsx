import { FileCode, Play, Pause, Clock, Tag, User } from "lucide-react";

const cardBg = { background: "#ffffff", border: "1px solid #e5e7eb" };

const scripts = [
  { name: "calc_slaughter_yield_daily", lang: "PySpark", desc: "按日计算各养殖场活猪 → 白条 → 净肉出肉率", tag: "出肉率", owner: "张工", last: "2026-04-20 08:00", status: "ok", runs: 1825 },
  { name: "detect_cold_chain_breach", lang: "Python", desc: "扫描排酸库温度序列，检测超过 4°C 阈值的连续时段", tag: "冷链", owner: "李工", last: "2026-04-20 10:15", status: "ok", runs: 2458 },
  { name: "trace_carcass_lineage", lang: "Cypher", desc: "基于 Neo4j 本体图谱回溯分割箱到活猪耳标的血缘", tag: "追溯", owner: "王工", last: "2026-04-20 09:30", status: "ok", runs: 684 },
  { name: "predict_culling_risk", lang: "PySpark + MLflow", desc: "基于环境/饲料/密度特征预测批次断头风险", tag: "AI", owner: "赵工", last: "2026-04-20 06:00", status: "ok", runs: 142 },
  { name: "sync_wms_to_dws", lang: "SQL", desc: "分割包装 WMS → DWS 成品事实表同步", tag: "ETL", owner: "刘工", last: "2026-04-19 23:50", status: "warn", runs: 987 },
  { name: "vision_defect_aggregate", lang: "Python", desc: "卫检视觉异常帧聚合到批次维度", tag: "质检", owner: "陈工", last: "2026-04-20 07:20", status: "ok", runs: 562 },
  { name: "feed_cost_allocation", lang: "SQL", desc: "饲料批次消耗按胴体重量分摊成本", tag: "成本", owner: "孙工", last: "2026-04-20 04:00", status: "paused", runs: 412 },
  { name: "env_sensor_outlier", lang: "Python", desc: "养殖场传感器离群值检测 (IQR + 3σ)", tag: "监控", owner: "周工", last: "2026-04-20 11:05", status: "ok", runs: 3104 },
];

export function LabScripts() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">脚本管理</h1>
          <p className="text-slate-400 text-sm mt-1">Python / PySpark / SQL / Cypher 脚本资产库</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-md text-sm text-slate-600" style={cardBg}>导入</button>
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm text-white" style={{ background: "linear-gradient(135deg,#06b6d4,#0ea5e9)" }}>
            + 新建脚本
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { l: "脚本资产", v: 128, c: "#06b6d4" },
          { l: "今日执行", v: 842, c: "#10b981" },
          { l: "运行中", v: 12, c: "#60a5fa" },
          { l: "失败", v: 2, c: "#f59e0b" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg p-5" style={cardBg}>
            <div className="text-slate-400 text-sm">{s.l}</div>
            <div className="text-3xl mt-2 tabular-nums" style={{ color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {scripts.map((s) => {
          const st = s.status === "ok" ? { c: "#10b981", t: "就绪" } : s.status === "warn" ? { c: "#f59e0b", t: "告警" } : { c: "#94a3b8", t: "已暂停" };
          return (
            <div key={s.name} className="rounded-lg p-4 hover:shadow-md transition-shadow" style={cardBg}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4" }}>
                    <FileCode size={16} />
                  </div>
                  <div>
                    <div className="text-slate-900 font-mono text-sm">{s.name}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">{s.lang}</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: `${st.c}1A`, color: st.c }}>
                  {st.t}
                </span>
              </div>
              <div className="text-slate-600 text-xs mt-2 leading-relaxed h-8">{s.desc}</div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Tag size={10} />{s.tag}</span>
                <span className="flex items-center gap-1"><User size={10} />{s.owner}</span>
                <span className="flex items-center gap-1"><Clock size={10} />{s.last.slice(11)}</span>
                <span className="tabular-nums">{s.runs}次</span>
                <button className="flex items-center gap-1 text-cyan-600">
                  {s.status === "paused" ? <><Play size={10} />启用</> : <><Play size={10} />运行</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
