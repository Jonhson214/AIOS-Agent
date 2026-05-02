import { useEffect, useMemo, useRef, useState } from "react";
import {
  Layers,
  ChevronRight,
  ChevronDown,
  X,
  Link2,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Boxes,
  Package,
  GitBranch,
  Sparkles,
  Search,
  Plus,
  Settings2,
  Play,
  Pause,
  Snowflake,
  Scissors,
  Tag,
  QrCode,
  CircleDot,
  FileText,
} from "lucide-react";

type Sku = { id: string; code: string; name: string; pct: number; parentIdField: string };
type PartGroup = { id: string; name: string; pctEstimate: number; skus: Sku[] };

const PARTS: PartGroup[] = [
  {
    id: "front", name: "前段部位", pctEstimate: 30,
    skus: [
      { id: "sku01", code: "SKU_01", name: "1号肉 / 梅花肉", pct: 4.2, parentIdField: "Hook_RFID" },
      { id: "sku02", code: "SKU_02", name: "2号肉 / 前腿肉", pct: 6.8, parentIdField: "Hook_RFID" },
      { id: "sku03", code: "SKU_03", name: "前排骨", pct: 3.4, parentIdField: "Hook_RFID" },
      { id: "sku04", code: "SKU_04", name: "前蹄膀", pct: 5.2, parentIdField: "Hook_RFID" },
      { id: "sku05", code: "SKU_05", name: "猪颈肉", pct: 2.1, parentIdField: "Hook_RFID" },
    ],
  },
  {
    id: "mid", name: "中段部位", pctEstimate: 25,
    skus: [
      { id: "sku10", code: "SKU_10", name: "3号肉 / 带皮五花肉", pct: 8.6, parentIdField: "Hook_RFID" },
      { id: "sku11", code: "SKU_11", name: "中排骨 / 肋排", pct: 5.0, parentIdField: "Hook_RFID" },
      { id: "sku12", code: "SKU_12", name: "里脊 (Tenderloin)", pct: 3.2, parentIdField: "Hook_RFID" },
      { id: "sku13", code: "SKU_13", name: "通脊 / 外脊", pct: 4.4, parentIdField: "Hook_RFID" },
    ],
  },
  {
    id: "rear", name: "后段部位", pctEstimate: 28,
    skus: [
      { id: "sku20", code: "SKU_20", name: "4号肉 / 后腿肉", pct: 10.5, parentIdField: "Hook_RFID" },
      { id: "sku21", code: "SKU_21", name: "臀尖 (Rump)", pct: 3.1, parentIdField: "Hook_RFID" },
      { id: "sku22", code: "SKU_22", name: "后蹄膀", pct: 4.8, parentIdField: "Hook_RFID" },
      { id: "sku23", code: "SKU_23", name: "尾骨", pct: 0.6, parentIdField: "Hook_RFID" },
    ],
  },
  {
    id: "byproduct", name: "副产与边角", pctEstimate: 12,
    skus: [
      { id: "sku30", code: "SKU_30", name: "板油 / 肥膘", pct: 4.2, parentIdField: "Hook_RFID" },
      { id: "sku31", code: "SKU_31", name: "猪皮", pct: 3.0, parentIdField: "Hook_RFID" },
      { id: "sku32", code: "SKU_32", name: "碎肉 (绞肉原料)", pct: 3.6, parentIdField: "Hook_RFID" },
      { id: "sku33", code: "SKU_33", name: "脂肪边角", pct: 1.2, parentIdField: "Hook_RFID" },
    ],
  },
];

const TOTAL_SKUS = PARTS.reduce((a, p) => a + p.skus.length, 0);
const panel = { background: "#ffffff", border: "1px solid #e5e7eb" };

// --- Canvas geometry ---
const CANVAS_W = 1060;
const CANVAS_H = 1320;
const TRUNK_X = 520;

type NodeDef = {
  id: string;
  x: number; y: number; w: number; h: number;
  kind: "stack" | "card" | "hub" | "rule" | "process" | "final";
  title: string; sub?: string; color: string; icon?: any; badge?: string;
};

