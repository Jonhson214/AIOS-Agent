import { useEffect, useMemo, useRef, useState } from "react";
import {
  Beef,
  Package,
  ClipboardCheck,
  FileText,
  Box,
  Thermometer,
  Truck,
  Factory,
  Database,
  Server,
  Cpu,
  Cloud,
  Plus,
  Lock,
  Zap,
  Search,
  ChevronDown,
  ChevronRight,
  Link2,
  Trash2,
  Save,
  Play,
  X,
  Grid3x3,
  Gauge,
  Activity,
  Layers,
} from "lucide-react";

type Category = "entity" | "asset" | "process";

type LibItem = {
  k: string;
  label: string;
  cat: Category;
  I: typeof Beef;
  desc: string;
};

const LIB: LibItem[] = [
  // 物理实体 - 红
  { k: "e.pig", label: "活猪", cat: "entity", I: Beef, desc: "进厂生猪个体 · RFID 耳标" },
  { k: "e.carcass", label: "白条猪", cat: "entity", I: Box, desc: "屠宰后胴体 · 挂钩 RFID" },
  { k: "e.offal", label: "红白脏", cat: "entity", I: Package, desc: "同步卫检分流脏器" },
  { k: "e.cut", label: "分割肉块", cat: "entity", I: Layers, desc: "精细分割后肉品 SKU" },
  { k: "e.carton", label: "成品箱", cat: "entity", I: Package, desc: "真空/气调包装箱" },
  // 规范资产 - 蓝
  { k: "a.chill", label: "排酸曲线", cat: "asset", I: Thermometer, desc: "24h 温度/湿度标准曲线" },
  { k: "a.yield", label: "出肉率标准", cat: "asset", I: Gauge, desc: "品类出肉率阈值库" },
  { k: "a.inspect", label: "卫检规范", cat: "asset", I: ClipboardCheck, desc: "同步卫检判定规则" },
  { k: "a.pack", label: "包装规范", cat: "asset", I: Box, desc: "SKU 规格/净重标准" },
  // 管理流程 - 橙
  { k: "p.quarantine", label: "检疫证明", cat: "process", I: FileText, desc: "动物检疫合格证 A/B" },
  { k: "p.cutorder", label: "分割工单", cat: "process", I: FileText, desc: "胴体 → SKU 分割指令" },
  { k: "p.shipping", label: "出库单", cat: "process", I: Truck, desc: "冷链成品出库凭证" },
];

const CAT_META: Record<Category, { c: string; bg: string; label: string; dot: string }> = {
  entity: { c: "#ef4444", bg: "rgba(239,68,68,0.08)", label: "物理实体", dot: "#ef4444" },
  asset: { c: "#06b6d4", bg: "rgba(6,182,212,0.08)", label: "规范资产", dot: "#06b6d4" },
  process: { c: "#f59e0b", bg: "rgba(245,158,11,0.08)", label: "管理流程", dot: "#f59e0b" },
};

type DSStatus = "ok" | "warn";
type DataSource = {
  k: string;
  name: string;
  type: string;
  icon: typeof Server;
  status: DSStatus;
  fields: { name: string; type: string }[];
};

const DATA_SOURCES: DataSource[] = [
  {
    k: "mes.slaughter",
    name: "MES 屠宰系统",
    type: "Kafka · 实时",
    icon: Factory,
    status: "ok",
    fields: [
      { name: "MES.TrackScale.Weight", type: "DECIMAL(8,2)" },
      { name: "MES.TrackScale.HookID", type: "VARCHAR" },
      { name: "MES.Splitter.Speed", type: "INT" },
      { name: "MES.CarcassSplit.LineID", type: "VARCHAR" },
    ],
  },
  {
    k: "wms.cold",
    name: "WMS 冷链仓储",
    type: "PostgreSQL",
    icon: Cloud,
    status: "ok",
    fields: [
      { name: "WMS.Chill.RoomID", type: "VARCHAR" },
      { name: "WMS.Chill.Temp", type: "FLOAT" },
      { name: "WMS.Shipment.DocNo", type: "VARCHAR" },
    ],
  },
  {
    k: "scada.env",
    name: "SCADA 环控",
    type: "Modbus · IoT",
    icon: Cpu,
    status: "ok",
    fields: [
      { name: "SCADA.Room.Temp", type: "FLOAT" },
      { name: "SCADA.Room.Humidity", type: "FLOAT" },
      { name: "SCADA.Door.Status", type: "BOOL" },
    ],
  },
  {
    k: "erp.sap",
    name: "SAP ERP",
    type: "Oracle · CDC",
    icon: Database,
    status: "warn",
    fields: [
      { name: "ERP.Material.SKU", type: "VARCHAR" },
      { name: "ERP.BOM.FeedBatch", type: "VARCHAR" },
      { name: "ERP.Cost.Unit", type: "DECIMAL" },
    ],
  },
  {
    k: "gov.quarantine",
    name: "农业部检疫接口",
    type: "REST API",
    icon: Server,
    status: "ok",
    fields: [
      { name: "GOV.Quarantine.CertNo", type: "VARCHAR" },
      { name: "GOV.Quarantine.IssueDate", type: "DATE" },
    ],
  },
];

