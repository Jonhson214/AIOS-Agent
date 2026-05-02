import { Database, Boxes, Factory, Users, ExternalLink } from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { NavLink } from "react-router";

const cardBg = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
};

const groupBg = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
};

const stats = [
  { title: "数据源数量", value: "3", desc: "平台所连接数据源", icon: Database, color: "#06b6d4" },
  { title: "接入任务", value: "2", desc: "正在运行的接入任务", icon: Boxes, color: "#8b5cf6" },
  { title: "处理任务", value: "2", desc: "标准化与加工任务", icon: Factory, color: "#f59e0b" },
  { title: "服务接口", value: "2", desc: "已开放的数据服务", icon: Users, color: "#10b981" },
];

const modules = [
  {
    title: "数据接入与治理",
    tag: "接入",
    desc: "统一纳管数据源、文档、Schema 等，形成高质量的数据资产池，为下游提供可靠数据基础。",
    items: [
      { label: "数据源连接与可观测性", to: "/data-source" },
      { label: "接入任务编排与调度", to: "/ingestion-tasks" },
      { label: "全量 / 增量同步策略", to: "/ingestion-tasks" },
      { label: "运行告警与追踪", to: "/data-ingestion" },
    ],
    color: "#06b6d4",
  },
  {
    title: "开发工作台",
    tag: "开发",
    desc: "提供 SQL 工作台、脚本管理、工作流编排能力，便捷完成一站式开发、调试、发布全流程。",
    items: [
      { label: "SQL 工作台", to: "/data-development" },
      { label: "脚本管理", to: "/data-development" },
      { label: "工作流编排", to: "/data-development" },
      { label: "实例执行监控", to: "/data-development" },
    ],
    color: "#8b5cf6",
  },
  {
    title: "本体建模",
    tag: "建模",
    desc: "构建企业级业务本体与 Schema，映射异构数据到统一语义，支撑上层智能应用。",
    items: [
      { label: "本体注入", to: "/ontology-modeling" },
      { label: "关系抽取", to: "/ontology-modeling" },
      { label: "数据映射引擎", to: "/ontology-modeling" },
      { label: "Schema 管理", to: "/ontology-modeling" },
    ],
    color: "#10b981",
  },
];

const trendData = Array.from({ length: 7 }, (_, i) => ({
  day: `D-${6 - i}`,
  val: i < 3 ? 1 : 2,
}));

const barData = [
  { name: "数据接入", v: 3 },
  { name: "数据处理", v: 2 },
  { name: "数据服务", v: 2 },
];

export function Overview() {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-slate-400 text-xs tracking-widest mb-1">DASHBOARD</div>
        <h1 className="text-slate-900 text-2xl">运营总览</h1>
        <p className="text-slate-500 text-sm mt-1">
          汇总平台今日的 KPI、业务趋势和模块能力，帮助快速洞察平台当前运行状况。
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.title} className="rounded-xl p-5" style={cardBg}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-sm">{s.title}</span>
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ background: `${s.color}15`, color: s.color }}
              >
                <s.icon size={16} />
              </div>
            </div>
            <div className="text-4xl" style={{ color: "#0f172a" }}>
              {s.value}
            </div>
            <div className="text-slate-400 text-xs mt-2">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Module group */}
      <div className="grid grid-cols-3 gap-4">
        {modules.map((m) => (
          <div key={m.title} className="p-4" style={groupBg}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded" style={{ background: m.color }} />
                <span className="text-slate-800">{m.title}</span>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: `${m.color}15`, color: m.color }}
              >
                {m.tag}
              </span>
            </div>
            <div className="text-slate-500 text-xs mb-4 leading-relaxed">{m.desc}</div>
            <div className="space-y-2">
              {m.items.map((it) => (
                <NavLink
                  key={it.label}
                  to={it.to}
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div>
                    <div className="text-cyan-700">{it.label}</div>
                    <div className="text-slate-400 text-xs mt-0.5">
                      {m.tag === "接入" ? "接入模块的核心能力与关键入口。" :
                       m.tag === "开发" ? "开发模块的核心能力与关键入口。" :
                       it.label.includes("映射") ? "异构数据源到本体属性的字段映射。" :
                       it.label.includes("Schema") ? "元模型与实例层的生命周期管理。" :
                       it.label.includes("关系") ? "基于 NLP 的实体关系抽取能力。" :
                       "基于 Neo4j 的图谱注入能力。"}
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-slate-400 shrink-0" />
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={cardBg}>
          <div className="text-slate-800">业务趋势</div>
          <div className="text-slate-400 text-xs mt-1 mb-4">
            近 7 个自然周期的接入任务和服务接口规模变化。
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 3]} ticks={[0, 1, 2, 3]} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}
              />
              <Line
                type="monotone"
                dataKey="val"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#8b5cf6", stroke: "#06b6d4", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-5" style={cardBg}>
          <div className="text-slate-800">模块分布</div>
          <div className="text-slate-400 text-xs mt-1 mb-4">按业务域汇总的当前模块体量。</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} domain={[0, 4]} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={80} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}
              />
              <Bar dataKey="v" fill="#06b6d4" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