const NODES: NodeDef[] = [
  // Stage 1
  { id: "batch", x: TRUNK_X - 100, y: 30, w: 200, h: 70, kind: "stack", title: "进厂活猪批次", sub: "LivePigBatch · 380 头", color: "#ef4444", icon: Boxes, badge: "380" },
  { id: "pig", x: TRUNK_X - 100, y: 160, w: 200, h: 68, kind: "card", title: "活猪个体", sub: "PK: EarTag_ID = P-20260420-0318", color: "#ef4444", icon: Tag },
  // Stage 2
  { id: "hub1", x: TRUNK_X - 40, y: 290, w: 80, h: 80, kind: "hub", title: "开膛去脏", sub: "Event:Eviscerate", color: "#06b6d4", icon: Scissors },
  { id: "carcass_hair", x: TRUNK_X - 100, y: 420, w: 200, h: 68, kind: "card", title: "带毛白条", sub: "PK: Hook_RFID = HK-00247", color: "#ef4444", icon: CircleDot },
  { id: "red_offal", x: TRUNK_X + 260, y: 310, w: 170, h: 64, kind: "stack", title: "红脏集合", sub: "心 / 肝 / 肺", color: "#ef4444", badge: "3" },
  { id: "white_offal", x: TRUNK_X + 260, y: 420, w: 170, h: 64, kind: "stack", title: "白脏集合", sub: "肠 / 胃", color: "#ef4444", badge: "2" },
  // Stage 3
  { id: "carcass_ok", x: TRUNK_X - 100, y: 570, w: 200, h: 68, kind: "card", title: "合格白条猪", sub: "✓ 检疫合格", color: "#ef4444", icon: ShieldCheck },
  { id: "carcass_chill", x: TRUNK_X - 100, y: 730, w: 200, h: 68, kind: "card", title: "排酸白条猪", sub: "冷耗 -2.1% · 已扣减", color: "#ef4444", icon: Snowflake },
  // Stage 4
  { id: "hub2", x: TRUNK_X - 110, y: 880, w: 220, h: 90, kind: "hub", title: "精细分割矩阵", sub: "双击展开 · 逆向 BOM", color: "#06b6d4", icon: Layers, badge: String(TOTAL_SKUS) },
  { id: "sku_pack", x: TRUNK_X - 100, y: 1020, w: 200, h: 70, kind: "stack", title: "分割肉块集合", sub: "PK: Meat_Tray_Barcode", color: "#ef4444", badge: String(TOTAL_SKUS), icon: Boxes },
  // Stage 5
  { id: "final_box", x: TRUNK_X - 100, y: 1190, w: 200, h: 74, kind: "final", title: "成品生鲜箱", sub: "PK: Box_QR_Code · 追溯码", color: "#ef4444", icon: QrCode },

  // Rules (blue) — left column
  { id: "r-welfare", x: 30, y: 230, w: 180, h: 52, kind: "rule", title: "动物福利规范", sub: "CO₂ 浓度 / 致昏时间", color: "#1e90ff", icon: FileText },
  { id: "r-vet", x: 30, y: 490, w: 180, h: 52, kind: "rule", title: "同步卫检规范", sub: "屠宰工艺标准 GB/T", color: "#1e90ff", icon: FileText },
  { id: "r-chill", x: 30, y: 670, w: 180, h: 52, kind: "rule", title: "排酸曲线标准", sub: "0-4°C · 24h 程序", color: "#1e90ff", icon: FileText },
  { id: "r-yield", x: 30, y: 870, w: 180, h: 52, kind: "rule", title: "标准出肉率模型", sub: "BOM · 分部位预期", color: "#1e90ff", icon: FileText },
  { id: "r-pack", x: 30, y: 1180, w: 180, h: 52, kind: "rule", title: "气调保鲜规范", sub: "O₂/N₂/CO₂ 比例", color: "#1e90ff", icon: FileText },

  // Processes (orange) — right column
  { id: "p-offal", x: CANVAS_W - 210, y: 500, w: 180, h: 52, kind: "process", title: "副产品处理工单", sub: "送红白脏车间", color: "#f59e0b", icon: FileText },
  { id: "p-chill", x: CANVAS_W - 210, y: 680, w: 180, h: 52, kind: "process", title: "冷库入库流转单", sub: "库位 / 批次 / 温控", color: "#f59e0b", icon: FileText },
];

type EdgeDef = {
  from: string; to: string;
  kind: "trunk" | "trunkSnow" | "fork" | "rule" | "process";
  label?: string;
  idRelay?: { from: string; to: string };
  fromSide?: "bottom" | "right" | "left" | "top";
  toSide?: "bottom" | "right" | "left" | "top";
};