type AttrBinding = { source: string; field: string } | null;

type Attr = {
  id: string;
  name: string;
  type: string;
  pk?: boolean;
  fk?: boolean;
  binding: AttrBinding;
};

type Node = {
  id: string;
  libKey: string;
  x: number;
  y: number;
  attrs: Attr[];
  pkField?: string;
  fkField?: string;
  connectedSources: string[];
};

type EdgeKind = "relation" | "source" | "main" | "rule" | "process" | "fork";

type Edge = {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
  sourceKey?: string;
  label?: string;
  relay?: { from: string; to: string };
};

const CENTER_X = 520;

const INITIAL_NODES: Node[] = [
  // Stage 1 · 入场与初加工
  {
    id: "pig",
    libKey: "e.pig",
    x: CENTER_X - 110,
    y: 40,
    attrs: [
      { id: "a1", name: "耳标 ID", type: "VARCHAR", pk: true, binding: { source: "gov.quarantine", field: "GOV.Quarantine.CertNo" } },
      { id: "a2", name: "进厂重量", type: "DECIMAL", binding: null },
      { id: "a3", name: "养殖场", type: "VARCHAR", binding: null },
    ],
    pkField: "Pig_EarTag_ID",
    connectedSources: ["gov.quarantine"],
  },
  {
    id: "carcass",
    libKey: "e.carcass",
    x: CENTER_X - 260,
    y: 320,
    attrs: [
      { id: "a1", name: "当前重量", type: "DECIMAL", binding: { source: "mes.slaughter", field: "MES.TrackScale.Weight" } },
      { id: "a2", name: "瘦肉率", type: "FLOAT", binding: null },
      { id: "a3", name: "挂钩 RFID", type: "VARCHAR", pk: true, binding: { source: "mes.slaughter", field: "MES.TrackScale.HookID" } },
      { id: "a4", name: "上游耳标", type: "VARCHAR", fk: true, binding: null },
    ],
    pkField: "Hook_RFID",
    fkField: "Pig_EarTag_ID",
    connectedSources: ["mes.slaughter"],
  },
  {
    id: "offal",
    libKey: "e.offal",
    x: CENTER_X + 60,
    y: 320,
    attrs: [
      { id: "a1", name: "脏器托盘", type: "VARCHAR", pk: true, binding: null },
      { id: "a2", name: "脏器类别", type: "VARCHAR", binding: null },
      { id: "a3", name: "卫检结论", type: "VARCHAR", binding: null },
    ],
    pkField: "Offal_Tray_ID",
    fkField: "Pig_EarTag_ID",
    connectedSources: [],
  },
  // Stage 1 rules
  {
    id: "rule-inspect",
    libKey: "a.inspect",
    x: CENTER_X + 320,
    y: 160,
    attrs: [
      { id: "a1", name: "检疫项", type: "VARCHAR", binding: null },
      { id: "a2", name: "判定阈值", type: "VARCHAR", binding: null },
    ],
    connectedSources: [],
  },

  // Stage 2 · 排酸与温控
  {
    id: "rule-chill",
    libKey: "a.chill",
    x: CENTER_X - 460,
    y: 500,
    attrs: [
      { id: "a1", name: "目标温度", type: "FLOAT", binding: null },
      { id: "a2", name: "持续时长", type: "INT", binding: null },
      { id: "a3", name: "风速", type: "FLOAT", binding: null },
    ],
    connectedSources: [],
  },
  {
    id: "proc-chillorder",
    libKey: "p.shipping",
    x: CENTER_X + 80,
    y: 500,
    attrs: [
      { id: "a1", name: "入库单号", type: "VARCHAR", pk: true, binding: null },
      { id: "a2", name: "入库时间", type: "DATE", binding: null },
      { id: "a3", name: "冷耗", type: "DECIMAL", binding: null },
    ],
    connectedSources: ["wms.cold"],
  },

  // Stage 3 · 精细分割 (hub + SKUs)
  {
    id: "hub-split",
    libKey: "hub.split",
    x: CENTER_X - 40,
    y: 720,
    attrs: [],
    connectedSources: [],
  },
  {
    id: "rule-yield",
    libKey: "a.yield",
    x: CENTER_X - 360,
    y: 680,
    attrs: [
      { id: "a1", name: "品类", type: "VARCHAR", binding: null },
      { id: "a2", name: "出肉率阈值", type: "FLOAT", binding: null },
    ],
    connectedSources: [],
  },
  {
    id: "proc-cutorder",
    libKey: "p.cutorder",
    x: CENTER_X + 280,
    y: 680,
    attrs: [
      { id: "a1", name: "工单号", type: "VARCHAR", pk: true, binding: null },
      { id: "a2", name: "分割品类", type: "VARCHAR", binding: null },
      { id: "a3", name: "计划数量", type: "INT", binding: null },
    ],
    connectedSources: [],
  },
  {
    id: "sku-belly",
    libKey: "e.cut",
    x: CENTER_X - 380,
    y: 900,
    attrs: [
      { id: "a1", name: "肉筐条码", type: "VARCHAR", pk: true, binding: null },
      { id: "a2", name: "净重", type: "DECIMAL", binding: null },
      { id: "a3", name: "来源挂钩", type: "VARCHAR", fk: true, binding: null },
    ],
    pkField: "Meat_Tray_Barcode",
    fkField: "Hook_RFID",
    connectedSources: [],
  },
  {
    id: "sku-rib",
    libKey: "e.cut",
    x: CENTER_X - 140,
    y: 900,
    attrs: [
      { id: "a1", name: "肉筐条码", type: "VARCHAR", pk: true, binding: null },
      { id: "a2", name: "净重", type: "DECIMAL", binding: null },
      { id: "a3", name: "来源挂钩", type: "VARCHAR", fk: true, binding: null },
    ],
    pkField: "Meat_Tray_Barcode",
    fkField: "Hook_RFID",
    connectedSources: [],
  },
  {
    id: "sku-butt",
    libKey: "e.cut",
    x: CENTER_X + 100,
    y: 900,
    attrs: [
      { id: "a1", name: "肉筐条码", type: "VARCHAR", pk: true, binding: null },
      { id: "a2", name: "净重", type: "DECIMAL", binding: null },
      { id: "a3", name: "来源挂钩", type: "VARCHAR", fk: true, binding: null },
    ],
    pkField: "Meat_Tray_Barcode",
    fkField: "Hook_RFID",
    connectedSources: [],
  },
  {
    id: "sku-ham",
    libKey: "e.cut",
    x: CENTER_X + 340,
    y: 900,
    attrs: [
      { id: "a1", name: "肉筐条码", type: "VARCHAR", pk: true, binding: null },
      { id: "a2", name: "净重", type: "DECIMAL", binding: null },
      { id: "a3", name: "来源挂钩", type: "VARCHAR", fk: true, binding: null },
    ],
    pkField: "Meat_Tray_Barcode",
    fkField: "Hook_RFID",
    connectedSources: [],
  },

  // Stage 4 · 气调包装与入库
  {
    id: "carton",
    libKey: "e.carton",
    x: CENTER_X - 110,
    y: 1180,
    attrs: [
      { id: "a1", name: "追溯二维码", type: "VARCHAR", pk: true, binding: null },
      { id: "a2", name: "SKU 规格", type: "VARCHAR", binding: null },
      { id: "a3", name: "净重", type: "DECIMAL", binding: null },
      { id: "a4", name: "来源肉筐", type: "VARCHAR", fk: true, binding: null },
    ],
    pkField: "Box_QR_Code",
    fkField: "Meat_Tray_Barcode",
    connectedSources: ["wms.cold"],
  },
  {
    id: "rule-pack",
    libKey: "a.pack",
    x: CENTER_X + 260,
    y: 1120,
    attrs: [
      { id: "a1", name: "CO₂ / O₂ / N₂", type: "VARCHAR", binding: null },
      { id: "a2", name: "净重要求", type: "DECIMAL", binding: null },
    ],
    connectedSources: [],
  },
];

