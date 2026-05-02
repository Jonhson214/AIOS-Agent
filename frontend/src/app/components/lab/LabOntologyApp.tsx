import { Grid3x3, Play, Zap, Network, Search, Filter } from "lucide-react";

const cardBg = { background: "#ffffff", border: "1px solid #e5e7eb" };

const apps = [
  { name: "胴体追溯图谱", desc: "从分割箱 → 白条 → 活猪 全链路反向溯源", runs: 1248, avg: "182ms", status: "运行中", c: "#06b6d4" },
  { name: "断头风险预测", desc: "基于养殖场环境 + 饲料批次 + 群体密度 预测活猪断头风险", runs: 896, avg: "412ms", status: "运行中", c: "#f59e0b" },
  { name: "冷链异常根因", desc: "排酸库温度偏离关联至 PLC 设备 / 门禁 / 压缩机", runs: 324, avg: "96ms", status: "运行中", c: "#60a5fa" },
  { name: "出肉率归因分析", desc: "批次出肉率波动 → 养殖场 / 日龄 / 饲料配方 归因", runs: 518, avg: "248ms", status: "运行中", c: "#10b981" },
  { name: "质量异常关联检索", desc: "卫检异常批次 → 同源批次 / 同供应商 影响面扩散分析", runs: 207, avg: "312ms", status: "调试中", c: "#a78bfa" },
  { name: "成本结构下钻", desc: "综合成本 → 饲料 / 能耗 / 人工 多维下钻", runs: 642, avg: "121ms", status: "运行中", c: "#ef4444" },
];

export function LabOntologyApp() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">本体应用</h1>
          <p className="text-slate-400 text-sm mt-1">基于本体图谱发布的可复用智能分析应用</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ background: "#f1f5f9" }}>
            <Search size={14} className="text-slate-400" />
            <input placeholder="搜索应用..." className="bg-transparent outline-none text-sm w-48" />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-600" style={cardBg}>
            <Filter size={14} /> 筛选
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm text-white" style={{ background: "linear-gradient(135deg,#06b6d4,#0ea5e9)" }}>
            + 新建应用
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { l: "已发布应用", v: 18, c: "#06b6d4" },
          { l: "今日调用", v: "4,835", c: "#10b981" },
          { l: "平均响应", v: "228ms", c: "#60a5fa" },
          { l: "订阅用户", v: 42, c: "#a78bfa" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg p-5" style={cardBg}>
            <div className="text-slate-400 text-sm">{s.l}</div>
            <div className="text-3xl mt-2 tabular-nums" style={{ color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {apps.map((a) => (
          <div key={a.name} className="rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer" style={cardBg}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: `${a.c}1A`, color: a.c }}>
                <Grid3x3 size={18} />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: a.status === "运行中" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", color: a.status === "运行中" ? "#10b981" : "#f59e0b" }}>
                {a.status}
              </span>
            </div>
            <div className="text-slate-900">{a.name}</div>
            <div className="text-slate-400 text-xs mt-1 leading-relaxed h-10">{a.desc}</div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Zap size={11} />{a.runs} 次</span>
              <span>{a.avg}</span>
              <button className="flex items-center gap-1 text-cyan-600"><Play size={11} />试运行</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
