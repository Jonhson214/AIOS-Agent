import { Database, Plus, Search, Server, Cloud, FileJson, Activity } from "lucide-react";

const cardBg = { background: "#ffffff", border: "1px solid #e5e7eb" };

const sources = [
  { name: "生产MySQL-主库", type: "MySQL", icon: Database, status: "online", tables: 128, host: "prod-mysql-01.muyuan.local", color: "#06b6d4" },
  { name: "环境传感器集群", type: "MQTT", icon: Cloud, status: "online", tables: 32, host: "mqtt.iot.muyuan.cn:1883", color: "#60a5fa" },
  { name: "ERP数据仓库", type: "Oracle", icon: Server, status: "online", tables: 412, host: "oracle-erp.muyuan.local", color: "#a78bfa" },
  { name: "饲料MES系统", type: "PostgreSQL", icon: Database, status: "offline", tables: 88, host: "pg-mes.muyuan.local", color: "#f59e0b" },
  { name: "文档中心", type: "OSS", icon: FileJson, status: "online", tables: 0, host: "oss://muyuan-docs", color: "#34d399" },
  { name: "Kafka事件流", type: "Kafka", icon: Activity, status: "online", tables: 64, host: "kafka-cluster.muyuan:9092", color: "#ec4899" },
];

export function DataSourceManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">数据源管理</h1>
          <p className="text-slate-400 text-sm mt-1">统一注册、监控各类数据源连接健康</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white"
          style={{ background: "linear-gradient(135deg,#06b6d4,#0ea5e9)" }}
        >
          <Plus size={14} />
          新建数据源
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md flex-1 max-w-md" style={{ background: "#ffffff" }}>
          <Search size={14} className="text-slate-400" />
          <input placeholder="搜索数据源名称、类型、主机..." className="bg-transparent outline-none text-sm text-slate-800 flex-1 placeholder:text-slate-400" />
        </div>
        {["全部", "MySQL", "Kafka", "MQTT", "OSS"].map((t, i) => (
          <button
            key={t}
            className={`px-3 py-1.5 rounded-md text-xs ${i === 0 ? "text-cyan-600" : "text-slate-400"}`}
            style={i === 0 ? { background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)" } : { background: "#ffffff" }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {sources.map((s) => (
          <div key={s.name} className="rounded-lg p-5" style={cardBg}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center"
                  style={{ background: `${s.color}20`, color: s.color }}
                >
                  <s.icon size={18} />
                </div>
                <div>
                  <div className="text-slate-900">{s.name}</div>
                  <div className="text-slate-400 text-xs">{s.type}</div>
                </div>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: s.status === "online" ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)",
                  color: s.status === "online" ? "#34d399" : "#ef4444",
                }}
              >
                ● {s.status === "online" ? "在线" : "离线"}
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">主机</span>
                <span className="text-slate-700 truncate max-w-[180px]">{s.host}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">对象数</span>
                <span className="text-slate-700">{s.tables}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-1.5 text-xs text-slate-700 rounded hover:bg-slate-50" style={{ background: "#f8fafc" }}>
                测试连接
              </button>
              <button className="flex-1 py-1.5 text-xs text-cyan-600 rounded" style={{ background: "rgba(6,182,212,0.1)" }}>
                查看详情
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