const EDGES: EdgeDef[] = [
  { from: "batch", to: "pig", kind: "trunk", label: "静养与分群" },
  { from: "pig", to: "hub1", kind: "trunk", label: "致昏与放血" },
  { from: "hub1", to: "carcass_hair", kind: "trunk", label: "开膛去脏", idRelay: { from: "EarTag_ID", to: "Hook_RFID" } },
  { from: "hub1", to: "red_offal", kind: "fork", fromSide: "right", toSide: "left" },
  { from: "hub1", to: "white_offal", kind: "fork", fromSide: "right", toSide: "left" },
  { from: "carcass_hair", to: "carcass_ok", kind: "trunk", label: "烫毛打毛 · 劈半" },
  { from: "carcass_ok", to: "carcass_chill", kind: "trunkSnow", label: "排酸预冷 ❄" },
  { from: "carcass_chill", to: "hub2", kind: "trunk", label: "进分割矩阵" },
  { from: "hub2", to: "sku_pack", kind: "trunk", label: "1 : N 裂变", idRelay: { from: "Hook_RFID", to: "Meat_Tray_Barcode" } },
  { from: "sku_pack", to: "final_box", kind: "trunk", label: "气调封装 · 金检", idRelay: { from: "Meat_Tray_Barcode", to: "Box_QR_Code" } },

  { from: "r-welfare", to: "pig", kind: "rule", fromSide: "right", toSide: "left" },
  { from: "r-vet", to: "carcass_hair", kind: "rule", fromSide: "right", toSide: "left" },
  { from: "r-chill", to: "carcass_chill", kind: "rule", fromSide: "right", toSide: "left" },
  { from: "r-yield", to: "hub2", kind: "rule", fromSide: "right", toSide: "left" },
  { from: "r-pack", to: "final_box", kind: "rule", fromSide: "right", toSide: "left" },

  { from: "p-offal", to: "red_offal", kind: "process", fromSide: "left", toSide: "right" },
  { from: "p-chill", to: "carcass_chill", kind: "process", fromSide: "left", toSide: "right" },
];

function nodeAnchor(n: NodeDef, side: "top" | "bottom" | "left" | "right") {
  const cx = n.x + n.w / 2;
  const cy = n.y + n.h / 2;
  if (side === "top") return { x: cx, y: n.y };
  if (side === "bottom") return { x: cx, y: n.y + n.h };
  if (side === "left") return { x: n.x, y: cy };
  return { x: n.x + n.w, y: cy };
}

// --- Stages ---
const STAGES = [
  { id: 1, label: "阶段一 · 静养与致昏", hint: "活体最后阶段 · EarTag_ID 主导", y: 0, h: 260 },
  { id: 2, label: "阶段二 · 开膛去脏 · 1:3 分流枢纽", hint: "主线生成 Hook_RFID · 红白脏副线分流", y: 260, h: 290 },
  { id: 3, label: "阶段三 · 同步卫检与排酸", hint: "品质生死线 · 规范蓝线挂载", y: 550, h: 330 },
  { id: 4, label: "阶段四 · 精细分割 · 1:N 枢纽", hint: "Hook_RFID → Meat_Tray_Barcode · 双击下钻", y: 880, h: 310 },
  { id: 5, label: "阶段五 · 气调包装与出库", hint: "生成终端 Box_QR_Code 追溯码", y: 1190, h: 130 },
];

