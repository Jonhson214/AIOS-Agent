import { useMemo, useState } from "react";
import {
  FileCode,
  GitBranch,
  GitCommit,
  GitMerge,
  Plus,
  Search,
  Tag,
  CircleDot,
  Boxes,
  Snowflake,
  Package,
  QrCode,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  KeyRound,
  Link2,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Scale,
  Download,
  Upload,
  Rocket,
  History,
  ChevronRight,
  Copy,
  Diff,
  ShieldCheck,
  Settings2,
} from "lucide-react";

type PropType = "string" | "number" | "datetime" | "bool" | "ref";

type PropDef = {
  name: string;
  type: PropType;
  pk?: boolean;
  fk?: { to: string; field: string };
  required?: boolean;
  unit?: string;
  desc: string;
  changed?: "added" | "modified" | "removed";
};

type Entity = {
  id: string;
  name: string;
  zh: string;
  category: "entity" | "event" | "asset" | "process";
  icon: any;
  color: string;
  recordCount: string;
  props: PropDef[];
  lineage?: string;
};

const ENTITIES: Entity[] = [
  {
    id: "LivePig", name: "LivePig", zh: "活猪个体", category: "entity", icon: Tag, color: "#ef4444",
    recordCount: "418,329",
    lineage: "阶段一 · 静养致昏",
    props: [
      { name: "ear_tag_id", type: "string", pk: true, required: true, desc: "耳标号 · 全链溯源根 PK" },
      { name: "farm_code", type: "string", required: true, desc: "来源养殖场 · 6 厂区之一" },
      { name: "breed", type: "string", desc: "品种：杜长大 / 牧原黑猪" },
      { name: "live_weight_kg", type: "number", unit: "kg", required: true, desc: "进厂活体重 · 地磅实测" },
      { name: "arrived_at", type: "datetime", required: true, desc: "到厂时间" },
      { name: "rest_duration_h", type: "number", unit: "h", desc: "静养时长 ≥ 12h" },
      { name: "welfare_ok", type: "bool", desc: "动物福利合规标识", changed: "added" },
    ],
  },
  {
    id: "Carcass", name: "Carcass", zh: "白条猪", category: "entity", icon: CircleDot, color: "#ef4444",
    recordCount: "418,102",
    lineage: "阶段二 · 开膛去脏 → 阶段三 · 排酸",
    props: [
      { name: "hook_rfid", type: "string", pk: true, required: true, desc: "挂钩号 · PK" },
      { name: "parent_ear_tag", type: "ref", fk: { to: "LivePig", field: "ear_tag_id" }, required: true, desc: "溯源到活猪 · EarTag→Hook 接力" },
      { name: "carcass_weight_kg", type: "number", unit: "kg", required: true, desc: "热胴体重" },
      { name: "after_chill_kg", type: "number", unit: "kg", desc: "排酸后冷后重 · 扣除冷耗" },
      { name: "vet_result", type: "string", required: true, desc: "同步卫检：PASS / QUARANTINE / CONDEMNED" },
      { name: "carcass_grade", type: "string", desc: "胴体分级 AA/AAA/A", changed: "modified" },
      { name: "chill_curve_id", type: "ref", fk: { to: "ChillCurve", field: "curve_id" }, desc: "挂接排酸曲线标准" },
    ],
  },
  {
    id: "CutEvent", name: "Event:Cutting", zh: "精细分割事件", category: "event", icon: Boxes, color: "#06b6d4",
    recordCount: "38,472",
    lineage: "阶段四 · 精细分割 1:N 枢纽",
    props: [
      { name: "event_id", type: "string", pk: true, required: true, desc: "事件 ID" },
      { name: "carcass_ref", type: "ref", fk: { to: "Carcass", field: "hook_rfid" }, required: true, desc: "母体白条" },
      { name: "line_code", type: "string", required: true, desc: "分割线编号 · 分割线-01~08" },
      { name: "operator_id", type: "string", desc: "操作员工号" },
      { name: "start_at", type: "datetime", required: true, desc: "下刀时刻" },
      { name: "total_yield_pct", type: "number", unit: "%", desc: "实际出肉率 · 用于守恒校验" },
      { name: "loss_pct", type: "number", unit: "%", desc: "损耗率 · > 8% 触发告警", changed: "added" },
    ],
  },
  {
    id: "MeatSKU", name: "MeatSKU", zh: "分割肉块", category: "entity", icon: Boxes, color: "#ef4444",
    recordCount: "6,002,184",
    lineage: "阶段四 · 分割产出",
    props: [
      { name: "tray_barcode", type: "string", pk: true, required: true, desc: "肉筐条码 · Tray PK" },
      { name: "parent_hook_rfid", type: "ref", fk: { to: "Carcass", field: "hook_rfid" }, required: true, desc: "Hook→Tray 接力" },
      { name: "sku_code", type: "string", required: true, desc: "SKU_01~SKU_33 · 部位编码" },
      { name: "part_category", type: "string", desc: "前/中/后段 · 副产" },
      { name: "weight_kg", type: "number", unit: "kg", required: true, desc: "出筐净重" },
      { name: "cut_event", type: "ref", fk: { to: "CutEvent", field: "event_id" }, desc: "产出事件引用" },
    ],
  },
  {
    id: "ChillRoom", name: "ChillRoom", zh: "排酸库", category: "asset", icon: Snowflake, color: "#0ea5e9",
    recordCount: "24",
    lineage: "阶段三 · 排酸预冷",
    props: [
      { name: "room_code", type: "string", pk: true, required: true, desc: "库位编号 A-01 ~ D-06" },
      { name: "capacity_tons", type: "number", unit: "t", desc: "设计容量" },
      { name: "target_temp_c", type: "number", unit: "°C", desc: "目标温度 0-4°C" },
      { name: "plc_addr", type: "string", desc: "SCADA OPC-UA 地址 · 回写入口" },
    ],
  },
  {
    id: "RetailBox", name: "RetailBox", zh: "成品生鲜箱", category: "entity", icon: QrCode, color: "#10b981",
    recordCount: "1,284,029",
    lineage: "阶段五 · 气调包装",
    props: [
      { name: "box_qr_code", type: "string", pk: true, required: true, desc: "终端追溯码 · 面向消费者" },
      { name: "tray_ref", type: "ref", fk: { to: "MeatSKU", field: "tray_barcode" }, required: true, desc: "Tray→Box_QR 接力" },
      { name: "net_weight_g", type: "number", unit: "g", required: true, desc: "净含量" },
      { name: "gas_mix", type: "string", desc: "气调比例 O₂/N₂/CO₂" },
      { name: "shelf_life_days", type: "number", unit: "d", desc: "保质期" },
      { name: "pack_at", type: "datetime", required: true, desc: "封装时间" },
    ],
  },
  {
    id: "QuarantineOrder", name: "QuarantineOrder", zh: "无害化处理工单", category: "process", icon: AlertTriangle, color: "#f59e0b",
    recordCount: "42",
    lineage: "异常分支 · 卫检拦截",
    props: [
      { name: "order_id", type: "string", pk: true, required: true, desc: "工单号" },
      { name: "carcass_ref", type: "ref", fk: { to: "Carcass", field: "hook_rfid" }, required: true, desc: "触发来源" },
      { name: "reason_code", type: "string", required: true, desc: "病变 / 异物 / 温度超标" },
      { name: "sla_minutes", type: "number", unit: "m", desc: "SLA 承诺分钟数", changed: "added" },
      { name: "status", type: "string", required: true, desc: "OPEN / DISPOSING / CLOSED" },
    ],
  },
];

