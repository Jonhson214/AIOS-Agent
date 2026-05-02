import { Network, Plus, Upload, GitBranch, Database, Link2 } from "lucide-react";
import { useState } from "react";

const cardBg = { background: "#ffffff", border: "1px solid #e5e7eb" };

const entities = [
  { name: "养殖场", count: 128, color: "#06b6d4" },
  { name: "猪只", count: 3820456, color: "#60a5fa" },
  { name: "批次", count: 21408, color: "#a78bfa" },
  { name: "饲料", count: 482, color: "#34d399" },
  { name: "设备", count: 1286, color: "#f59e0b" },
  { name: "检疫记录", count: 98211, color: "#ec4899" },
];

const relations = [
  { from: "养殖场", to: "批次", type: "包含", count: 21408 },
  { from: "批次", to: "猪只", type: "含有", count: 3820456 },
  { from: "猪只", to: "检疫记录", type: "产生", count: 98211 },
  { from: "养殖场", to: "设备", type: "部署", count: 1286 },
  { from: "批次", to: "饲料", type: "消耗", count: 18240 },
];

export function OntologyWorkbench() {
  const [tab, setTab] = useState<"graph" | "inject" | "schema" | "rel">("graph");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">本体工作台</h1>
          <p className="text-slate-400 text-sm mt-1">构建业务知识本体，打通数据、关系与语义</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-700" style={{ background: "#ffffff" }}>
            <Upload size={14} /> 导入 Schema
          </button>
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-white"
            style={{ background: "linear-gradient(135deg,#06b6d4,#0ea5e9)" }}
          >
            <Plus size={14} /> 新建实体
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {[
          { k: "graph", l: "本体图谱" },
          { k: "inject", l: "本体注入" },
          { k: "schema", l: "Schema 管理" },
          { k: "rel", l: "关系抽取" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as any)}
            className={`px-4 py-2 text-sm transition-colors relative ${
              tab === t.k ? "text-cyan-600" : "text-slate-400 hover:text-slate-800"
            }`}
          >
            {t.l}
            {tab === t.k && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />}
          </button>
        ))}
      </div>

      {tab === "graph" && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg p-5 col-span-2 relative overflow-hidden" style={{ ...cardBg, minHeight: 420 }}>
            <div className="text-slate-400 text-xs mb-2">知识图谱可视化</div>
            {/* Simple SVG graph */}
            <svg viewBox="0 0 600 380" className="w-full h-full">
              {[
                { x1: 300, y1: 190, x2: 150, y2: 100 },
                { x1: 300, y1: 190, x2: 450, y2: 100 },
                { x1: 300, y1: 190, x2: 150, y2: 280 },
                { x1: 300, y1: 190, x2: 450, y2: 280 },
                { x1: 150, y1: 100, x2: 80, y2: 200 },
                { x1: 450, y1: 100, x2: 520, y2: 200 },
              ].map((l, i) => (
                <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#06b6d4" strokeOpacity={0.3} strokeWidth={1} />
              ))}
              {[
                { cx: 300, cy: 190, r: 40, c: "#06b6d4", t: "养殖场" },
                { cx: 150, cy: 100, r: 30, c: "#60a5fa", t: "批次" },
                { cx: 450, cy: 100, r: 30, c: "#a78bfa", t: "设备" },
                { cx: 150, cy: 280, r: 30, c: "#34d399", t: "猪只" },
                { cx: 450, cy: 280, r: 30, c: "#f59e0b", t: "饲料" },
                { cx: 80, cy: 200, r: 22, c: "#ec4899", t: "检疫" },
                { cx: 520, cy: 200, r: 22, c: "#f472b6", t: "传感器" },
              ].map((n) => (
                <g key={n.t}>
                  <circle cx={n.cx} cy={n.cy} r={n.r} fill={n.c} fillOpacity={0.2} stroke={n.c} strokeWidth={1.5} />
                  <text x={n.cx} y={n.cy + 4} textAnchor="middle" fill="#fff" fontSize={12}>{n.t}</text>
                </g>
              ))}
            </svg>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg p-4" style={cardBg}>
              <div className="text-slate-400 text-xs mb-3">实体类型</div>
              <div className="space-y-2">
                {entities.map((e) => (
                  <div key={e.name} className="flex items-center justify-between py-1 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                      <span className="text-slate-800">{e.name}</span>
                    </div>
                    <span className="text-slate-400 text-xs">{e.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg p-4" style={cardBg}>
              <div className="text-slate-400 text-xs mb-3">关系</div>
              <div className="space-y-2 text-xs">
                {relations.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-700">
                    <span>{r.from}</span>
                    <Link2 size={10} className="text-cyan-500" />
                    <span className="text-cyan-600">{r.type}</span>
                    <Link2 size={10} className="text-cyan-500" />
                    <span>{r.to}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "inject" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg p-5" style={cardBg}>
            <div className="text-slate-900 mb-4">本体注入流程</div>
            <div className="space-y-3">
              {[
                { step: 1, t: "选择数据源", d: "ODS/DWD 表、文档或 API", s: "done" },
                { step: 2, t: "字段映射", d: "将字段映射到本体属性", s: "done" },
                { step: 3, t: "实体识别", d: "运行 NER 模型抽取实体", s: "active" },
                { step: 4, t: "关系抽取", d: "识别实体间关系", s: "pending" },
                { step: 5, t: "写入图谱", d: "持久化到 Neo4j", s: "pending" },
              ].map((p) => (
                <div key={p.step} className="flex items-center gap-3 p-3 rounded" style={{ background: "#f8fafc" }}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                    style={{
                      background: p.s === "done" ? "#34d399" : p.s === "active" ? "#06b6d4" : "#e5e7eb",
                      color: p.s === "pending" ? "#64748b" : "#000",
                    }}
                  >
                    {p.step}
                  </div>
                  <div className="flex-1">
                    <div className="text-slate-800 text-sm">{p.t}</div>
                    <div className="text-slate-400 text-xs">{p.d}</div>
                  </div>
                  <span className={`text-xs ${p.s === "active" ? "text-cyan-600" : p.s === "done" ? "text-emerald-400" : "text-slate-400"}`}>
                    {p.s === "active" ? "进行中" : p.s === "done" ? "已完成" : "待执行"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg p-5" style={cardBg}>
            <div className="text-slate-900 mb-4">注入统计</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: "本次实体", v: "32,148", c: "#06b6d4" },
                { l: "本次关系", v: "86,312", c: "#a78bfa" },
                { l: "冲突", v: "142", c: "#f59e0b" },
                { l: "吞吐速率", v: "2.4K/s", c: "#34d399" },
              ].map((m) => (
                <div key={m.l} className="rounded p-4" style={{ background: "#f8fafc" }}>
                  <div className="text-slate-400 text-xs">{m.l}</div>
                  <div className="text-2xl mt-1" style={{ color: m.c }}>{m.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-slate-400 text-xs mb-2">实时日志</div>
            <pre className="text-xs p-3 rounded overflow-auto text-slate-700 font-mono leading-relaxed" style={{ background: "#f1f5f9", maxHeight: 180 }}>
{`[14:32:08] ✔ 源 ods.ods_device → 实体 "设备" · 1286 条
[14:32:11] ✔ 字段映射确认: name→device.label
[14:32:14] ▶ 启动 NER worker x8
[14:32:19] ✔ 抽取批次实体 3,240 条
[14:32:22] ⚠ 冲突 2 条已合并
[14:32:25] ▶ 关系识别...
[14:32:28] ✔ 产生关系 "部署于" 1286 条
[14:32:31] ✔ 写入 Neo4j (batch 1/12)`}
            </pre>
          </div>
        </div>
      )}

      {tab === "schema" && (
        <div className="rounded-lg p-5" style={cardBg}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs border-b border-slate-200">
                <th className="text-left py-2">实体</th>
                <th className="text-left py-2">属性</th>
                <th className="text-left py-2">类型</th>
                <th className="text-left py-2">是否必填</th>
                <th className="text-left py-2">样例</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["养殖场", "farm_id", "String", "✓", "F001"],
                ["养殖场", "area", "Float", "✓", "12800㎡"],
                ["批次", "batch_no", "String", "✓", "B-2026-0412"],
                ["批次", "start_date", "Date", "✓", "2026-03-08"],
                ["猪只", "ear_tag", "String", "✓", "ET-4821039"],
                ["猪只", "weight", "Float", "", "82.4kg"],
                ["设备", "device_type", "Enum", "✓", "sensor"],
              ].map((r, i) => (
                <tr key={i} className="border-b border-slate-200 hover:bg-slate-50">
                  {r.map((c, j) => (
                    <td key={j} className={`py-3 ${j === 0 ? "text-cyan-600" : "text-slate-700"}`}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "rel" && (
        <div className="rounded-lg p-5" style={cardBg}>
          <div className="flex items-center gap-2 mb-4">
            <GitBranch size={16} className="text-cyan-500" />
            <span className="text-slate-900">关系抽取规则</span>
          </div>
          <div className="space-y-2">
            {relations.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded" style={{ background: "#f8fafc" }}>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-2 py-0.5 rounded text-cyan-600" style={{ background: "rgba(6,182,212,0.1)" }}>{r.from}</span>
                  <span className="text-slate-400">—[{r.type}]→</span>
                  <span className="px-2 py-0.5 rounded text-cyan-600" style={{ background: "rgba(6,182,212,0.1)" }}>{r.to}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>匹配数: {r.count.toLocaleString()}</span>
                  <button className="text-cyan-600">编辑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