export function OntologyRelation() {
  const [diveOpen, setDiveOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ front: true, mid: true });
  const [massCheck, setMassCheck] = useState(true);
  const [carcassKg, setCarcassKg] = useState(100);
  const [lossPct, setLossPct] = useState(6);
  const [selectedSku, setSelectedSku] = useState<string | null>("sku10");
  const [simPlaying, setSimPlaying] = useState(true);
  const [dashTick, setDashTick] = useState(0);

  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!simPlaying) return;
    let last = performance.now();
    const step = (t: number) => {
      if (t - last > 60) {
        setDashTick((v) => (v + 1) % 10000);
        last = t;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [simPlaying]);

  const nodeMap = useMemo(() => {
    const m: Record<string, NodeDef> = {};
    NODES.forEach((n) => (m[n.id] = n));
    return m;
  }, []);

  const { totalPct, byproductKg, warnFlag } = useMemo(() => {
    const total = PARTS.reduce((a, p) => a + p.skus.reduce((s, sk) => s + sk.pct, 0), 0);
    const by = (carcassKg * lossPct) / 100;
    return { totalPct: total, byproductKg: by, warnFlag: lossPct > 8 };
  }, [carcassKg, lossPct]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">关系提取</h1>
          <p className="text-slate-400 text-sm mt-1">
            全工艺追溯蓝图 · 一图到底 · 标识符生命接力：EarTag → Hook → Tray → Box_QR
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSimPlaying((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-white"
            style={{ background: simPlaying ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#06b6d4,#0284c7)" }}
          >
            {simPlaying ? <Pause size={14} /> : <Play size={14} />}
            {simPlaying ? "暂停数据模拟" : "开启数据模拟"}
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-600 hover:text-cyan-600"
            style={{ background: "#f1f5f9", border: "1px solid #e5e7eb" }}>
            <Search size={14} /> 检索关系
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-white"
            style={{ background: "linear-gradient(135deg,#06b6d4,#0284c7)" }}>
            <Plus size={14} /> 新建关系
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { k: "工艺阶段", v: "5", sub: "从活体入厂到追溯码出厂", c: "#06b6d4", I: GitBranch },
          { k: "关系边数", v: `${EDGES.length}`, sub: "物理 / 规则 / 流程 三类", c: "#0ea5e9", I: Link2 },
          { k: "拆解枢纽", v: "2", sub: "1:3 开膛 · 1:N 分割", c: "#f59e0b", I: Scissors },
          { k: "ID 接力段", v: "4", sub: "EarTag → Hook → Tray → QR", c: "#ef4444", I: Tag },
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

      {/* Main canvas */}
      <div className="rounded-lg relative overflow-hidden" style={{ ...panel }}>
        {/* toolbar */}
        <div className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: "1px solid #e5e7eb", background: "#fafafa" }}>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Sparkles size={14} className="text-cyan-600" />
            主干关系画布 · 全工艺追溯蓝图
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <LegendDot color="#334155" label="物理流转主干" solid />
            <LegendDot color="#1e90ff" label="规范约束（蓝虚）" />
            <LegendDot color="#f59e0b" label="业务流程（橙虚）" />
            <LegendDot color="#94a3b8" label="1:N 副线分流" />
          </div>
        </div>

        <div className="relative overflow-auto" style={{ height: 780 }}>
          <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
            {/* grid bg */}
            <div className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "linear-gradient(#0000000a 1px,transparent 1px),linear-gradient(90deg,#0000000a 1px,transparent 1px)",
                backgroundSize: "24px 24px",
              }} />

            {/* stage bands */}
            {STAGES.map((s, i) => (
              <div key={s.id} className="absolute left-0 right-0"
                style={{ top: s.y, height: s.h, background: i % 2 ? "rgba(241,245,249,0.4)" : "rgba(248,250,252,0.25)" }}>
                <div className="absolute left-3 top-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] tabular-nums text-white"
                    style={{ background: "linear-gradient(135deg,#06b6d4,#0284c7)" }}>
                    STAGE {s.id}
                  </span>
                  <span className="text-xs text-slate-700">{s.label}</span>
                  <span className="text-[11px] text-slate-400">· {s.hint}</span>
                </div>
                {i < STAGES.length - 1 && (
                  <div className="absolute left-0 right-0 bottom-0 border-b border-dashed border-slate-200" />
                )}
              </div>
            ))}

            {/* ID chain rail — far left */}
            <div className="absolute" style={{ left: 240, top: 90, bottom: 40, width: 40 }}>
              <div className="relative w-full h-full">
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
                  style={{ background: "linear-gradient(to bottom,#ef4444 0%,#ef4444 18%,#06b6d4 22%,#06b6d4 58%,#f59e0b 62%,#f59e0b 82%,#10b981 86%,#10b981 100%)" }} />
                {[
                  { y: "8%", label: "EarTag_ID", c: "#ef4444", I: Tag },
                  { y: "33%", label: "Hook_RFID", c: "#06b6d4", I: CircleDot },
                  { y: "70%", label: "Meat_Tray_Barcode", c: "#f59e0b", I: Boxes },
                  { y: "93%", label: "Box_QR_Code", c: "#10b981", I: QrCode },
                ].map((s) => (
                  <div key={s.label} className="absolute -translate-y-1/2" style={{ top: s.y, left: "50%", transform: "translate(-50%,-50%)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                        style={{ background: s.c, boxShadow: `0 0 0 3px ${s.c}22` }}>
                        <s.I size={12} />
                      </div>
                      <span className="text-[11px] px-1.5 py-0.5 rounded whitespace-nowrap"
                        style={{ background: "#fff", border: `1px solid ${s.c}55`, color: s.c }}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SVG edges */}
            <svg className="absolute inset-0 pointer-events-none" width={CANVAS_W} height={CANVAS_H}>
              <defs>
                <linearGradient id="trunkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1f2937" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <filter id="trunkGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <marker id="arrTrunk" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill="#1f2937" />
                </marker>
                <marker id="arrFork" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill="#94a3b8" />
                </marker>
                <marker id="arrRule" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill="#1e90ff" />
                </marker>
                <marker id="arrProc" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill="#f59e0b" />
                </marker>
              </defs>

              {EDGES.map((e, i) => {
                const a = nodeMap[e.from];
                const b = nodeMap[e.to];
                if (!a || !b) return null;
                const fromSide = e.fromSide ?? "bottom";
                const toSide = e.toSide ?? "top";
                const p1 = nodeAnchor(a, fromSide);
                const p2 = nodeAnchor(b, toSide);
                const key = `${e.from}-${e.to}-${i}`;

                if (e.kind === "trunk" || e.kind === "trunkSnow") {
                  const midY = (p1.y + p2.y) / 2;
                  const d = `M ${p1.x} ${p1.y} C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;
                  return (
                    <g key={key}>
                      <path d={d} stroke="#1f2937" strokeWidth={4} fill="none" markerEnd="url(#arrTrunk)" />
                      {simPlaying && (
                        <path d={d} stroke="#06b6d4" strokeWidth={4} fill="none"
                          strokeDasharray="8 14" strokeDashoffset={-dashTick * 2}
                          opacity={0.75} filter="url(#trunkGlow)" />
                      )}
                    </g>
                  );
                }
                if (e.kind === "fork") {
                  const midX = (p1.x + p2.x) / 2;
                  const d = `M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
                  return (
                    <g key={key}>
                      <path d={d} stroke="#94a3b8" strokeWidth={2} fill="none" markerEnd="url(#arrFork)" />
                      {simPlaying && (
                        <circle r={3} fill="#f59e0b">
                          <animateMotion dur="2.6s" repeatCount="indefinite" path={d} />
                        </circle>
                      )}
                    </g>
                  );
                }
                if (e.kind === "rule") {
                  const midX = (p1.x + p2.x) / 2;
                  const d = `M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
                  return <path key={key} d={d} stroke="#1e90ff" strokeWidth={1.6} strokeDasharray="5 4" fill="none" markerEnd="url(#arrRule)" />;
                }
                if (e.kind === "process") {
                  const midX = (p1.x + p2.x) / 2;
                  const d = `M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
                  return <path key={key} d={d} stroke="#f59e0b" strokeWidth={1.6} strokeDasharray="4 4" fill="none" markerEnd="url(#arrProc)" />;
                }
                return null;
              })}

              {/* Edge labels + 🔗 relay markers */}
              {EDGES.filter((e) => e.kind === "trunk" || e.kind === "trunkSnow").map((e, i) => {
                const a = nodeMap[e.from];
                const b = nodeMap[e.to];
                if (!a || !b) return null;
                const p1 = nodeAnchor(a, "bottom");
                const p2 = nodeAnchor(b, "top");
                const mx = (p1.x + p2.x) / 2;
                const my = (p1.y + p2.y) / 2;
                return (
                  <g key={`lbl-${i}`}>
                    {e.label && (
                      <>
                        <rect x={mx - 52} y={my - 10} width={104} height={20} rx={10}
                          fill="#ffffff" stroke="#e5e7eb" />
                        <text x={mx} y={my + 4} textAnchor="middle" fontSize={11} fill="#334155">
                          {e.label}
                        </text>
                      </>
                    )}
                    {e.idRelay && (
                      <g>
                        <title>{`${e.idRelay.from} → ${e.idRelay.to}`}</title>
                        <circle cx={mx + 72} cy={my} r={10} fill="#fff7ed" stroke="#f59e0b" />
                        <text x={mx + 72} y={my + 4} textAnchor="middle" fontSize={11}>🔗</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {NODES.map((n) => (
              <NodeView key={n.id} n={n} onDive={n.id === "hub2" ? () => setDiveOpen(true) : undefined} />
            ))}
          </div>
        </div>

        {/* footer hints */}
        <div className="grid grid-cols-4 gap-3 px-5 py-3" style={{ borderTop: "1px solid #e5e7eb", background: "#fafafa" }}>
          {[
            { t: "🔗 ID 锁扣", d: "连线上出现即代表 PK 发生接力（EarTag→Hook→Tray→QR）" },
            { t: "⚪ 枢纽节点", d: "灰色圆环 = 拆解事件，承载工艺参数，避免连线爆炸" },
            { t: "❄ 雪花边", d: "排酸预冷段：扣减冷耗 2~3%，承接 Hook_RFID" },
            { t: "▶ 数据模拟", d: "开启后蓝色光点沿主干流淌，枢纽处自动分裂至副线" },
          ].map((x) => (
            <div key={x.t} className="text-xs">
              <div className="text-slate-800">{x.t}</div>
              <div className="text-slate-400 mt-0.5 leading-relaxed">{x.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cypher preview */}
      <div className="rounded-lg p-5" style={panel}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-slate-800 flex items-center gap-2">
            <GitBranch size={14} className="text-cyan-600" /> Neo4j Schema · 全链 ID 接力
          </div>
          <span className="text-xs text-slate-400">自动生成 · 只读</span>
        </div>
        <pre className="text-xs leading-6 rounded-md p-4 overflow-x-auto"
          style={{ background: "#0f172a", color: "#e2e8f0" }}>
{`(:LivePig {ear_tag:'P-20260420-0318'})
  -[:UNDERGOES]-> (:Event:Eviscerate {time:'13:42'})
  -[:PRODUCES {pk_relay:'EarTag_ID→Hook_RFID'}]->
(:Carcass {hook_rfid:'HK-00247'})
  -[:UNDERGOES {rule:'GB/T-卫检'}]-> (:Carcass {grade:'AAA', status:'PASS'})
  -[:CHILL {curve:'0-4°C/24h'}]-> (:Carcass {after_chill_kg: 97.9})
  -[:UNDERGOES]-> (:Event:Cutting)
  -[:PRODUCES {pk_relay:'Hook_RFID→Tray_Barcode'}]->
(:MeatTray)-[:PACK]->(:RetailBox {qr:'BOX-QR-...'})`}
        </pre>
      </div>

      {diveOpen && (
        <DiveInModal
          onClose={() => setDiveOpen(false)}
          expanded={expanded} setExpanded={setExpanded}
          massCheck={massCheck} setMassCheck={setMassCheck}
          carcassKg={carcassKg} setCarcassKg={setCarcassKg}
          lossPct={lossPct} setLossPct={setLossPct}
          totalPct={totalPct} byproductKg={byproductKg} warnFlag={warnFlag}
          selectedSku={selectedSku} setSelectedSku={setSelectedSku}
        />
      )}

      <style>{`
        @keyframes stackPulse { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-2px,-2px); } }
        @keyframes hubSpin { to { transform: rotate(360deg); } }
        @keyframes snowFall { 0% { transform: translateY(-4px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(10px); opacity: 0; } }
      `}</style>
    </div>
  );
}

// --- Node rendering ---
function NodeView({ n, onDive }: { n: NodeDef; onDive?: () => void }) {
  if (n.kind === "hub") {
    return (
      <button
        onClick={onDive}
        onDoubleClick={onDive}
        className="absolute group"
        style={{ left: n.x, top: n.y, width: n.w, height: n.h, cursor: onDive ? "pointer" : "default" }}
        title={onDive ? "双击下钻 · 逆向 BOM 映射台" : n.title}
      >
        <div className="relative w-full h-full">
          <div className="absolute inset-0 rounded-full"
            style={{
              background: "conic-gradient(from 0deg,#06b6d4,#0ea5e9,#06b6d4)",
              animation: "hubSpin 6s linear infinite", opacity: 0.28,
            }} />
          <div className="absolute inset-1 rounded-full flex items-center justify-center flex-col"
            style={{ background: "#ffffff", border: "2px solid #06b6d4" }}>
            {n.icon && <n.icon size={n.w > 100 ? 26 : 22} className="text-cyan-600" />}
            {n.badge && (
              <div className="absolute -top-1 -right-1 min-w-[26px] h-[22px] px-1 rounded-full text-white text-[11px] flex items-center justify-center tabular-nums"
                style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}>
                {n.badge}
              </div>
            )}
          </div>
          <div className="absolute left-1/2 -bottom-10 -translate-x-1/2 text-center whitespace-nowrap">
            <div className="text-xs text-slate-900">{n.title}</div>
            <div className="text-[10px] text-slate-400">{n.sub}</div>
          </div>
        </div>
      </button>
    );
  }

  if (n.kind === "rule" || n.kind === "process") {
    const c = n.color;
    return (
      <div className="absolute rounded-md px-3 py-2"
        style={{ left: n.x, top: n.y, width: n.w, height: n.h, background: n.kind === "rule" ? "#eff6ff" : "#fff7ed", border: `1px dashed ${c}88` }}>
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: c }}>
          {n.icon && <n.icon size={12} />}
          {n.title}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5 truncate">{n.sub}</div>
      </div>
    );
  }

  // stack / card / final
  return (
    <div className="absolute" style={{ left: n.x, top: n.y, width: n.w, height: n.h }}>
      {n.kind === "stack" &&
        [0, 1, 2].map((i) => (
          <div key={i} className="absolute rounded-lg"
            style={{
              width: n.w, height: n.h,
              top: -4 - i * 3, left: 4 + i * 3,
              background: "#ffffff", border: "1px solid #e5e7eb",
              opacity: 1 - i * 0.25,
            }} />
        ))}
      <div className="relative rounded-lg px-3 py-2 w-full h-full"
        style={{
          background: "#ffffff",
          border: `1px solid ${n.color}55`,
          boxShadow: `0 4px 14px ${n.color}1c`,
        }}>
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{ background: n.color }} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-900 text-sm">
            {n.icon && <n.icon size={13} style={{ color: n.color }} />}
            {n.title}
          </div>
          {n.kind === "final" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded text-white"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>终端</span>
          )}
        </div>
        {n.sub && <div className="text-[11px] text-slate-500 mt-1 truncate">{n.sub}</div>}
        {n.badge && (
          <div className="absolute -top-2 -right-2 min-w-[24px] h-6 px-1 rounded-full text-white text-[10px] flex items-center justify-center tabular-nums"
            style={{ background: "linear-gradient(135deg,#06b6d4,#0284c7)", animation: "stackPulse 2.4s ease-in-out infinite" }}>
            {n.badge}
          </div>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label, solid }: { color: string; label: string; solid?: boolean }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block w-5 h-0"
        style={{ borderTop: `2px ${solid ? "solid" : "dashed"} ${color}` }} />
      {label}
    </span>
  );
}

// --- Dive-in modal (unchanged) ---
type DiveProps = {
  onClose: () => void;
  expanded: Record<string, boolean>;
  setExpanded: (v: Record<string, boolean>) => void;
  massCheck: boolean; setMassCheck: (v: boolean) => void;
  carcassKg: number; setCarcassKg: (v: number) => void;
  lossPct: number; setLossPct: (v: number) => void;
  totalPct: number; byproductKg: number; warnFlag: boolean;
  selectedSku: string | null; setSelectedSku: (v: string | null) => void;
};

function DiveInModal(p: DiveProps) {
  const skuMass = (pct: number) => ((p.carcassKg * pct) / 100).toFixed(2);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
      onClick={p.onClose}>
      <div className="w-full max-w-6xl rounded-xl overflow-hidden flex flex-col"
        style={{ background: "#ffffff", maxHeight: "90vh", boxShadow: "0 30px 80px rgba(0,0,0,0.25)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3"
          style={{ background: "linear-gradient(135deg,#ecfeff,#f0f9ff)", borderBottom: "1px solid #e5e7eb" }}>
          <div>
            <div className="text-slate-900 text-sm flex items-center gap-2">
              <Layers size={14} className="text-cyan-600" />
              逆向 BOM 映射台 · 排酸白条猪 → 分割肉块
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              事件 CUT_20260420_0014 · 分割线-02 · 操作员 张三
            </div>
          </div>
          <button onClick={p.onClose} className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 px-4 py-4 overflow-auto"
            style={{ borderRight: "1px solid #e5e7eb", background: "#f8fafc" }}>
            <div className="text-xs text-slate-400 mb-2">母体源头</div>
            <div className="rounded-lg p-3" style={{ background: "#fff", border: "1px solid #fecaca" }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
                <span className="text-slate-900 text-sm">排酸白条猪</span>
              </div>
              <div className="mt-3 space-y-2 text-[11px]">
                <Row k="Hook_RFID" v="HK-00247" hi />
                <Row k="Ear_Tag_ID" v="P-20260420-0318" />
                <Row k="Weight_kg" v={`${p.carcassKg.toFixed(1)}`} />
                <Row k="Carcass_Grade" v="AAA" />
                <Row k="Chill_Temp_°C" v="3.8" />
              </div>
            </div>

            <div className="text-xs text-slate-400 mt-5 mb-2">关系规则配置</div>
            <div className="rounded-lg p-3 space-y-3" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs text-slate-700 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" /> 开启重量守恒校验
                </span>
                <Toggle on={p.massCheck} onChange={p.setMassCheck} />
              </label>
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>母体总重 (kg)</span>
                  <span className="tabular-nums text-slate-700">{p.carcassKg}</span>
                </div>
                <input type="range" min={60} max={130} value={p.carcassKg}
                  onChange={(e) => p.setCarcassKg(Number(e.target.value))} className="w-full accent-cyan-500" />
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>允许损耗 (%)</span>
                  <span className={`tabular-nums ${p.warnFlag ? "text-red-500" : "text-slate-700"}`}>{p.lossPct}</span>
                </div>
                <input type="range" min={2} max={15} value={p.lossPct}
                  onChange={(e) => p.setLossPct(Number(e.target.value))}
                  className={`w-full ${p.warnFlag ? "accent-red-500" : "accent-emerald-500"}`} />
              </div>
              <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                预估副产 / 损耗: <span className="text-slate-800 tabular-nums">{p.byproductKg.toFixed(2)} kg</span>
              </div>
            </div>

            <div className="mt-4 rounded-md p-3 text-[11px]" style={{ background: "#ecfeff", border: "1px solid #a5f3fc" }}>
              <div className="text-cyan-700 flex items-center gap-1 mb-1">
                <Link2 size={12} /> ID 映射
              </div>
              <div className="text-slate-600 leading-relaxed">
                母体 <b className="text-slate-800">Hook_RFID</b> 自动映射为所有子 SKU 的
                <b className="text-slate-800"> Parent_ID</b>，击鼓传花不丢链路。
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="sticky top-0 z-10 px-4 py-2 flex items-center gap-4 text-[11px] text-slate-500"
              style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
              <div className="w-64">裂变矩阵 · SKU</div>
              <div className="w-24 text-right">占比 (%)</div>
              <div className="w-24 text-right">预估质量 (kg)</div>
              <div className="w-28">SKU Code</div>
              <div className="flex-1">Parent_ID 映射</div>
              <div className="w-16 text-right">操作</div>
            </div>

            <div className="px-2 py-2">
              {PARTS.map((g) => {
                const open = !!p.expanded[g.id];
                const groupPct = g.skus.reduce((a, s) => a + s.pct, 0);
                return (
                  <div key={g.id} className="mb-1">
                    <button onClick={() => p.setExpanded({ ...p.expanded, [g.id]: !open })}
                      className="w-full flex items-center gap-4 px-2 py-2 rounded-md hover:bg-slate-50 text-left">
                      <div className="w-64 flex items-center gap-1 text-slate-800 text-sm">
                        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span>📂</span>
                        <span>{g.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1">占比预估 {g.pctEstimate}%</span>
                      </div>
                      <div className="w-24 text-right tabular-nums text-cyan-700 text-sm">{groupPct.toFixed(1)}</div>
                      <div className="w-24 text-right tabular-nums text-slate-600 text-sm">{((p.carcassKg * groupPct) / 100).toFixed(2)}</div>
                      <div className="w-28 text-xs text-slate-400">{g.skus.length} SKU</div>
                      <div className="flex-1" />
                      <div className="w-16" />
                    </button>
                    {open && (
                      <div className="border-l-2 border-cyan-100 ml-5">
                        {g.skus.map((s) => {
                          const sel = p.selectedSku === s.id;
                          return (
                            <div key={s.id} onClick={() => p.setSelectedSku(s.id)}
                              className={`flex items-center gap-4 px-4 py-2 cursor-pointer text-sm ${sel ? "bg-cyan-50" : "hover:bg-slate-50"}`}>
                              <div className="w-60 flex items-center gap-2 text-slate-800">
                                <span>🥩</span>
                                <span>{s.name}</span>
                              </div>
                              <div className="w-24 text-right tabular-nums text-slate-600">{s.pct.toFixed(1)}</div>
                              <div className="w-24 text-right tabular-nums text-slate-800">{skuMass(s.pct)}</div>
                              <div className="w-28 text-xs text-slate-500 tabular-nums">{s.code}</div>
                              <div className="flex-1">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px]"
                                  style={{ background: "#ecfeff", color: "#0e7490", border: "1px solid #a5f3fc" }}>
                                  <Link2 size={10} />
                                  母体 Hook_RFID → {s.parentIdField}
                                </div>
                              </div>
                              <div className="w-16 text-right">
                                <button className="text-slate-400 hover:text-cyan-600"><Settings2 size={13} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid #e5e7eb", background: "#f8fafc" }}>
          <div className="flex items-center gap-6 text-xs">
            <MassChip label="母体" value={`${p.carcassKg.toFixed(1)} kg`} color="#ef4444" />
            <span className="text-slate-300">=</span>
            <MassChip label="Σ SKU"
              value={`${((p.carcassKg * p.totalPct) / 100).toFixed(2)} kg (${p.totalPct.toFixed(1)}%)`} color="#06b6d4" />
            <span className="text-slate-300">+</span>
            <MassChip label="副产 / 损耗"
              value={`${p.byproductKg.toFixed(2)} kg (${p.lossPct}%)`} color={p.warnFlag ? "#ef4444" : "#10b981"} />
          </div>
          {p.warnFlag ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs"
              style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
              <AlertTriangle size={14} /> 损耗 {p.lossPct}% 超阈值 · 疑似切错 / 偷盗 / 过度切削
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs"
              style={{ background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}>
              <ShieldCheck size={14} /> 重量守恒通过 · 待保存关系生效
            </div>
          )}
        </div>

        <div className="px-5 py-3 flex items-center justify-end gap-2" style={{ borderTop: "1px solid #e5e7eb" }}>
          <button onClick={p.onClose} className="px-4 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-100">收起</button>
          <button className="px-4 py-1.5 rounded-md text-sm text-white"
            style={{ background: "linear-gradient(135deg,#06b6d4,#0284c7)" }}>
            保存并退回主干画布
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, hi }: { k: string; v: string; hi?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{k}</span>
      <span className={`tabular-nums ${hi ? "text-cyan-700" : "text-slate-700"}`}>{v}</span>
    </div>
  );
}
function MassChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-slate-400">{label}</span>
      <span className="tabular-nums text-slate-800">{value}</span>
    </div>
  );
}
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="relative w-9 h-5 rounded-full transition-colors"
      style={{ background: on ? "#06b6d4" : "#cbd5e1" }}>
      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: on ? 18 : 2 }} />
    </button>
  );
}
