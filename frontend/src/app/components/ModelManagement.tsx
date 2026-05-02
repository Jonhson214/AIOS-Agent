import { Boxes, Plus, Cpu, TrendingUp, Download } from "lucide-react";

const cardBg = { background: "#ffffff", border: "1px solid #e5e7eb" };

const models = [
  { name: "断头预警模型", version: "v2.3.1", type: "XGBoost", acc: 94.2, status: "online", calls: "12.8K/日", owner: "张工" },
  { name: "疫病识别CV", version: "v1.8.0", type: "YOLOv8", acc: 91.6, status: "online", calls: "8.4K/日", owner: "李博" },
  { name: "产能预测LSTM", version: "v3.1.0", type: "LSTM", acc: 88.7, status: "online", calls: "2.1K/日", owner: "王工" },
  { name: "饲料配比优化", version: "v1.2.4", type: "Linear", acc: 86.3, status: "training", calls: "-", owner: "赵博" },
  { name: "环境异常检测", version: "v2.0.0", type: "Isolation Forest", acc: 92.1, status: "online", calls: "28K/日", owner: "孙工" },
  { name: "质量根因追溯", version: "v1.5.2", type: "Graph+LLM", acc: 89.5, status: "online", calls: "612/日", owner: "周博" },
];

export function ModelManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">模型管理</h1>
          <p className="text-slate-400 text-sm mt-1">模型版本、部署与效果监控一体化</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white"
          style={{ background: "linear-gradient(135deg,#06b6d4,#0ea5e9)" }}
        >
          <Plus size={14} />
          注册模型
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { t: "模型总数", v: "28", c: "#06b6d4", i: Boxes },
          { t: "在线服务", v: "19", c: "#34d399", i: Cpu },
          { t: "日均调用", v: "182K", c: "#60a5fa", i: TrendingUp },
          { t: "平均准确率", v: "90.8%", c: "#a78bfa", i: TrendingUp },
        ].map((s) => (
          <div key={s.t} className="rounded-lg p-5" style={cardBg}>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">{s.t}</span>
              <s.i size={16} style={{ color: s.c }} />
            </div>
            <div className="text-3xl mt-2" style={{ color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {models.map((m) => (
          <div key={m.name} className="rounded-lg p-5" style={cardBg}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-900">{m.name}</span>
                  <span className="text-xs text-slate-400">{m.version}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">{m.type} · 负责人 {m.owner}</div>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: m.status === "online" ? "rgba(52,211,153,0.15)" : "rgba(245,158,11,0.15)",
                  color: m.status === "online" ? "#34d399" : "#f59e0b",
                }}
              >
                {m.status === "online" ? "已部署" : "训练中"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs mt-4">
              <div className="rounded p-3" style={{ background: "#f8fafc" }}>
                <div className="text-slate-400">准确率</div>
                <div className="text-slate-900 mt-1" style={{ fontSize: 20 }}>{m.acc}%</div>
              </div>
              <div className="rounded p-3" style={{ background: "#f8fafc" }}>
                <div className="text-slate-400">调用量</div>
                <div className="text-slate-900 mt-1" style={{ fontSize: 20 }}>{m.calls}</div>
              </div>
              <div className="rounded p-3 flex items-center justify-center gap-2" style={{ background: "#f8fafc" }}>
                <button className="text-slate-400 hover:text-cyan-600"><Download size={14} /></button>
                <button className="text-cyan-600 text-xs">详情</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
