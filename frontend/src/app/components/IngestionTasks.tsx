import { Play, Pause, Plus, MoreVertical, Clock } from "lucide-react";

const cardBg = { background: "#ffffff", border: "1px solid #e5e7eb" };

const tasks = [
  { name: "生产MySQL全量同步", type: "全量", schedule: "每日 02:00", source: "生产MySQL", target: "ODS层", status: "running", last: "2分钟前", next: "22:00" },
  { name: "环境传感器实时流", type: "CDC", schedule: "实时", source: "MQTT", target: "Kafka主题", status: "running", last: "实时", next: "-" },
  { name: "ERP周增量", type: "增量", schedule: "每周一 01:00", source: "Oracle-ERP", target: "DWD层", status: "paused", last: "3天前", next: "下周一" },
  { name: "饲料库存快照", type: "全量", schedule: "每小时", source: "PG-MES", target: "ODS层", status: "failed", last: "14分钟前", next: "下一小时" },
  { name: "文档归档同步", type: "增量", schedule: "每日 06:00", source: "OSS", target: "向量库", status: "running", last: "6小时前", next: "06:00" },
];

function TaskStatus({ status }: { status: string }) {
  const m: Record<string, { bg: string; color: string; text: string }> = {
    running: { bg: "rgba(6,182,212,0.15)", color: "#06b6d4", text: "运行中" },
    paused: { bg: "rgba(148,163,184,0.15)", color: "#94a3b8", text: "已暂停" },
    failed: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", text: "失败" },
  };
  const v = m[status];
  return (
    <span className="text-xs px-2 py-0.5 rounded" style={{ background: v.bg, color: v.color }}>
      ● {v.text}
    </span>
  );
}

export function IngestionTasks() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">接入任务</h1>
          <p className="text-slate-400 text-sm mt-1">管理全量/增量/CDC 接入任务与调度策略</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white"
          style={{ background: "linear-gradient(135deg,#06b6d4,#0ea5e9)" }}
        >
          <Plus size={14} />
          新建任务
        </button>
      </div>

      <div className="rounded-lg overflow-hidden" style={cardBg}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs" style={{ background: "#f8fafc" }}>
              <th className="text-left px-4 py-3">任务名称</th>
              <th className="text-left px-4 py-3">类型</th>
              <th className="text-left px-4 py-3">调度</th>
              <th className="text-left px-4 py-3">数据源</th>
              <th className="text-left px-4 py-3">目标</th>
              <th className="text-left px-4 py-3">状态</th>
              <th className="text-left px-4 py-3">上次运行</th>
              <th className="text-left px-4 py-3">下次运行</th>
              <th className="text-right px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.name} className="border-t border-slate-200 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-800">{t.name}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa" }}>
                    {t.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {t.schedule}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{t.source}</td>
                <td className="px-4 py-3 text-slate-400">{t.target}</td>
                <td className="px-4 py-3"><TaskStatus status={t.status} /></td>
                <td className="px-4 py-3 text-slate-400">{t.last}</td>
                <td className="px-4 py-3 text-slate-400">{t.next}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2 text-slate-400">
                    {t.status === "running" ? (
                      <button className="hover:text-cyan-600"><Pause size={14} /></button>
                    ) : (
                      <button className="hover:text-cyan-600"><Play size={14} /></button>
                    )}
                    <button className="hover:text-cyan-600"><MoreVertical size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