const INITIAL_EDGES: Edge[] = [
  // Stage 1 fork: pig -> carcass + offal
  { id: "e.pig-hub1", from: "pig", to: "carcass", kind: "main", label: "屠宰与开膛", relay: { from: "Pig_EarTag_ID", to: "Hook_RFID" } },
  { id: "e.pig-offal", from: "pig", to: "offal", kind: "fork", label: "分离脏器", relay: { from: "Pig_EarTag_ID", to: "Offal_Tray_ID" } },
  { id: "e.rule-inspect", from: "rule-inspect", to: "pig", kind: "rule" },

  // Stage 2
  { id: "e.chill-rule", from: "rule-chill", to: "carcass", kind: "rule" },
  { id: "e.chill-proc", from: "proc-chillorder", to: "carcass", kind: "process" },

  // Stage 3
  { id: "e.carcass-hub", from: "carcass", to: "hub-split", kind: "main", label: "精细分割", relay: { from: "Hook_RFID", to: "Meat_Tray_Barcode" } },
  { id: "e.hub-belly", from: "hub-split", to: "sku-belly", kind: "fork" },
  { id: "e.hub-rib", from: "hub-split", to: "sku-rib", kind: "fork" },
  { id: "e.hub-butt", from: "hub-split", to: "sku-butt", kind: "fork" },
  { id: "e.hub-ham", from: "hub-split", to: "sku-ham", kind: "fork" },
  { id: "e.rule-yield", from: "rule-yield", to: "hub-split", kind: "rule" },
  { id: "e.proc-cut", from: "proc-cutorder", to: "hub-split", kind: "process" },

  // Stage 4
  { id: "e.sku-carton1", from: "sku-belly", to: "carton", kind: "main", label: "气调包装", relay: { from: "Meat_Tray_Barcode", to: "Box_QR_Code" } },
  { id: "e.sku-carton2", from: "sku-rib", to: "carton", kind: "fork" },
  { id: "e.sku-carton3", from: "sku-butt", to: "carton", kind: "fork" },
  { id: "e.sku-carton4", from: "sku-ham", to: "carton", kind: "fork" },
  { id: "e.rule-pack", from: "rule-pack", to: "carton", kind: "rule" },

  // Data sources
  { id: "ds.mes", from: "ds:mes.slaughter", to: "carcass", kind: "source", sourceKey: "mes.slaughter" },
  { id: "ds.gov", from: "ds:gov.quarantine", to: "pig", kind: "source", sourceKey: "gov.quarantine" },
  { id: "ds.wms", from: "ds:wms.cold", to: "proc-chillorder", kind: "source", sourceKey: "wms.cold" },
];