type VersionStatus = "published" | "draft" | "review" | "deprecated";

const VERSIONS: Array<{
  v: string; at: string; by: string; status: VersionStatus; note: string; changes: number;
}> = [
  { v: "v2.1.0", at: "2026-04-20 09:12", by: "李建军", status: "draft", note: "新增 welfare_ok / loss_pct / SLA 字段；carcass_grade 扩展分级枚举", changes: 5 },
  { v: "v2.0.0", at: "2026-03-28 14:40", by: "张伟", status: "published", note: "重构排酸曲线挂载 · 拆解事件节点化 · 追溯码规范化", changes: 18 },
  { v: "v1.4.2", at: "2026-02-15 11:02", by: "王磊", status: "published", note: "补充副产品 SKU_30~33；修正 Tray→Box 映射方向", changes: 7 },
  { v: "v1.3.0", at: "2026-01-08 17:25", by: "李建军", status: "published", note: "接入 SCADA OPC-UA 地址以支持反向回写", changes: 4 },
  { v: "v1.0.0", at: "2025-10-01 00:00", by: "—", status: "deprecated", note: "首版本 · 六大核心实体定义", changes: 22 },
];

const panel = { background: "#ffffff", border: "1px solid #e5e7eb" };

export function OntologySchema() {
  const [selectedEntity, setSelectedEntity] = useState<string>("Carcass");
  const [selectedVersion, setSelectedVersion] = useState<string>("v2.1.0");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"schema" | "diff" | "versions" | "publish">("schema");

  const entity = ENTITIES.find((e) => e.id === selectedEntity)!;
  const version = VERSIONS.find((v) => v.v === selectedVersion)!;

  const filtered = useMemo(() => {
    if (!search.trim()) return ENTITIES;
    const q = search.toLowerCase();
    return ENTITIES.filter(
      (e) => e.name.toLowerCase().includes(q) || e.zh.includes(search) || e.id.toLowerCase().includes(q)
    );
  }, [search]);

  const totalProps = ENTITIES.reduce((a, e) => a + e.props.length, 0);
  const totalFks = ENTITIES.reduce((a, e) => a + e.props.filter((p) => p.fk).length, 0);
  const totalChanged = ENTITIES.reduce((a, e) => a + e.props.filter((p) => p.changed).length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">Schema 管理</h1>
          <p className="text-slate-400 text-sm mt-1">
            本体结构版本化治理 · 肉食工厂全链实体字典 · 变更审批发布闭环
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-slate-600"
            style={{ background: "#f1f5f9", border: "1px solid #e5e7eb" }}>
            <Download size={12} /> 导出 JSON Schema
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-slate-600"
            style={{ background: "#f1f5f9", border: "1px solid #e5e7eb" }}>
            <Upload size={12} /> 导入 DDL
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white"
            style={{ background: "linear-gradient(135deg,#06b6d4,#0284c7)" }}>
            <Plus size={12} /> 新建实体
          </button>
        </div>
      </div>

      {/* Version ribbon */}
      <div className="rounded-lg p-3 flex items-center gap-4" style={panel}>
        <div className="flex items-center gap-2 text-sm">
          <GitBranch size={14} className="text-cyan-600" />
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="bg-transparent outline-none text-slate-800 cursor-pointer"
          >
            {VERSIONS.map((v) => (
              <option key={v.v} value={v.v}>{v.v} · {v.status}</option>
            ))}
          </select>
          <StatusChip s={version.status} />
        </div>
        <div className="h-5 w-px bg-slate-200" />
        <div className="flex-1 text-xs text-slate-600 truncate">
          <span className="text-slate-400">变更说明 ·</span> {version.note}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><Clock size={11} />{version.at}</span>
          <span className="flex items-center gap-1"><GitCommit size={11} />{version.by}</span>
          <span className="px-2 py-0.5 rounded-full tabular-nums"
            style={{ background: "#ecfeff", color: "#0e7490" }}>
            {version.changes} 条变更
          </span>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { k: "实体总数", v: String(ENTITIES.length), sub: "实体 / 事件 / 资产 / 流程", c: "#06b6d4", I: FileCode },
          { k: "属性字段", v: String(totalProps), sub: "跨全工艺五阶段", c: "#0ea5e9", I: Hash },
          { k: "外键接力", v: String(totalFks), sub: "EarTag→Hook→Tray→QR", c: "#10b981", I: Link2 },
          { k: "待发布变更", v: String(totalChanged), sub: "需审批后灰度推生产", c: "#f59e0b", I: Shield },
        ].map((s) => (
          <div key={s.k} className="rounded-lg p-4" style={panel}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{s.k}</span>
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${s.c}14`, color: s.c }}>
                <s.I size={14} />
              </div>
            </div>
            <div className="text-2xl text-slate-900 mt-2 tabular-nums">{s.v}</div>
            <div className="text-xs text-slate-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "#f1f5f9", width: "fit-content" }}>
        {([
          { id: "schema", label: "实体字典", I: FileCode },
          { id: "diff", label: "版本对比", I: Diff },
          { id: "versions", label: "发布历史", I: History },
          { id: "publish", label: "发布与审批", I: Rocket },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all"
            style={{
              background: tab === t.id ? "#ffffff" : "transparent",
              color: tab === t.id ? "#0e7490" : "#64748b",
              boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            }}
          >
            <t.I size={12} /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "schema" && (
        <div className="grid gap-3" style={{ gridTemplateColumns: "260px 1fr" }}>
          {/* Entity list */}
          <div className="rounded-lg p-3" style={panel}>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md mb-3" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
              <Search size={12} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="检索实体..."
                className="flex-1 bg-transparent outline-none text-xs placeholder:text-slate-400 text-slate-700"
              />
            </div>

            {(["entity", "event", "asset", "process"] as const).map((cat) => {
              const group = filtered.filter((e) => e.category === cat);
              if (!group.length) return null;
              return (
                <div key={cat} className="mb-4">
                  <div className="text-[10px] text-slate-400 px-2 mb-1.5 tracking-wider">
                    {cat === "entity" ? "物理实体" : cat === "event" ? "事件" : cat === "asset" ? "资产设备" : "业务流程"}
                  </div>
                  <div className="space-y-1">
                    {group.map((e) => {
                      const changed = e.props.filter((p) => p.changed).length;
                      const sel = selectedEntity === e.id;
                      return (
                        <button
                          key={e.id}
                          onClick={() => setSelectedEntity(e.id)}
                          className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-left text-sm transition-all"
                          style={{
                            background: sel ? "#ecfeff" : "transparent",
                            borderLeft: sel ? "2px solid #06b6d4" : "2px solid transparent",
                          }}
                        >
                          <e.icon size={14} style={{ color: e.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-slate-800 text-xs truncate">{e.zh}</div>
                            <div className="text-[10px] text-slate-400 truncate">{e.name}</div>
                          </div>
                          {changed > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white tabular-nums"
                              style={{ background: "#f59e0b" }}>
                              +{changed}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Entity detail */}
          <div className="rounded-lg" style={panel}>
            {/* header */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #e5e7eb", background: "#fafafa" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <entity.icon size={18} style={{ color: entity.color }} />
                    <span className="text-slate-900 text-lg">{entity.zh}</span>
                    <code className="text-xs text-slate-500 px-2 py-0.5 rounded" style={{ background: "#f1f5f9" }}>
                      {entity.name}
                    </code>
                    <CategoryChip cat={entity.category} />
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Hash size={10} />{entity.props.length} 字段</span>
                    <span className="flex items-center gap-1"><Link2 size={10} />{entity.props.filter((p) => p.fk).length} 外键</span>
                    <span className="flex items-center gap-1"><KeyRound size={10} />{entity.props.filter((p) => p.pk).length} 主键</span>
                    <span className="flex items-center gap-1 tabular-nums">
                      <Boxes size={10} />实例 {entity.recordCount}
                    </span>
                    {entity.lineage && (
                      <span className="flex items-center gap-1 text-cyan-600">
                        <ChevronRight size={10} />{entity.lineage}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="px-2 py-1 rounded text-xs text-slate-600" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
                    <Copy size={11} className="inline" /> 克隆
                  </button>
                  <button className="px-2 py-1 rounded text-xs text-slate-600" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
                    <Settings2 size={11} className="inline" /> 索引
                  </button>
                  <button className="px-2 py-1 rounded text-xs text-white" style={{ background: "linear-gradient(135deg,#06b6d4,#0284c7)" }}>
                    <Plus size={11} className="inline" /> 字段
                  </button>
                </div>
              </div>
            </div>

            {/* table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-slate-500" style={{ background: "#f8fafc" }}>
                    <th className="px-4 py-2 text-left">字段名</th>
                    <th className="px-2 py-2 text-left">类型</th>
                    <th className="px-2 py-2 text-left">约束</th>
                    <th className="px-2 py-2 text-left">外键 / 单位</th>
                    <th className="px-2 py-2 text-left">业务释义</th>
                    <th className="px-2 py-2 w-20">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {entity.props.map((p) => (
                    <tr key={p.name} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {p.pk && <KeyRound size={12} className="text-amber-500" />}
                          {p.fk && <Link2 size={12} className="text-cyan-500" />}
                          <code className="text-[12px] text-slate-800">{p.name}</code>
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        <TypeChip t={p.type} />
                      </td>
                      <td className="px-2 py-2.5 text-[11px]">
                        <div className="flex items-center gap-1">
                          {p.required ? (
                            <span className="text-red-500 flex items-center gap-0.5">
                              <Lock size={10} /> NOT NULL
                            </span>
                          ) : (
                            <span className="text-slate-400">可选</span>
                          )}
                          {p.pk && <span className="text-amber-600">· PK</span>}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-[11px]">
                        {p.fk ? (
                          <span className="text-cyan-700">
                            → {p.fk.to}.{p.fk.field}
                          </span>
                        ) : p.unit ? (
                          <span className="text-slate-500 tabular-nums">{p.unit}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-[12px] text-slate-600">{p.desc}</td>
                      <td className="px-2 py-2.5">
                        <ChangeChip c={p.changed} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* cypher preview */}
            <div className="px-5 pb-5 pt-3" style={{ borderTop: "1px solid #e5e7eb", background: "#fafafa" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <GitBranch size={12} className="text-cyan-600" />
                  生成 · Cypher Constraint
                </div>
                <button className="text-[11px] text-cyan-600 flex items-center gap-1">
                  <Copy size={11} /> 复制
                </button>
              </div>
              <pre className="text-[11px] leading-6 rounded-md p-3 overflow-x-auto"
                style={{ background: "#0f172a", color: "#e2e8f0" }}>
{`CREATE CONSTRAINT ${entity.name}_pk IF NOT EXISTS
FOR (n:${entity.name}) REQUIRE n.${entity.props.find((p) => p.pk)?.name ?? "id"} IS UNIQUE;

CREATE INDEX ${entity.name}_parent IF NOT EXISTS
FOR (n:${entity.name}) ON (n.${entity.props.find((p) => p.fk)?.name ?? "ref"});`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {tab === "diff" && <DiffView />}
      {tab === "versions" && <VersionsView />}
      {tab === "publish" && <PublishView />}
    </div>
  );
}

// --- DIFF ---
function DiffView() {
  const rows = [
    { e: "LivePig", field: "welfare_ok", op: "added", from: "—", to: "bool · 动物福利合规标识", impact: "新增字段 · 兼容", by: "李建军" },
    { e: "Carcass", field: "carcass_grade", op: "modified", from: "string (A/B)", to: "string (AA/AAA/A)", impact: "枚举扩展 · 需下游同步", by: "李建军" },
    { e: "CutEvent", field: "loss_pct", op: "added", from: "—", to: "number (%) · 守恒告警基础", impact: "新增字段 · 兼容", by: "张伟" },
    { e: "MeatSKU", field: "freshness_score", op: "removed", from: "number", to: "—", impact: "⚠ 破坏性 · 需迁移脚本", by: "王磊" },
    { e: "QuarantineOrder", field: "sla_minutes", op: "added", from: "—", to: "number (min) · SLA 承诺", impact: "新增字段 · 兼容", by: "李建军" },
  ];
  return (
    <div className="rounded-lg" style={panel}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #e5e7eb", background: "#fafafa" }}>
        <div className="text-sm text-slate-800 flex items-center gap-2">
          <Diff size={14} className="text-cyan-600" />
          版本对比 · v2.0.0 → v2.1.0
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-emerald-600">+3 新增</span>
          <span className="text-amber-600">~1 修改</span>
          <span className="text-red-600">-1 删除</span>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] text-slate-500" style={{ background: "#f8fafc" }}>
            <th className="px-4 py-2 text-left w-32">实体</th>
            <th className="px-2 py-2 text-left w-40">字段</th>
            <th className="px-2 py-2 text-left w-20">操作</th>
            <th className="px-2 py-2 text-left">变更前</th>
            <th className="px-2 py-2 text-left">变更后</th>
            <th className="px-2 py-2 text-left w-52">影响评估</th>
            <th className="px-2 py-2 text-left w-20">提交人</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="px-4 py-2.5 text-slate-800">{r.e}</td>
              <td className="px-2 py-2.5"><code className="text-[12px]">{r.field}</code></td>
              <td className="px-2 py-2.5">
                <span className="text-[11px] px-1.5 py-0.5 rounded"
                  style={{
                    background: r.op === "added" ? "#ecfdf5" : r.op === "modified" ? "#fff7ed" : "#fef2f2",
                    color: r.op === "added" ? "#047857" : r.op === "modified" ? "#9a3412" : "#b91c1c",
                  }}>
                  {r.op === "added" ? "+ 新增" : r.op === "modified" ? "~ 修改" : "− 删除"}
                </span>
              </td>
              <td className="px-2 py-2.5 text-[12px]">
                <code className={r.op === "removed" ? "line-through text-red-500" : "text-slate-500"}>{r.from}</code>
              </td>
              <td className="px-2 py-2.5 text-[12px]">
                <code className={r.op === "added" ? "text-emerald-700" : "text-slate-700"}>{r.to}</code>
              </td>
              <td className="px-2 py-2.5 text-[11px] text-slate-600">
                {r.impact.includes("破坏") ? (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertTriangle size={11} /> {r.impact}
                  </span>
                ) : r.impact}
              </td>
              <td className="px-2 py-2.5 text-[11px] text-slate-500">{r.by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- VERSIONS ---
function VersionsView() {
  return (
    <div className="rounded-lg p-5" style={panel}>
      <div className="text-sm text-slate-800 mb-4 flex items-center gap-2">
        <History size={14} className="text-cyan-600" />
        发布历史
      </div>
      <div className="relative pl-6">
        <div className="absolute left-2 top-1 bottom-1 w-px bg-slate-200" />
        {VERSIONS.map((v) => (
          <div key={v.v} className="relative mb-5 last:mb-0">
            <div className="absolute -left-5 top-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
              style={{
                background: v.status === "published" ? "#10b981" : v.status === "draft" ? "#f59e0b" : v.status === "review" ? "#06b6d4" : "#cbd5e1",
                boxShadow: `0 0 0 3px #fff, 0 0 0 4px ${v.status === "published" ? "#a7f3d0" : v.status === "draft" ? "#fde68a" : "#e2e8f0"}`,
              }}>
              {v.status === "published" && <CheckCircle2 size={10} className="text-white" />}
              {v.status === "draft" && <FileText size={9} className="text-white" />}
            </div>
            <div className="rounded-lg p-3 flex items-start justify-between"
              style={{ background: v.status === "draft" ? "#fffbeb" : "#ffffff", border: "1px solid #e5e7eb" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 text-sm tabular-nums">{v.v}</span>
                  <StatusChip s={v.status} />
                  <span className="text-[11px] text-slate-400 tabular-nums">· {v.at}</span>
                  <span className="text-[11px] text-slate-400">· {v.by}</span>
                </div>
                <div className="text-xs text-slate-600 mt-1 leading-relaxed">{v.note}</div>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded tabular-nums" style={{ background: "#ecfeff", color: "#0e7490" }}>
                  {v.changes} 变更
                </span>
                <button className="text-slate-500 hover:text-cyan-600">查看</button>
                {v.status === "published" && (
                  <button className="text-slate-500 hover:text-amber-600">回滚</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- PUBLISH ---
function PublishView() {
  const steps = [
    { id: 1, name: "草稿", by: "李建军", at: "2026-04-20 09:12", state: "done", icon: FileText },
    { id: 2, name: "自检 · 重量守恒/外键完整", by: "系统", at: "2026-04-20 09:14", state: "done", icon: ShieldCheck },
    { id: 3, name: "架构师评审", by: "张伟", at: "2026-04-20 11:00", state: "current", icon: Shield },
    { id: 4, name: "业务方联审 · 品管 + MES", by: "—", at: "—", state: "pending", icon: Shield },
    { id: 5, name: "灰度发布 · 分割线-02 单线验证", by: "—", at: "—", state: "pending", icon: Rocket },
    { id: 6, name: "全量推生产", by: "—", at: "—", state: "pending", icon: Rocket },
  ];
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
      <div className="rounded-lg p-5" style={panel}>
        <div className="text-sm text-slate-800 mb-4 flex items-center gap-2">
          <Rocket size={14} className="text-cyan-600" />
          v2.1.0 发布流程
        </div>
        <div className="space-y-3">
          {steps.map((s, i) => {
            const ok = s.state === "done";
            const now = s.state === "current";
            return (
              <div key={s.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: ok ? "#10b981" : now ? "#06b6d4" : "#f1f5f9",
                      color: ok || now ? "#fff" : "#94a3b8",
                      boxShadow: now ? "0 0 0 4px rgba(6,182,212,0.18)" : "none",
                    }}>
                    {ok ? <CheckCircle2 size={14} /> : <s.icon size={14} />}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 my-1" style={{ background: ok ? "#10b981" : "#e5e7eb", minHeight: 28 }} />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${now ? "text-cyan-700" : ok ? "text-slate-800" : "text-slate-400"}`}>
                      {s.name}
                    </span>
                    <span className="text-[11px] text-slate-400">{s.at}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{s.by}</div>
                  {now && (
                    <div className="mt-2 flex items-center gap-2">
                      <button className="px-3 py-1 rounded text-[11px] text-white"
                        style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                        通过评审
                      </button>
                      <button className="px-3 py-1 rounded text-[11px] text-red-600"
                        style={{ background: "#fee2e2", border: "1px solid #fecaca" }}>
                        驳回
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg p-4" style={panel}>
          <div className="text-sm text-slate-800 mb-3 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            自检清单
          </div>
          <div className="space-y-2 text-xs">
            {[
              { ok: true, label: "外键指向全部存在" },
              { ok: true, label: "主键唯一性约束完整" },
              { ok: true, label: "重量守恒：Σ(SKU) + 损耗 = 胴体重" },
              { ok: true, label: "ID 接力链完整：EarTag→Hook→Tray→QR" },
              { ok: false, label: "MeatSKU.freshness_score 删除需迁移脚本" },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-2">
                {c.ok ? (
                  <CheckCircle2 size={12} className="text-emerald-500" />
                ) : (
                  <AlertTriangle size={12} className="text-red-500" />
                )}
                <span className={c.ok ? "text-slate-600" : "text-red-600"}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-4" style={panel}>
          <div className="text-sm text-slate-800 mb-3 flex items-center gap-2">
            <Scale size={14} className="text-amber-500" />
            影响面评估
          </div>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>受影响下游系统</span>
              <span className="tabular-nums">4</span>
            </div>
            <div className="text-[11px] text-slate-500 leading-relaxed">
              MES 分割线 · WMS 冷链 · ERP 财务 · BI 大屏
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>待迁移存量数据</span>
              <span className="tabular-nums text-amber-600">2.4 亿行</span>
            </div>
          </div>
        </div>

        <button className="w-full px-4 py-2.5 rounded-md text-sm text-white flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#06b6d4,#0284c7)" }}>
          <Rocket size={14} /> 申请灰度发布
        </button>
      </div>
    </div>
  );
}

// --- Chips ---
function StatusChip({ s }: { s: VersionStatus }) {
  const cfg = {
    published: { bg: "#ecfdf5", fg: "#047857", label: "已发布" },
    draft: { bg: "#fffbeb", fg: "#b45309", label: "草稿" },
    review: { bg: "#ecfeff", fg: "#0e7490", label: "评审中" },
    deprecated: { bg: "#f1f5f9", fg: "#64748b", label: "已弃用" },
  }[s];
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.fg }}>
      {cfg.label}
    </span>
  );
}
function CategoryChip({ cat }: { cat: Entity["category"] }) {
  const cfg = {
    entity: { bg: "#fef2f2", fg: "#b91c1c", label: "物理实体" },
    event: { bg: "#ecfeff", fg: "#0e7490", label: "事件" },
    asset: { bg: "#eff6ff", fg: "#1d4ed8", label: "资产" },
    process: { bg: "#fff7ed", fg: "#9a3412", label: "流程" },
  }[cat];
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.fg }}>
      {cfg.label}
    </span>
  );
}
function TypeChip({ t }: { t: PropType }) {
  const cfg = {
    string: { I: Type, c: "#0e7490" },
    number: { I: Hash, c: "#047857" },
    datetime: { I: Calendar, c: "#b45309" },
    bool: { I: ToggleLeft, c: "#7c3aed" },
    ref: { I: Link2, c: "#0284c7" },
  }[t];
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded"
      style={{ background: `${cfg.c}14`, color: cfg.c }}>
      <cfg.I size={10} />{t}
    </span>
  );
}
function ChangeChip({ c }: { c?: PropDef["changed"] }) {
  if (!c) return <span className="text-[11px] text-slate-300">—</span>;
  const cfg = {
    added: { bg: "#ecfdf5", fg: "#047857", label: "+ 新增" },
    modified: { bg: "#fff7ed", fg: "#9a3412", label: "~ 修改" },
    removed: { bg: "#fef2f2", fg: "#b91c1c", label: "− 删除" },
  }[c];
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.fg }}>
      {cfg.label}
    </span>
  );
}