const CARD_W = 220;
const CARD_H = 130;

export function OntologyDefinition() {
  const [openCat, setOpenCat] = useState<Record<Category, boolean>>({ entity: true, asset: true, process: false });
  const [filter, setFilter] = useState("");
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);
  const [selected, setSelected] = useState<string | null>("n2");
  const [ripple, setRipple] = useState<{ x: number; y: number; t: number } | null>(null);
  const [draggingLib, setDraggingLib] = useState<LibItem | null>(null);
  const [particleTick, setParticleTick] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragNode, setDragNode] = useState<{ id: string; dx: number; dy: number } | null>(null);

  useEffect(() => {
    const id = setInterval(() => setParticleTick((t) => (t + 1) % 1000), 80);
    return () => clearInterval(id);
  }, []);

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selected) ?? null, [nodes, selected]);

  function libItem(k: string): LibItem {
    const found = LIB.find((i) => i.k === k);
    if (found) return found;
    if (k === "hub.split")
      return { k: "hub.split", label: "分割集线器", cat: "entity", I: Layers, desc: "1:N 拆解节点" };
    return LIB[0];
  }

  function isHub(k: string) {
    return k.startsWith("hub.");
  }

  function onLibDragStart(it: LibItem) {
    setDraggingLib(it);
  }
  function onCanvasDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!draggingLib || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - CARD_W / 2;
    const y = e.clientY - rect.top - 24;
    const id = `n${Date.now()}`;
    setNodes((prev) => [
      ...prev,
      {
        id,
        libKey: draggingLib.k,
        x,
        y,
        attrs: [{ id: "a1", name: "ID", type: "VARCHAR", pk: true, binding: null }],
        connectedSources: [],
      },
    ]);
    setRipple({ x: x + CARD_W / 2, y: y + 24, t: Date.now() });
    setDraggingLib(null);
    setSelected(id);
    setTimeout(() => setRipple(null), 900);
  }
  function onCanvasDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function startNodeDrag(e: React.MouseEvent, n: Node) {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setDragNode({ id: n.id, dx: e.clientX - rect.left - n.x, dy: e.clientY - rect.top - n.y });
    setSelected(n.id);
  }
  useEffect(() => {
    if (!dragNode) return;
    const move = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setNodes((prev) =>
        prev.map((n) => (n.id === dragNode.id ? { ...n, x: Math.max(0, e.clientX - rect.left - dragNode.dx), y: Math.max(0, e.clientY - rect.top - dragNode.dy) } : n))
      );
    };
    const up = () => setDragNode(null);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragNode]);

  function addAttr() {
    if (!selected) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selected
          ? { ...n, attrs: [...n.attrs, { id: `a${Date.now()}`, name: "新字段", type: "VARCHAR", binding: null }] }
          : n
      )
    );
  }

  function updateAttr(attrId: string, patch: Partial<Attr>) {
    if (!selected) return;
    setNodes((prev) =>
      prev.map((n) => (n.id === selected ? { ...n, attrs: n.attrs.map((a) => (a.id === attrId ? { ...a, ...patch } : a)) } : n))
    );
  }

  function removeAttr(attrId: string) {
    if (!selected) return;
    setNodes((prev) => prev.map((n) => (n.id === selected ? { ...n, attrs: n.attrs.filter((a) => a.id !== attrId) } : n)));
  }

  function getPortPos(id: string, side: "top" | "bottom" | "center" = "center"): { x: number; y: number } {
    if (id.startsWith("ds:")) {
      const key = id.slice(3);
      const idx = DATA_SOURCES.findIndex((d) => d.k === key);
      return { x: 130 + idx * 172 + 80, y: 1420 };
    }
    const n = nodes.find((x) => x.id === id);
    if (!n) return { x: 0, y: 0 };
    if (isHub(n.libKey)) return { x: n.x + 40, y: n.y + 40 };
    if (side === "top") return { x: n.x + CARD_W / 2, y: n.y };
    if (side === "bottom") return { x: n.x + CARD_W / 2, y: n.y + CARD_H };
    return { x: n.x + CARD_W / 2, y: n.y + CARD_H / 2 };
  }

  const filtered = LIB.filter(
    (l) =>
      (filter === "" || l.label.includes(filter) || l.desc.includes(filter)) && openCat[l.cat]
  );

  return (
    <div
      className="flex flex-col -m-6 p-0"
      style={{ height: "calc(100vh - 56px)", background: "#f5f7fa" }}
    >
      <style>{`
        @keyframes dashflow { to { stroke-dashoffset: -24; } }
        @keyframes ripple { 0% { r: 0; opacity: 0.6 } 100% { r: 80; opacity: 0 } }
        @keyframes breathePulse { 0%,100% { opacity: 0.45; transform: scale(1) } 50% { opacity: 1; transform: scale(1.08) } }
        @keyframes floatY { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
        @keyframes spinSlow { to { transform: rotate(360deg) } }
        .edge-flow { stroke-dasharray: 8 6; animation: dashflow 1.2s linear infinite; }
        .lib-hover:hover .lib-icon { animation: floatY 1.6s ease-in-out infinite; }
        .ds-breathe { animation: breathePulse 2.2s ease-in-out infinite; }
        .glass { backdrop-filter: blur(10px); background: rgba(255,255,255,0.75); }
        .grid-bg { background-image: linear-gradient(rgba(6,182,212,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.08) 1px, transparent 1px); background-size: 32px 32px; }
      `}</style>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3" style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
        <div>
          <h1 className="text-slate-900 text-xl">本体定义 · Digital Twin Ontology Studio</h1>
          <p className="text-slate-400 text-xs mt-0.5">拖拽即建模 · 连线即集成 · 为牧原肉食数字孪生构建语义底座</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded text-xs" style={{ background: "#f1f5f9" }}>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" />物理实体</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500" />规范资产</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />管理流程</span>
          </div>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-slate-600 hover:bg-slate-100" style={{ border: "1px solid #e5e7eb" }}>
            <Play size={12} /> 验证
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-white" style={{ background: "linear-gradient(135deg,#06b6d4,#0ea5e9)" }}>
            <Save size={12} /> 保存版本
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT · Holographic Library */}
        <aside className="w-64 overflow-y-auto" style={{ background: "#ffffff", borderRight: "1px solid #e5e7eb" }}>
          <div className="p-3">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded mb-3" style={{ background: "#f1f5f9" }}>
              <Search size={12} className="text-slate-400" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="搜索实体..."
                className="bg-transparent outline-none text-xs flex-1 placeholder:text-slate-400"
              />
            </div>
            {(["entity", "asset", "process"] as Category[]).map((cat) => {
              const meta = CAT_META[cat];
              const items = filtered.filter((l) => l.cat === cat);
              const open = openCat[cat];
              return (
                <div key={cat} className="mb-3">
                  <button
                    onClick={() => setOpenCat((p) => ({ ...p, [cat]: !p[cat] }))}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-700 rounded hover:bg-slate-50"
                  >
                    {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
                    <span>{meta.label}</span>
                    <span className="ml-auto text-[10px] text-slate-400">{items.length}</span>
                  </button>
                  {open && (
                    <div className="mt-1 space-y-1.5">
                      {items.map((it) => (
                        <div
                          key={it.k}
                          draggable
                          onDragStart={() => onLibDragStart(it)}
                          onDragEnd={() => setDraggingLib(null)}
                          className="lib-hover p-2 rounded cursor-grab active:cursor-grabbing flex items-center gap-2 group"
                          style={{ background: meta.bg, border: `1px dashed ${meta.c}44` }}
                        >
                          <div
                            className="lib-icon w-7 h-7 rounded flex items-center justify-center shrink-0"
                            style={{ background: `${meta.c}22`, color: meta.c }}
                          >
                            <it.I size={13} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs text-slate-800 truncate">{it.label}</div>
                            <div className="text-[10px] text-slate-400 truncate">{it.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* CENTER · Canvas + Data Hub */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            ref={canvasRef}
            onDrop={onCanvasDrop}
            onDragOver={onCanvasDragOver}
            onClick={(e) => {
              if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === "svg") setSelected(null);
            }}
            className="relative flex-1 overflow-auto grid-bg"
            style={{ background: "#fafbfc" }}
          >
            {/* Stage bands (absolute backdrops) */}
            {[
              { y: 0, h: 300, label: "阶段一 · 入场与初加工", hint: "活体 → 白条 + 红白脏 · 1:2 拆解" },
              { y: 300, h: 330, label: "阶段二 · 排酸与温控", hint: "品质注入 · 0-4℃ 停留 12-24h" },
              { y: 630, h: 360, label: "阶段三 · 精细分割", hint: "1:N 拆解 · 逆向 BOM 核心" },
              { y: 990, h: 320, label: "阶段四 · 气调包装与入库", hint: "终点锁鲜 · Box_QR_Code" },
            ].map((s, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 pointer-events-none"
                style={{ top: s.y, height: s.h, minWidth: 1400 }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, ${i % 2 ? "rgba(6,182,212,0.025)" : "rgba(96,165,250,0.03)"}, transparent 90%)`,
                    borderTop: i === 0 ? "none" : "1px dashed rgba(6,182,212,0.25)",
                  }}
                />
                <div
                  className="absolute top-3 left-4 px-3 py-1 rounded-full text-[11px] flex items-center gap-1.5"
                  style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #e5e7eb", color: "#0891b2", backdropFilter: "blur(4px)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#06b6d4", boxShadow: "0 0 6px #06b6d4" }} />
                  {s.label}
                  <span className="text-slate-400 ml-1">· {s.hint}</span>
                </div>
              </div>
            ))}

            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: 1400, minHeight: 1500 }}>
              <defs>
                <linearGradient id="edgeR" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
                <linearGradient id="edgeMain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="edgeS" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <filter id="glowE">
                  <feGaussianBlur stdDeviation="1.5" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
                </marker>
              </defs>

              {/* relation edges (generic curves) */}
              {edges.filter((e) => e.kind === "relation").map((e) => {
                const a = getPortPos(e.from);
                const b = getPortPos(e.to);
                const midX = (a.x + b.x) / 2;
                return (
                  <g key={e.id}>
                    <path d={`M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`} stroke="url(#edgeR)" strokeWidth="2" fill="none" className="edge-flow" filter="url(#glowE)" />
                  </g>
                );
              })}

              {/* source edges from data hub (dashed, rising) */}
              {edges.filter((e) => e.kind === "source").map((e) => {
                const a = getPortPos(e.from);
                const b = getPortPos(e.to, "bottom");
                const midY = (a.y + b.y) / 2;
                return (
                  <path
                    key={e.id}
                    d={`M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`}
                    stroke="#10b981"
                    strokeDasharray="3 4"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                    fill="none"
                  />
                );
              })}

              {/* main trunk edges (animated packets + relay) */}
              {edges.filter((e) => e.kind === "main").map((e) => {
                const a = getPortPos(e.from, "bottom");
                const b = getPortPos(e.to, "top");
                const midY = (a.y + b.y) / 2;
                const d = `M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
                const packetLen = 60;
                const offset = ((particleTick * 3) % 100) - 10;
                return (
                  <g key={e.id}>
                    <path d={d} stroke="#1e293b" strokeWidth="2.5" fill="none" opacity="0.6" />
                    <path id={`p-${e.id}`} d={d} stroke="#06b6d4" strokeWidth="2" fill="none" strokeDasharray={`${packetLen} 400`} strokeDashoffset={-offset * 6} opacity="0.95" filter="url(#glowE)" />
                    {/* three flowing packets */}
                    {[0, 0.33, 0.66].map((frac, i) => {
                      const t = (((particleTick / 40) + frac) % 1);
                      return (
                        <circle key={i} r="3.5" fill="#06b6d4" filter="url(#glowE)">
                          <animateMotion dur="0s" repeatCount="1" />
                        </circle>
                      );
                    })}
                    {/* label pill */}
                    {e.label && (
                      <g>
                        <rect x={(a.x + b.x) / 2 - 40} y={midY - 12} width="80" height="20" rx="10" fill="#ffffff" stroke="#06b6d4" strokeOpacity="0.6" />
                        <text x={(a.x + b.x) / 2} y={midY + 2} textAnchor="middle" fontSize="11" fill="#0891b2">{e.label}</text>
                      </g>
                    )}
                    {/* id relay chain icon */}
                    {e.relay && (
                      <g>
                        <title>{`${e.relay.from}  →  ${e.relay.to}`}</title>
                        <circle cx={(a.x + b.x) / 2} cy={midY + 28} r="10" fill="#fef3c7" stroke="#f59e0b" />
                        <text x={(a.x + b.x) / 2} y={midY + 32} textAnchor="middle" fontSize="11">🔗</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* fork edges (tree branching, solid but lighter) */}
              {edges.filter((e) => e.kind === "fork").map((e) => {
                const fromNode = nodes.find((n) => n.id === e.from);
                const toNode = nodes.find((n) => n.id === e.to);
                if (!fromNode || !toNode) return null;
                const a = isHub(fromNode.libKey)
                  ? { x: fromNode.x + 40, y: fromNode.y + 80 }
                  : getPortPos(e.from, "bottom");
                const b = isHub(toNode.libKey)
                  ? { x: toNode.x + 40, y: toNode.y }
                  : getPortPos(e.to, "top");
                const midY = (a.y + b.y) / 2;
                return (
                  <g key={e.id}>
                    <path
                      d={`M ${a.x} ${a.y} C ${a.x} ${midY + 20}, ${b.x} ${midY - 20}, ${b.x} ${b.y}`}
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    {/* flowing packet */}
                    <circle r="2.5" fill="#06b6d4" opacity="0.85">
                      <animateMotion dur="3s" repeatCount="indefinite" path={`M ${a.x} ${a.y} C ${a.x} ${midY + 20}, ${b.x} ${midY - 20}, ${b.x} ${b.y}`} />
                    </circle>
                  </g>
                );
              })}

              {/* rule edges (blue dashed, from spec -> target) */}
              {edges.filter((e) => e.kind === "rule").map((e) => {
                const a = getPortPos(e.from);
                const b = getPortPos(e.to);
                return (
                  <g key={e.id}>
                    <path d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="5 4" fill="none" opacity="0.55" />
                    <circle cx={b.x} cy={b.y} r="3" fill="#06b6d4" opacity="0.7" />
                  </g>
                );
              })}

              {/* process edges (orange dashed) */}
              {edges.filter((e) => e.kind === "process").map((e) => {
                const a = getPortPos(e.from);
                const b = getPortPos(e.to);
                return (
                  <g key={e.id}>
                    <path d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.6" />
                    <circle cx={b.x} cy={b.y} r="3" fill="#f59e0b" opacity="0.7" />
                  </g>
                );
              })}

              {/* ripple */}
              {ripple && (
                <circle cx={ripple.x} cy={ripple.y} r={((Date.now() - ripple.t) / 10) % 80} fill="none" stroke="#06b6d4" strokeWidth="2" opacity={0.6 - (((Date.now() - ripple.t) / 900)) * 0.6} />
              )}
            </svg>

            {/* Nodes */}
            {nodes.map((n) => {
              const it = libItem(n.libKey);
              const meta = CAT_META[it.cat];
              const isSel = selected === n.id;
              return (
                <div
                  key={n.id}
                  onMouseDown={(e) => startNodeDrag(e, n)}
                  className="absolute select-none"
                  style={{
                    left: n.x,
                    top: n.y,
                    width: CARD_W,
                    cursor: dragNode?.id === n.id ? "grabbing" : "grab",
                  }}
                >
                  <div
                    className="rounded-lg overflow-hidden relative"
                    style={{
                      background: "rgba(255,255,255,0.92)",
                      backdropFilter: "blur(8px)",
                      border: `1.5px solid ${isSel ? meta.c : meta.c + "55"}`,
                      boxShadow: isSel ? `0 0 0 3px ${meta.c}22, 0 8px 24px ${meta.c}22` : `0 2px 8px rgba(15,23,42,0.06)`,
                      transition: "box-shadow 200ms",
                    }}
                  >
                    <div
                      className="flex items-center gap-2 px-3 py-2"
                      style={{ background: `linear-gradient(90deg, ${meta.c}1F, transparent)`, borderBottom: `1px solid ${meta.c}33` }}
                    >
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                        style={{ background: `${meta.c}22`, color: meta.c }}
                      >
                        <it.I size={13} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-slate-900">{it.label}</div>
                        <div className="text-[10px]" style={{ color: meta.c }}>{meta.label}</div>
                      </div>
                      {n.connectedSources.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                          <Activity size={9} />{n.connectedSources.length}
                        </span>
                      )}
                    </div>
                    <div className="px-3 py-2 space-y-1">
                      {n.attrs.slice(0, 4).map((a) => (
                        <div key={a.id} className="flex items-center gap-1.5 text-[11px]">
                          {a.pk && <Lock size={9} className="text-amber-500" />}
                          {a.fk && <Link2 size={9} className="text-cyan-500" />}
                          <span className="text-slate-700 truncate flex-1">{a.name}</span>
                          <span className="text-[9px] text-slate-400">{a.type}</span>
                          {a.binding && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        </div>
                      ))}
                      {n.attrs.length > 4 && <div className="text-[10px] text-slate-400">+{n.attrs.length - 4} more</div>}
                    </div>
                    {n.pkField && (
                      <div className="px-3 py-1.5 text-[10px] flex items-center gap-1" style={{ background: "#f8fafc", borderTop: "1px dashed #e5e7eb" }}>
                        <Lock size={9} className="text-amber-500" />
                        <span className="text-slate-500">PK</span>
                        <span className="text-slate-700 font-mono">{n.pkField}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Data Source Hub */}
          <div className="px-4 py-3 relative" style={{ background: "#ffffff", borderTop: "1px solid #e5e7eb" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-700 flex items-center gap-1.5">
                <Zap size={12} className="text-cyan-500" />
                系统连接池 · Data Source Hub
              </div>
              <div className="text-[11px] text-slate-400">拖拽系统到画布节点以建立数据挂载</div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {DATA_SOURCES.map((ds) => {
                const active = nodes.some((n) => n.connectedSources.includes(ds.k));
                const ok = ds.status === "ok";
                return (
                  <div
                    key={ds.k}
                    className="relative shrink-0 rounded-md p-3 flex items-center gap-3"
                    style={{
                      width: 200,
                      background: "#f8fafc",
                      border: `1px solid ${ok ? "#10b98133" : "#f59e0b55"}`,
                    }}
                  >
                    {active && (
                      <span
                        className="absolute -top-1 -right-1 ds-breathe w-3 h-3 rounded-full"
                        style={{ background: "#10b981", boxShadow: "0 0 8px #10b981" }}
                      />
                    )}
                    <div
                      className="w-9 h-9 rounded flex items-center justify-center shrink-0"
                      style={{ background: ok ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: ok ? "#10b981" : "#f59e0b" }}
                    >
                      <ds.icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-slate-800 truncate">{ds.name}</div>
                      <div className="text-[10px] text-slate-400">{ds.type}</div>
                    </div>
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: ok ? "#10b981" : "#f59e0b", boxShadow: `0 0 6px ${ok ? "#10b981" : "#f59e0b"}` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT · Inspector */}
        <aside
          className="w-80 overflow-y-auto"
          style={{ background: "#ffffff", borderLeft: "1px solid #e5e7eb" }}
        >
          {selectedNode ? (
            <InspectorPanel
              node={selectedNode}
              libItem={libItem(selectedNode.libKey)}
              onAddAttr={addAttr}
              onUpdateAttr={updateAttr}
              onRemoveAttr={removeAttr}
            />
          ) : (
            <div className="p-6 text-center text-slate-400 text-sm mt-10">
              <Grid3x3 size={32} className="mx-auto mb-3 text-slate-300" />
              在画布上选中一个实体<br />或从左侧拖拽新建
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function InspectorPanel({
  node,
  libItem,
  onAddAttr,
  onUpdateAttr,
  onRemoveAttr,
}: {
  node: Node;
  libItem: LibItem;
  onAddAttr: () => void;
  onUpdateAttr: (id: string, patch: Partial<Attr>) => void;
  onRemoveAttr: (id: string) => void;
}) {
  const meta = CAT_META[libItem.cat];
  return (
    <div>
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background: `${meta.c}22`, color: meta.c }}>
            <libItem.I size={16} />
          </div>
          <div>
            <div className="text-slate-900 text-sm">{libItem.label}</div>
            <div className="text-[11px]" style={{ color: meta.c }}>属性与灵魂注入舱 · Inspector</div>
          </div>
        </div>
      </div>

      {/* ID Relay Switch */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-1.5 text-xs text-slate-700 mb-2">
          <Lock size={12} className="text-amber-500" />
          ID 血缘转换枢纽 · Relay Switch
        </div>
        <div className="space-y-2">
          <div className="p-2.5 rounded flex items-center gap-2" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
            <Lock size={11} className="text-amber-500" />
            <div className="flex-1">
              <div className="text-[10px] text-slate-400">当前主键 PK</div>
              <div className="text-xs text-slate-800 font-mono">{node.pkField ?? "—"}</div>
            </div>
            <ChevronDown size={11} className="text-slate-400" />
          </div>
          <div className="p-2.5 rounded flex items-center gap-2" style={{ background: "#ecfeff", border: "1px solid #a5f3fc" }}>
            <Link2 size={11} className="text-cyan-500" />
            <div className="flex-1">
              <div className="text-[10px] text-slate-400">上游溯源 FK</div>
              <div className="text-xs text-slate-800 font-mono">{node.fkField ?? "—"}</div>
            </div>
            <ChevronDown size={11} className="text-slate-400" />
          </div>
        </div>
      </div>

      {/* Attributes */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-slate-700">属性定义 · Attributes</div>
          <button onClick={onAddAttr} className="flex items-center gap-1 text-[11px] text-cyan-600 hover:text-cyan-700">
            <Plus size={10} /> 新增
          </button>
        </div>
        <div className="space-y-2">
          {node.attrs.map((a) => (
            <div key={a.id} className="p-2.5 rounded group" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
              <div className="flex items-center gap-1.5">
                {a.pk && <Lock size={10} className="text-amber-500" />}
                {a.fk && <Link2 size={10} className="text-cyan-500" />}
                <input
                  value={a.name}
                  onChange={(e) => onUpdateAttr(a.id, { name: e.target.value })}
                  className="text-xs text-slate-800 bg-transparent outline-none flex-1"
                />
                <select
                  value={a.type}
                  onChange={(e) => onUpdateAttr(a.id, { type: e.target.value })}
                  className="text-[10px] text-slate-500 bg-transparent outline-none"
                >
                  <option>VARCHAR</option>
                  <option>DECIMAL</option>
                  <option>FLOAT</option>
                  <option>INT</option>
                  <option>BOOL</option>
                  <option>DATE</option>
                </select>
                <button
                  onClick={() => onRemoveAttr(a.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500"
                >
                  <Trash2 size={11} />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                {a.binding ? (
                  <div className="flex-1 flex items-center gap-1 px-2 py-1 rounded" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="font-mono truncate">{a.binding.field}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onUpdateAttr(a.id, { binding: { source: "mes.slaughter", field: "MES.TrackScale.Weight" } })}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-cyan-600"
                    style={{ border: "1px dashed #cbd5e1" }}
                  >
                    <Link2 size={10} />
                    绑定数据源字段
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data mounts */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-1.5 text-xs text-slate-700 mb-2">
          <Activity size={12} className="text-cyan-500" />
          数据挂载 · Data Mounts
        </div>
        <div className="space-y-1.5">
          {node.connectedSources.length === 0 && (
            <div className="text-[11px] text-slate-400 py-2 text-center" style={{ border: "1px dashed #e5e7eb", borderRadius: 6 }}>
              尚未挂载底层系统
            </div>
          )}
          {node.connectedSources.map((sk) => {
            const ds = DATA_SOURCES.find((d) => d.k === sk);
            if (!ds) return null;
            return (
              <div key={sk} className="p-2 rounded flex items-center gap-2" style={{ background: "#ecfeff", border: "1px solid #a5f3fc" }}>
                <ds.icon size={12} className="text-cyan-600" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-800 truncate">{ds.name}</div>
                  <div className="text-[10px] text-slate-400">{ds.type}</div>
                </div>
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-70" />
                  <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
