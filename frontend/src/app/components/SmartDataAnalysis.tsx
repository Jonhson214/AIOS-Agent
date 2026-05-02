import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ScatterChart,
  Scatter,
} from "recharts";
import { useNl2sqlEmbedded } from "../../integrations/useNl2sqlEmbedded";
import type { ChartConfig, TableData } from "../../integrations/useNl2sqlEmbedded";
import {
  Plus, Mic, Send, Search, MessageSquare, FileDown, Code, Image as ImageIcon,
  Sliders, ChevronRight, Paperclip, User, Bot, Clock, Activity, FileText,
  Terminal, Database, BarChart3, ScatterChart as ScatterPlotIcon, RefreshCw, Copy, ExternalLink,
  CheckCircle2, AlertCircle, Info, Hash, Trash2, Star, Filter
} from "lucide-react";

/* ────────────────── academic-style palette ──────────────────
   纯白 #FFFFFF · 极客灰 #F5F7FA · 边框 #E4E7ED · 学术蓝 #1890FF
   文本 主 #303133 次 #606266 三 #909399 占位 #C0C4CC
*/

const HISTORY = [
  { date: "2026-04-21", items: [
    { id: "c1", title: "3 号冷库温度波动分析", turns: 4, active: true },
    { id: "c2", title: "A 线出肉率异常排查", turns: 7 },
  ]},
  { date: "2026-04-20", items: [
    { id: "c3", title: "4月20日 A线出肉率分析", turns: 12 },
    { id: "c4", title: "猪胴体缺陷识别测试 (N=40)", turns: 6 },
    { id: "c5", title: "李家洼 vs 王家农场 PSE 对比", turns: 5 },
  ]},
  { date: "2026-04-19", items: [
    { id: "c6", title: "宰前静息时间 ~ pH 相关性", turns: 9 },
    { id: "c7", title: "HACCP CCP-3 偏离统计", turns: 3 },
  ]},
];

const QUICK_PROMPTS = [
  "生成昨日产能日报",
  "对比本周各供应商良品率",
  "排酸间温度预警查询",
  "近 30 天 PSE 肉趋势",
  "导出本月 HACCP 偏离清单",
];

const DATASETS = [
  { name: "pig_farms.csv", size: "1.2 MB", rows: "8,420 行" },
  { name: "haccp_log_2026q1.parquet", size: "12 MB", rows: "—" },
];

/* hourly temperature series */
const TEMP = [
  2.1, 2.0, 2.2, 2.1, 2.3, 2.2, 2.4, 2.3, 2.5, 2.8, 3.4, 4.6,
  3.2, 2.6, 2.4, 2.3, 2.2, 2.1, 2.0, 2.1, 2.3, 2.5, 2.4, 2.2,
];
const HUMID = [
  86, 85, 87, 86, 85, 84, 86, 85, 84, 83, 81, 78, 80, 83, 85, 86, 87, 88, 87, 86, 85, 84, 85, 86,
];

const NL2SQL_CHART_COLORS = ["#1890FF", "#67C23A", "#E6A23C", "#F56C6C", "#909399"];

function Nl2sqlDynamicChart({ config }: { config: ChartConfig }) {
  const title = config.title || "NL2SQL 图表";
  const rows =
    config.data?.map((d) => ({
      name: String(d.name),
      value: typeof d.value === "number" ? d.value : Number(d.value) || 0,
    })) ?? [];

  if (config.type === "line") {
    return (
      <div className="eu-border rounded" style={{ background: "#fff", padding: 12 }}>
        <div className="text-[12px] mb-2">{title}</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#1890FF" dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (config.type === "pie") {
    return (
      <div className="eu-border rounded" style={{ background: "#fff", padding: 12 }}>
        <div className="text-[12px] mb-2">{title}</div>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {rows.map((_, i) => (
                <Cell key={i} fill={NL2SQL_CHART_COLORS[i % NL2SQL_CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (config.type === "scatter") {
    return (
      <div className="eu-border rounded" style={{ background: "#fff", padding: 12 }}>
        <div className="text-[12px] mb-2">{title}</div>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" type="category" name="x" />
            <YAxis dataKey="value" type="number" name="y" />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter name={title} data={rows} fill="#1890FF" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="eu-border rounded" style={{ background: "#fff", padding: 12 }}>
      <div className="text-[12px] mb-2">{title}</div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#1890FF" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatMsgTime(iso?: string) {
  if (!iso) return "--:--:--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(11, 19);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function Nl2sqlTablePreview({ data }: { data: TableData }) {
  const raw =
    data.raw?.length ? data.raw : data.rows?.map((r) => [r.name, r.value]) ?? [];
  const columns =
    data.columns?.length ? data.columns : raw[0] ? ["name", "value"] : [];
  if (!raw.length) {
    return <div className="text-[12px]" style={{ color: "#909399" }}>暂无表格行</div>;
  }
  const colCount = Math.max(columns.length, raw[0]?.length ?? 0);
  return (
    <div className="eu-border rounded overflow-auto" style={{ maxHeight: 360 }}>
      <table className="w-full text-[12px]" style={{ color: "#303133" }}>
        <thead>
          <tr style={{ background: "#FAFAFA", color: "#909399" }}>
            {Array.from({ length: colCount }).map((_, i) => (
              <th key={i} className="text-left px-3 py-2 font-normal" style={{ borderBottom: "1px solid #E4E7ED" }}>
                {columns[i] ?? `col${i}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {raw.slice(0, 200).map((row, ri) => (
            <tr key={ri} style={{ borderBottom: "1px solid #F0F2F5" }}>
              {Array.from({ length: colCount }).map((_, ci) => (
                <td key={ci} className="px-3 py-1.5 font-mono" style={{ color: "#606266" }}>
                  {row[ci] !== undefined && row[ci] !== null ? String(row[ci]) : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SmartDataAnalysis() {
  const nl2sql = useNl2sqlEmbedded();
  const [demoActiveId, setDemoActiveId] = useState("c1");
  const [input, setInput] = useState("");
  const [threshold, setThreshold] = useState(4.0);
  const [showJson, setShowJson] = useState(false);
  const [canvasTab, setCanvasTab] = useState<"chart" | "table" | "code">("chart");

  const sessionBlocks = useMemo(() => {
    if (nl2sql.sessions.length > 0) {
      const map: Record<string, { id: string; title: string; turns: number }[]> = {};
      for (const s of nl2sql.sessions) {
        const d = s.created_at?.slice(0, 10) || "—";
        (map[d] ??= []).push({ id: s.id, title: s.title, turns: s.message_count });
      }
      return Object.entries(map).map(([date, items]) => ({ date, items }));
    }
    return HISTORY;
  }, [nl2sql.sessions]);

  const sendNl2sql = () => {
    const t = input.trim();
    if (!t || nl2sql.isStreaming) return;
    void nl2sql.sendMessage(t);
    setInput("");
  };

  return (
    <div className="h-full w-full overflow-hidden flex" style={{ background: "#ffffff", color: "#303133", fontFamily: '-apple-system, "PingFang SC", "Helvetica Neue", Arial, sans-serif' }}>
      <style>{`
        .eu-border { border: 1px solid #E4E7ED; }
        .eu-btn {
          height: 32px; padding: 0 12px; display:inline-flex; align-items:center; gap:6px;
          border:1px solid #DCDFE6; background:#ffffff; color:#606266; font-size:12px;
          border-radius:3px; cursor:pointer; transition:all .15s;
        }
        .eu-btn:hover { border-color:#1890FF; color:#1890FF; }
        .eu-btn-primary {
          height:32px; padding:0 14px; display:inline-flex; align-items:center; gap:6px;
          background:#1890FF; color:#fff; font-size:12px; border:1px solid #1890FF; border-radius:3px; cursor:pointer;
        }
        .eu-btn-primary:hover { background:#40A9FF; border-color:#40A9FF; }
        .eu-input {
          height:32px; padding:0 10px; border:1px solid #DCDFE6; border-radius:3px;
          font-size:12px; color:#303133; background:#fff; outline:none;
        }
        .eu-input:focus { border-color:#1890FF; }
        .eu-tag {
          display:inline-flex; align-items:center; padding:0 6px; height:18px; font-size:11px;
          background:#ECF5FF; color:#1890FF; border:1px solid #D9ECFF; border-radius:2px;
        }
        .eu-tag.gray { background:#F4F4F5; color:#909399; border-color:#E9E9EB; }
        .eu-tag.green { background:#F0F9EB; color:#67C23A; border-color:#E1F3D8; }
        .eu-tag.red { background:#FEF0F0; color:#F56C6C; border-color:#FDE2E2; }
        .eu-tag.orange { background:#FDF6EC; color:#E6A23C; border-color:#FAECD8; }
        .eu-section-title { font-size:13px; color:#303133; padding:10px 16px; border-bottom:1px solid #E4E7ED; display:flex; align-items:center; gap:6px; background:#FAFAFA; }
        .eu-divider { height:1px; background:#E4E7ED; }
        input[type=range].eu-slider { -webkit-appearance:none; height:3px; background:#E4E7ED; border-radius:3px; outline:none; }
        input[type=range].eu-slider::-webkit-slider-thumb {
          -webkit-appearance:none; width:14px; height:14px; background:#fff; border:2px solid #1890FF; border-radius:50%; cursor:pointer;
          transition: transform .12s ease, box-shadow .12s ease;
        }
        input[type=range].eu-slider::-webkit-slider-thumb:hover { transform: scale(1.18); box-shadow: 0 0 0 4px rgba(24,144,255,.14); }
        input[type=range].eu-slider:active::-webkit-slider-thumb { transform: scale(1.25); }
        @keyframes eu-fadein { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
        @keyframes eu-blink { 0%,100% { opacity: 1; } 50% { opacity: .3; } }
        @keyframes eu-stream { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes eu-dash { to { stroke-dashoffset: 0; } }
        @keyframes eu-pop { 0% { transform: scale(.6); opacity: 0; } 70% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); } }
        @keyframes eu-spin { to { transform: rotate(360deg); } }
        @keyframes eu-sweep { 0% { left: -30%; } 100% { left: 110%; } }
        .eu-msg { animation: eu-fadein .3s ease both; }
        .eu-cot-step { animation: eu-stream .32s ease both; }
        .eu-cot-step:nth-child(1) { animation-delay: 0s; }
        .eu-cot-step:nth-child(2) { animation-delay: .12s; }
        .eu-cot-step:nth-child(3) { animation-delay: .24s; }
        .eu-cot-step:nth-child(4) { animation-delay: .36s; }
        .eu-chart-line { stroke-dasharray: 800; stroke-dashoffset: 800; animation: eu-dash 1.4s ease-out forwards; }
        .eu-chart-dot { animation: eu-pop .35s ease both; transform-origin: center; }
        .eu-live { animation: eu-blink 1.4s infinite; }
        .eu-spin { animation: eu-spin 1.1s linear infinite; }
        .eu-btn, .eu-btn-primary { transition: background .15s, border-color .15s, color .15s, transform .1s; }
        .eu-btn:active, .eu-btn-primary:active { transform: scale(.97); }
        .eu-loading-bar { position: relative; overflow: hidden; background:#F5F7FA; height:2px; border-radius:2px; }
        .eu-loading-bar::after { content:""; position:absolute; top:0; bottom:0; width:28%; background: linear-gradient(90deg, transparent, #1890FF, transparent); animation: eu-sweep 1.3s infinite linear; }
        tr[data-anom="1"] { transition: background .2s; }
        tr[data-anom="1"]:hover { background:#FEE3E3 !important; }
      `}</style>

      {/* ═══════ LEFT: history + quick prompts ═══════ */}
      <aside className="shrink-0 flex flex-col" style={{ width: "20%", minWidth: 220, borderRight: "1px solid #E4E7ED", background: "#FAFAFA" }}>
        {/* title + new */}
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid #E4E7ED", background: "#fff" }}>
          <MessageSquare className="w-4 h-4" style={{ color: "#1890FF" }} />
          <span className="text-[13px]">会话</span>
          <button
            type="button"
            className="ml-auto eu-btn"
            style={{ height: 26, padding: "0 8px", fontSize: 11 }}
            onClick={() => void nl2sql.createSession()}
          >
            <Plus className="w-3 h-3" /> 新建
          </button>
        </div>

        {/* search */}
        <div className="px-3 py-2" style={{ borderBottom: "1px solid #E4E7ED" }}>
          <div className="flex items-center gap-1.5 px-2 rounded" style={{ border: "1px solid #DCDFE6", background: "#fff", height: 28 }}>
            <Search className="w-3 h-3" style={{ color: "#C0C4CC" }} />
            <input placeholder="搜索会话" className="flex-1 bg-transparent outline-none text-[12px]" style={{ color: "#606266" }} />
          </div>
        </div>

        {/* history */}
        <div className="flex-1 overflow-auto py-2">
          {sessionBlocks.map((g, gi) => (
            <div key={gi} className="mb-2">
              <div className="px-4 py-1 text-[11px]" style={{ color: "#909399" }}>{g.date}</div>
              {g.items.map(it => {
                const live = nl2sql.sessions.length > 0;
                const on = live ? nl2sql.currentSessionId === it.id : demoActiveId === it.id;
                return (
                  <button
                    type="button"
                    key={it.id}
                    onClick={() => {
                      if (live) void nl2sql.selectSession(it.id);
                      else setDemoActiveId(it.id);
                    }}
                    className="w-full text-left px-4 py-2 flex items-center gap-2 transition"
                    style={{
                      background: on ? "#E8F4FF" : "transparent",
                      borderLeft: `2px solid ${on ? "#1890FF" : "transparent"}`,
                      color: on ? "#1890FF" : "#606266",
                    }}
                  >
                    <span className="text-[12px] flex-1 truncate">{it.title}</span>
                    <span className="text-[10px]" style={{ color: "#C0C4CC" }}>{it.turns}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* quick prompts */}
        <div className="border-t" style={{ borderColor: "#E4E7ED" }}>
          <div className="px-4 py-2 text-[11px] flex items-center gap-1" style={{ color: "#909399" }}>
            <Hash className="w-3 h-3" />快捷指令
          </div>
          <div className="px-3 pb-3 space-y-1.5">
            {QUICK_PROMPTS.map((p, i) => (
              <button
                type="button"
                key={i}
                className="w-full text-left px-2.5 py-1.5 text-[12px] transition"
                style={{ border: "1px solid #D9ECFF", color: "#1890FF", background: "#fff", borderRadius: 3 }}
                onClick={() => setInput(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* datasets */}
        <div className="border-t px-3 py-3" style={{ borderColor: "#E4E7ED" }}>
          <div className="text-[11px] mb-2 flex items-center gap-1" style={{ color: "#909399" }}>
            <Database className="w-3 h-3" />已关联数据集
          </div>
          {DATASETS.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5 py-1 text-[11px]">
              <FileText className="w-3 h-3" style={{ color: "#1890FF" }} />
              <span style={{ color: "#606266" }}>{d.name}</span>
              <span className="ml-auto" style={{ color: "#C0C4CC" }}>{d.size}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ═══════ CENTER: chat ═══════ */}
      <main className="shrink-0 flex flex-col" style={{ width: "40%", minWidth: 420, borderRight: "1px solid #E4E7ED" }}>
        {/* header */}
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid #E4E7ED" }}>
          <Bot className="w-4 h-4" style={{ color: "#1890FF" }} />
          <span className="text-[13px]">智能数据分析体</span>
          <span className="eu-tag gray">v0.9.2-beta</span>
          <span className={`eu-tag ${nl2sql.backendError ? "red" : "green"}`}>
            {nl2sql.backendError ? "● NL2SQL API 未就绪" : "● 已连接"}
          </span>
          <div className="ml-auto flex items-center gap-2 text-[11px]" style={{ color: "#909399" }}>
            <span>NL2SQL · SSE</span>
            <span>·</span>
            <span className="truncate max-w-[200px]" title={nl2sql.backendError || ""}>
              {nl2sql.backendError || "会话与图表由后端驱动"}
            </span>
          </div>
        </div>

        {/* messages */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-5" style={{ background: "#fff" }}>

          {/* system hint */}
          <div className="text-center">
            <span className="text-[11px] px-2 py-0.5" style={{ color: "#909399", background: "#F5F7FA", borderRadius: 2 }}>
              {nl2sql.messages.length > 0
                ? `当前会话 ${nl2sql.currentSessionId?.slice(0, 8) ?? "—"}… · NL2SQL 流式`
                : "会话开始于 09:22 · 上下文窗口 32K tokens"}
            </span>
          </div>

          {nl2sql.messages.length > 0 ? (
            nl2sql.messages.map((m) =>
              m.role === "user" ? (
                <UserMsg key={String(m.id)} text={m.content} time={formatMsgTime(m.created_at)} />
              ) : (
                <div key={String(m.id)} className="flex gap-2.5 eu-msg">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "#E8F4FF", border: "1px solid #D9ECFF" }}>
                    <Bot className="w-3.5 h-3.5" style={{ color: "#1890FF" }} />
                  </div>
                  <div className="flex-1 max-w-[86%]">
                    <div className="text-[11px] mb-1" style={{ color: "#909399" }}>
                      智能数据分析体 · {formatMsgTime(m.created_at)}
                    </div>
                    <div className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "#303133" }}>
                      {m.content || (nl2sql.isStreaming ? "…" : "")}
                    </div>
                    {m.sql_query && (
                      <pre
                        className="mt-2 p-2 text-[11px] font-mono overflow-auto"
                        style={{ background: "#FAFAFA", border: "1px solid #E4E7ED", color: "#606266", maxHeight: 120 }}
                      >
                        {m.sql_query}
                      </pre>
                    )}
                  </div>
                </div>
              )
            )
          ) : (
            <>
              <UserMsg text="帮我看一下昨天 3 号冷库的温度波动，按小时画个折线图。" time="09:23:08" />
              <AgentMsg
                time="09:23:12"
                latency="1.24s"
                conf={96}
                text="已获取 3 号冷库温度传感器数据（2026-04-20，24 个采样点），图表已在右侧工作台生成。初步检测到 1 处异常：11:00 出现 4.6℃ 超限峰值，持续约 40 分钟。建议复查压缩机运行日志。"
                thoughts={[
                  "解析意图 → time-series plot",
                  "SELECT * FROM sensor.cold_room WHERE room='No.3' AND date='2026-04-20'",
                  "命中 24 条 · 聚合到小时均值",
                  "阈值扫描 (threshold=4.0) · 异常 1 处",
                  "渲染图表 → right canvas",
                ]}
                showJson={showJson}
                onJson={() => setShowJson((v) => !v)}
              />
              <UserMsg
                text="识别一下这是什么缺陷，并查一下这头猪是哪个农场送来的。"
                time="09:24:40"
                attach={{ type: "image", name: "carcass_B-8821.jpg", meta: "2.1 MB · 1920×1080" }}
              />
              <AgentMsg
                time="09:24:46"
                latency="3.82s"
                conf={89}
                text="图像判定为 PSE 肉（置信度 89%）。关联 EXIF 时间 2026-04-21 09:18 + RFID 批次 #5502，该批次来自「李家洼养殖场」。该供应商近 30 天 PSE 发生率 3.8%，高于均值 1.6 倍，图表已在右侧。"
                thoughts={[
                  "调用 ResNet50 视觉模型分割图像 → mask 生成",
                  "特征提取：L*=58.2, drip_loss=6.1%, pale_ratio=0.62",
                  "分类器 → PSE (p=0.89)",
                  "解析 EXIF · 关联 RFID → batch #5502",
                  "JOIN erp.pig_intake ON batch → farm = 李家洼",
                  "GROUP BY farm, month → PSE 发生率 bar chart",
                ]}
              />
            </>
          )}
        </div>

        {/* input bar */}
        <div className="border-t px-4 py-3" style={{ borderColor: "#E4E7ED", background: "#FAFAFA" }}>
          <div className="rounded flex items-start gap-2 p-2" style={{ background: "#fff", border: "1px solid #DCDFE6" }}>
            <button title="附件" className="shrink-0 w-7 h-7 flex items-center justify-center rounded" style={{ color: "#606266" }}>
              <Plus className="w-4 h-4" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  sendNl2sql();
                }
              }}
              placeholder="输入指令，或拖拽 .csv / .parquet / 图片到此处…（Shift+Enter 换行）"
              className="flex-1 bg-transparent outline-none resize-none text-[13px] py-1"
              style={{ color: "#303133", minHeight: 40, maxHeight: 120 }}
            />
            <button title="语音" className="shrink-0 w-7 h-7 flex items-center justify-center rounded" style={{ color: "#606266" }}>
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3 text-[11px]" style={{ color: "#909399" }}>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" defaultChecked />
                <span>启用 SQL 工具</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" defaultChecked />
                <span>Python Sandbox</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" />
                <span>上链存证</span>
              </label>
            </div>
            <button type="button" className="eu-btn-primary" disabled={nl2sql.isStreaming} onClick={sendNl2sql}>
              <Send className="w-3.5 h-3.5" /> 发送
              <span className="text-[10px] opacity-75 ml-1">Ctrl+Enter</span>
            </button>
          </div>
        </div>
      </main>

      {/* ═══════ RIGHT: canvas / workspace ═══════ */}
      <aside className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 480 }}>
        {/* tabs */}
        <div className="flex items-center" style={{ borderBottom: "1px solid #E4E7ED", background: "#FAFAFA" }}>
          {[
            { k: "chart", l: "温度折线图", i: BarChart3 },
            { k: "table", l: "异常明细表", i: FileText },
            { k: "code", l: "SQL / Python 源码", i: Terminal },
          ].map(t => {
            const on = canvasTab === t.k;
            const Icon = t.i;
            return (
              <button key={t.k} onClick={() => setCanvasTab(t.k as any)}
                className="h-10 px-4 flex items-center gap-1.5 text-[12px] transition"
                style={{
                  color: on ? "#1890FF" : "#606266",
                  borderBottom: `2px solid ${on ? "#1890FF" : "transparent"}`,
                  background: on ? "#ffffff" : "transparent",
                }}>
                <Icon className="w-3.5 h-3.5" />{t.l}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1 pr-3">
            <button className="eu-btn" style={{ height: 28, fontSize: 11 }}>
              <FileDown className="w-3 h-3" /> 导出图片
            </button>
            <button className="eu-btn" style={{ height: 28, fontSize: 11 }}>
              <FileDown className="w-3 h-3" /> 导出 CSV
            </button>
            <button className="eu-btn" style={{ height: 28, fontSize: 11 }}>
              <Code className="w-3 h-3" /> 查看源码
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-5" style={{ background: "#fff" }}>
          {canvasTab === "chart" && (
            <>
              {nl2sql.chartConfig && (
                <div className="mb-4">
                  <div className="text-[12px] mb-2 flex items-center gap-2" style={{ color: "#606266" }}>
                    <BarChart3 className="w-3.5 h-3.5" style={{ color: "#1890FF" }} />
                    NL2SQL 动态图表（后端推送）
                  </div>
                  <Nl2sqlDynamicChart config={nl2sql.chartConfig} />
                </div>
              )}
              {/* metadata strip */}
              <div className="flex items-center gap-3 text-[12px] pb-2 mb-1" style={{ borderBottom: "1px dashed #E4E7ED", color: "#606266" }}>
                <span>数据源：<code style={{ color: "#1890FF" }}>sensor.cold_room</code></span>
                <span>·</span>
                <span>Room = No.3</span>
                <span>·</span>
                <span>Date = 2026-04-20</span>
                <span>·</span>
                <span>Rows = 24</span>
                <span>·</span>
                <span>SQL 执行耗时：<code style={{ color: "#303133" }}>180ms</code></span>
              </div>

              {/* line chart */}
              <TempChart threshold={threshold} />

              {/* threshold slider */}
              <div className="eu-border rounded p-3" style={{ background: "#FAFAFA" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Sliders className="w-3.5 h-3.5" style={{ color: "#1890FF" }} />
                  <span className="text-[12px]">异常判定阈值</span>
                  <span className="eu-tag">threshold</span>
                  <span className="ml-auto text-[12px] tabular-nums">
                    当前：<span style={{ color: "#1890FF" }}>{threshold.toFixed(1)}</span> °C
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] tabular-nums" style={{ color: "#909399" }}>0.0</span>
                  <input type="range" min={0} max={8} step={0.1}
                    value={threshold} onChange={e => setThreshold(parseFloat(e.target.value))}
                    className="eu-slider flex-1" />
                  <span className="text-[11px] tabular-nums" style={{ color: "#909399" }}>8.0</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-[11px]" style={{ color: "#606266" }}>
                  <span>检出异常：<span style={{ color: "#F56C6C" }}>{TEMP.filter(t => t > threshold).length}</span> 个采样点</span>
                  <span>·</span>
                  <span>最大值：<span style={{ color: "#303133" }}>{Math.max(...TEMP).toFixed(1)} °C</span></span>
                  <span>·</span>
                  <span>均值：<span style={{ color: "#303133" }}>{(TEMP.reduce((a, b) => a + b, 0) / TEMP.length).toFixed(2)} °C</span></span>
                </div>
              </div>

              {/* image analysis (multimodal result) */}
              <div>
                <div className="text-[12px] mb-2 flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5" style={{ color: "#1890FF" }} />
                  <span>图像分析 · carcass_B-8821.jpg</span>
                  <span className="eu-tag">ResNet50-v2</span>
                  <span className="eu-tag gray">inference 420ms</span>
                </div>
                <div className="grid grid-cols-[240px_1fr] gap-3">
                  <PorkSampleImage />
                  <DefectTable />
                </div>
              </div>

              {/* farm bar chart */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-3.5 h-3.5" style={{ color: "#1890FF" }} />
                  <span className="text-[12px]">李家洼养殖场 · 近 30 天 PSE 发生率</span>
                  <span className="eu-tag orange">高于均值 1.6×</span>
                </div>
                <FarmBars />
              </div>

              {/* scatter */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ScatterPlotIcon className="w-3.5 h-3.5" style={{ color: "#1890FF" }} />
                  <span className="text-[12px]">宰前静息时间 ~ 排酸后 pH 值</span>
                  <span className="eu-tag">N = 284</span>
                  <span className="eu-tag red">Pearson r = −0.68</span>
                  <span className="eu-tag gray">p &lt; 0.001</span>
                </div>
                <ScatterPlot />
              </div>
            </>
          )}

          {canvasTab === "table" &&
            (nl2sql.tableData ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-3.5 h-3.5" style={{ color: "#1890FF" }} />
                  <span className="text-[12px]">NL2SQL 查询结果</span>
                  <span className="eu-tag">{nl2sql.tableData.columns.length} 列</span>
                </div>
                <Nl2sqlTablePreview data={nl2sql.tableData} />
              </div>
            ) : (
              <AnomalyTable threshold={threshold} />
            ))}
          {canvasTab === "code" &&
            (nl2sql.currentSql ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-3.5 h-3.5" style={{ color: "#1890FF" }} />
                  <span className="text-[12px]">NL2SQL 生成的 SQL</span>
                </div>
                <pre
                  className="p-3 text-[12px] leading-relaxed font-mono overflow-auto"
                  style={{ background: "#FAFAFA", border: "1px solid #E4E7ED", color: "#303133", borderRadius: 3 }}
                >
                  {nl2sql.currentSql}
                </pre>
              </div>
            ) : (
              <CodeView />
            ))}
        </div>

        {/* footer status */}
        <div className="h-7 px-4 flex items-center gap-3 text-[11px]" style={{ borderTop: "1px solid #E4E7ED", background: "#FAFAFA", color: "#909399" }}>
          <span>内存：312 MB / 2 GB</span>
          <span>·</span>
          <span>GPU 占用：18%</span>
          <span>·</span>
          <span>Session: sda-20260421-0922</span>
          <span className="ml-auto flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" style={{ color: "#67C23A" }} />
            所有工具就绪
          </span>
        </div>
      </aside>
    </div>
  );
}

/* ────────────────── components ────────────────── */

function UserMsg({ text, time, attach }: { text: string; time: string; attach?: { type: string; name: string; meta: string } }) {
  return (
    <div className="flex justify-end eu-msg">
      <div className="max-w-[82%]">
        <div className="text-[11px] mb-1 text-right" style={{ color: "#909399" }}>
          <User className="inline w-3 h-3 mr-1" />陈厂长 · {time}
        </div>
        {attach && (
          <div className="rounded mb-1 flex items-center gap-2 px-3 py-2" style={{ background: "#F5F7FA", border: "1px solid #E4E7ED" }}>
            <ImageIcon className="w-3.5 h-3.5" style={{ color: "#1890FF" }} />
            <span className="text-[12px]" style={{ color: "#303133" }}>{attach.name}</span>
            <span className="text-[10px] ml-auto" style={{ color: "#909399" }}>{attach.meta}</span>
          </div>
        )}
        <div className="px-3 py-2 text-[13px] leading-relaxed" style={{ background: "#F5F7FA", border: "1px solid #E4E7ED", borderRadius: 3, color: "#303133" }}>
          {text}
        </div>
      </div>
    </div>
  );
}

function AgentMsg({ text, time, latency, conf, thoughts, showJson, onJson }:
  { text: string; time: string; latency: string; conf: number; thoughts: string[]; showJson?: boolean; onJson?: () => void }) {
  return (
    <div className="flex gap-2.5 eu-msg">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "#E8F4FF", border: "1px solid #D9ECFF" }}>
        <Bot className="w-3.5 h-3.5" style={{ color: "#1890FF" }} />
      </div>
      <div className="flex-1 max-w-[86%]">
        <div className="text-[11px] mb-1" style={{ color: "#909399" }}>
          智能数据分析体 · {time}
        </div>

        {/* CoT collapsible */}
        <details className="mb-2" open>
          <summary className="cursor-pointer text-[11px] inline-flex items-center gap-1 px-2 py-0.5" style={{ color: "#909399", background: "#FAFAFA", border: "1px dashed #E4E7ED", borderRadius: 2 }}>
            <Terminal className="w-3 h-3" />
            思考链 · {thoughts.length} 步
          </summary>
          <div className="mt-1.5 pl-2 py-1 font-mono text-[11px] leading-relaxed" style={{ color: "#606266", borderLeft: "2px solid #E4E7ED" }}>
            {thoughts.map((t, i) => (
              <div key={i} className="pl-2 py-0.5 eu-cot-step" style={{ animationDelay: `${i * 0.12}s` }}>
                <span style={{ color: "#C0C4CC" }}>&gt; </span>{t}
              </div>
            ))}
          </div>
        </details>

        {/* main text */}
        <div className="text-[13px] leading-relaxed" style={{ color: "#303133" }}>
          {text}
        </div>

        {/* meta footer */}
        <div className="mt-2 flex items-center gap-3 text-[11px]" style={{ color: "#C0C4CC" }}>
          <span>推理耗时: <span style={{ color: "#909399" }}>{latency}</span></span>
          <span>|</span>
          <span>模型置信度: <span style={{ color: conf >= 85 ? "#67C23A" : "#E6A23C" }}>{conf}%</span></span>
          <span>|</span>
          <button onClick={onJson} className="hover:underline" style={{ color: "#1890FF" }}>[查看 JSON 数据]</button>
          <span>|</span>
          <button className="hover:underline" style={{ color: "#909399" }}>复制</button>
          <button className="hover:underline" style={{ color: "#909399" }}>重新生成</button>
        </div>

        {showJson && (
          <pre className="mt-2 p-3 text-[11px] leading-relaxed overflow-auto font-mono"
            style={{ background: "#FAFAFA", border: "1px solid #E4E7ED", color: "#606266", maxHeight: 180 }}>
{`{
  "intent": "time_series_plot",
  "entity": { "resource": "cold_room", "id": "No.3", "date": "2026-04-20" },
  "sql": "SELECT hour, AVG(temp_c) FROM sensor.cold_room WHERE ...",
  "rows": 24,
  "anomalies": [ { "t": "11:00", "value": 4.6, "rule": "temp > 4.0" } ],
  "tools_used": ["sql_exec","matplotlib"],
  "latency_ms": 1240,
  "model": "qwen2.5-72b-instruct",
  "confidence": 0.96
}`}
          </pre>
        )}
      </div>
    </div>
  );
}

/* ────────────────── charts ────────────────── */

function TempChart({ threshold }: { threshold: number }) {
  const W = 720, H = 260, pad = { l: 40, r: 40, t: 20, b: 28 };
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
  const tMin = 0, tMax = 6;
  const hMin = 60, hMax = 100;
  const x = (i: number) => pad.l + (i / 23) * innerW;
  const yT = (v: number) => pad.t + (1 - (v - tMin) / (tMax - tMin)) * innerH;
  const yH = (v: number) => pad.t + (1 - (v - hMin) / (hMax - hMin)) * innerH;

  const tempPath = TEMP.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${yT(v)}`).join(" ");
  const humidPath = HUMID.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${yH(v)}`).join(" ");

  return (
    <div className="eu-border rounded" style={{ background: "#fff" }}>
      <div className="px-3 py-2 flex items-center gap-3 text-[11px]" style={{ borderBottom: "1px solid #E4E7ED", color: "#606266" }}>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5" style={{ background: "#1890FF" }} />温度 (°C)</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5" style={{ background: "#67C23A", borderTop: "1px dashed #67C23A" }} />湿度 (%)</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: "#F56C6C" }} />异常点</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5" style={{ background: "#E6A23C", borderTop: "1px dashed #E6A23C" }} />阈值 {threshold.toFixed(1)}°C</span>
        <span className="ml-auto">2026-04-20 · No.3 Cold Room</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: 260 }}>
        {/* grid */}
        {[0, 1.5, 3, 4.5, 6].map(v => (
          <g key={v}>
            <line x1={pad.l} y1={yT(v)} x2={W - pad.r} y2={yT(v)} stroke="#F0F2F5" />
            <text x={pad.l - 6} y={yT(v) + 3} fontSize="10" fill="#909399" textAnchor="end">{v}</text>
          </g>
        ))}
        {[60, 70, 80, 90, 100].map(v => (
          <text key={v} x={W - pad.r + 6} y={yH(v) + 3} fontSize="10" fill="#909399">{v}</text>
        ))}
        {/* x axis */}
        {[0, 4, 8, 12, 16, 20, 23].map(i => (
          <text key={i} x={x(i)} y={H - pad.b + 14} fontSize="10" fill="#909399" textAnchor="middle">
            {String(i).padStart(2, "0")}:00
          </text>
        ))}
        <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#DCDFE6" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="#DCDFE6" />

        {/* threshold line */}
        <line x1={pad.l} y1={yT(threshold)} x2={W - pad.r} y2={yT(threshold)} stroke="#E6A23C" strokeDasharray="4 3" strokeWidth="1" />

        {/* humidity (secondary, dashed green) */}
        <path d={humidPath} fill="none" stroke="#67C23A" strokeDasharray="3 2" strokeWidth="1.2" opacity="0.85" />

        {/* temp line with area */}
        <path d={`${tempPath} L ${x(23)} ${H - pad.b} L ${x(0)} ${H - pad.b} Z`} fill="#1890FF" opacity="0.06" />
        <path d={tempPath} fill="none" stroke="#1890FF" strokeWidth="1.6" className="eu-chart-line" />

        {/* points */}
        {TEMP.map((v, i) => {
          const bad = v > threshold;
          return (
            <g key={i}>
              <circle cx={x(i)} cy={yT(v)} r={bad ? 3.5 : 2.2} className={bad ? "eu-chart-dot" : ""}
                style={{ animationDelay: `${1.2 + i * 0.04}s` }}
                fill={bad ? "#F56C6C" : "#fff"} stroke={bad ? "#F56C6C" : "#1890FF"} strokeWidth="1.2" />
              {bad && (
                <text x={x(i)} y={yT(v) - 8} fontSize="9" fill="#F56C6C" textAnchor="middle">{v.toFixed(1)}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PorkSampleImage() {
  return (
    <div className="eu-border rounded overflow-hidden" style={{ background: "#fff" }}>
      <div className="relative" style={{ height: 180 }}>
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 40% 45%,#fecaca,#f87171 40%,#991b1b)",
        }} />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 35% 40%,rgba(254,226,226,.8),rgba(254,226,226,0) 40%)",
          mixBlendMode: "screen",
        }} />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect x="18" y="24" width="42" height="30" fill="none" stroke="#F56C6C" strokeWidth=".4" strokeDasharray="2 1" />
          <rect x="17" y="20" width="18" height="4" fill="#F56C6C" />
          <text x="18" y="23" fontSize="2.6" fill="#fff">PSE 区域 · 12%</text>
          <rect x="56" y="50" width="24" height="18" fill="none" stroke="#E6A23C" strokeWidth=".4" strokeDasharray="2 1" />
          <rect x="55" y="46" width="20" height="4" fill="#E6A23C" />
          <text x="56" y="49" fontSize="2.6" fill="#fff">渗水 · 6.1%</text>
        </svg>
      </div>
      <div className="px-2 py-1 text-[10px] flex items-center gap-2" style={{ background: "#FAFAFA", color: "#909399", borderTop: "1px solid #E4E7ED" }}>
        <span>1920×1080</span>
        <span>·</span>
        <span>EXIF: 09:18:42</span>
        <span className="ml-auto" style={{ color: "#1890FF" }}>原图 ↗</span>
      </div>
    </div>
  );
}

function DefectTable() {
  const rows = [
    { cls: "PSE 白肌肉", area: "12.0%", coord: "(18,24)–(60,54)", conf: 0.89, tone: "#F56C6C" },
    { cls: "表面渗水", area: "6.1%", coord: "(56,50)–(80,68)", conf: 0.82, tone: "#E6A23C" },
    { cls: "正常肌理", area: "78.4%", coord: "remaining", conf: 0.96, tone: "#67C23A" },
    { cls: "切面瘀血", area: "3.5%", coord: "(8,78)–(22,92)", conf: 0.71, tone: "#E6A23C" },
  ];
  return (
    <div className="eu-border rounded overflow-hidden">
      <table className="w-full text-[11px]" style={{ color: "#303133" }}>
        <thead>
          <tr style={{ background: "#FAFAFA", color: "#909399" }}>
            <th className="text-left px-2 py-1.5 font-normal" style={{ borderBottom: "1px solid #E4E7ED" }}>类别</th>
            <th className="text-right px-2 py-1.5 font-normal" style={{ borderBottom: "1px solid #E4E7ED" }}>面积占比</th>
            <th className="text-left px-2 py-1.5 font-normal" style={{ borderBottom: "1px solid #E4E7ED" }}>坐标 (norm)</th>
            <th className="text-right px-2 py-1.5 font-normal" style={{ borderBottom: "1px solid #E4E7ED" }}>置信</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid #F0F2F5" : "none" }}>
              <td className="px-2 py-1.5">
                <span className="inline-block w-2 h-2 mr-1.5 rounded-sm" style={{ background: r.tone }} />
                {r.cls}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">{r.area}</td>
              <td className="px-2 py-1.5 font-mono" style={{ color: "#606266" }}>{r.coord}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{r.conf.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FarmBars() {
  const data = [
    { d: "04-01", v: 2.1 }, { d: "04-03", v: 2.4 }, { d: "04-05", v: 2.8 }, { d: "04-07", v: 3.1 },
    { d: "04-09", v: 2.9 }, { d: "04-11", v: 3.3 }, { d: "04-13", v: 3.6 }, { d: "04-15", v: 3.5 },
    { d: "04-17", v: 4.1 }, { d: "04-19", v: 4.4 }, { d: "04-21", v: 3.8 },
  ];
  const max = 5;
  const W = 720, H = 160, pad = { l: 30, r: 20, t: 10, b: 24 };
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
  const bw = innerW / data.length * 0.6;
  return (
    <div className="eu-border rounded" style={{ background: "#fff" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: 160 }}>
        {[0, 2.5, 5].map(v => (
          <g key={v}>
            <line x1={pad.l} y1={pad.t + (1 - v / max) * innerH} x2={W - pad.r} y2={pad.t + (1 - v / max) * innerH} stroke="#F0F2F5" />
            <text x={pad.l - 4} y={pad.t + (1 - v / max) * innerH + 3} fontSize="10" fill="#909399" textAnchor="end">{v}%</text>
          </g>
        ))}
        {/* mean line */}
        <line x1={pad.l} y1={pad.t + (1 - 2.3 / max) * innerH} x2={W - pad.r} y2={pad.t + (1 - 2.3 / max) * innerH} stroke="#909399" strokeDasharray="3 2" />
        <text x={W - pad.r - 4} y={pad.t + (1 - 2.3 / max) * innerH - 3} fontSize="10" fill="#909399" textAnchor="end">全行业均值 2.3%</text>
        {data.map((d, i) => {
          const bh = (d.v / max) * innerH;
          const cx = pad.l + (i + 0.5) * (innerW / data.length);
          const warn = d.v > 2.3;
          return (
            <g key={i}>
              <rect x={cx - bw / 2} y={pad.t + innerH - bh} width={bw} height={bh}
                fill={warn ? "#F56C6C" : "#1890FF"} opacity={warn ? 0.9 : 0.85} />
              <text x={cx} y={H - pad.b + 14} fontSize="9" fill="#909399" textAnchor="middle">{d.d}</text>
              <text x={cx} y={pad.t + innerH - bh - 3} fontSize="9" fill="#606266" textAnchor="middle">{d.v}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ScatterPlot() {
  const pts = Array.from({ length: 60 }).map((_, i) => {
    const rest = 0.5 + Math.random() * 5.5;
    const ph = 5.4 + (5.5 - rest) * 0.12 + (Math.random() - 0.5) * 0.25;
    return { x: rest, y: ph };
  });
  const W = 720, H = 220, pad = { l: 42, r: 20, t: 10, b: 26 };
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
  const xMin = 0, xMax = 6, yMin = 5.2, yMax = 6.4;
  const X = (v: number) => pad.l + ((v - xMin) / (xMax - xMin)) * innerW;
  const Y = (v: number) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * innerH;
  // regression: linear fit (hardcoded slope/intercept for look)
  const slope = -0.12, intercept = 6.0;
  const rX1 = 0.5, rY1 = slope * rX1 + intercept;
  const rX2 = 5.8, rY2 = slope * rX2 + intercept;

  return (
    <div className="eu-border rounded" style={{ background: "#fff" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: 220 }}>
        {[5.4, 5.7, 6.0, 6.3].map(v => (
          <g key={v}>
            <line x1={pad.l} y1={Y(v)} x2={W - pad.r} y2={Y(v)} stroke="#F0F2F5" />
            <text x={pad.l - 4} y={Y(v) + 3} fontSize="10" fill="#909399" textAnchor="end">{v}</text>
          </g>
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map(v => (
          <text key={v} x={X(v)} y={H - pad.b + 14} fontSize="10" fill="#909399" textAnchor="middle">{v}h</text>
        ))}
        <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#DCDFE6" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="#DCDFE6" />
        <text x={pad.l - 32} y={pad.t + innerH / 2} fontSize="10" fill="#606266" transform={`rotate(-90 ${pad.l - 32} ${pad.t + innerH / 2})`}>pH45min</text>
        <text x={pad.l + innerW / 2} y={H - 4} fontSize="10" fill="#606266" textAnchor="middle">宰前静息时间 (h)</text>

        {pts.map((p, i) => (
          <circle key={i} cx={X(p.x)} cy={Y(p.y)} r="2.4" fill="#1890FF" opacity="0.55" />
        ))}
        {/* regression line */}
        <line x1={X(rX1)} y1={Y(rY1)} x2={X(rX2)} y2={Y(rY2)} stroke="#F56C6C" strokeWidth="1.5" />
        <text x={X(rX2) - 12} y={Y(rY2) - 6} fontSize="10" fill="#F56C6C">y = −0.12x + 6.00</text>
      </svg>
    </div>
  );
}

function AnomalyTable({ threshold }: { threshold: number }) {
  const rows = TEMP.map((v, i) => ({ t: `${String(i).padStart(2, "0")}:00`, v, flag: v > threshold }));
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-3.5 h-3.5" style={{ color: "#1890FF" }} />
        <span className="text-[12px]">逐小时采样明细</span>
        <span className="eu-tag">{rows.length} rows</span>
        <span className="eu-tag red">{rows.filter(r => r.flag).length} 异常</span>
        <button className="ml-auto eu-btn" style={{ height: 26, fontSize: 11 }}><FileDown className="w-3 h-3" />导出</button>
      </div>
      <div className="eu-border rounded overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ background: "#FAFAFA", color: "#909399" }}>
              <th className="text-left px-3 py-2 font-normal" style={{ borderBottom: "1px solid #E4E7ED", width: 48 }}>#</th>
              <th className="text-left px-3 py-2 font-normal" style={{ borderBottom: "1px solid #E4E7ED" }}>时间</th>
              <th className="text-right px-3 py-2 font-normal" style={{ borderBottom: "1px solid #E4E7ED" }}>温度 (°C)</th>
              <th className="text-right px-3 py-2 font-normal" style={{ borderBottom: "1px solid #E4E7ED" }}>湿度 (%)</th>
              <th className="text-left px-3 py-2 font-normal" style={{ borderBottom: "1px solid #E4E7ED" }}>状态</th>
              <th className="text-left px-3 py-2 font-normal" style={{ borderBottom: "1px solid #E4E7ED" }}>规则命中</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid #F0F2F5" : "none", background: r.flag ? "#FEF6F6" : "transparent" }}>
                <td className="px-3 py-1.5" style={{ color: "#C0C4CC" }}>{i + 1}</td>
                <td className="px-3 py-1.5 font-mono" style={{ color: "#606266" }}>{r.t}</td>
                <td className="px-3 py-1.5 text-right tabular-nums" style={{ color: r.flag ? "#F56C6C" : "#303133" }}>{r.v.toFixed(1)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums" style={{ color: "#606266" }}>{HUMID[i]}</td>
                <td className="px-3 py-1.5">
                  {r.flag ? <span className="eu-tag red">异常</span> : <span className="eu-tag gray">正常</span>}
                </td>
                <td className="px-3 py-1.5 font-mono" style={{ color: "#909399" }}>
                  {r.flag ? `temp > ${threshold.toFixed(1)}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CodeView() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-3.5 h-3.5" style={{ color: "#1890FF" }} />
          <span className="text-[12px]">SQL · ClickHouse</span>
          <span className="eu-tag gray">180 ms</span>
          <button className="ml-auto eu-btn" style={{ height: 26, fontSize: 11 }}><Copy className="w-3 h-3" />复制</button>
        </div>
        <pre className="p-3 text-[12px] leading-relaxed font-mono overflow-auto"
          style={{ background: "#FAFAFA", border: "1px solid #E4E7ED", color: "#303133", borderRadius: 3 }}>
{`SELECT
    toStartOfHour(ts)        AS hour,
    round(avg(temp_c), 2)    AS temp_c,
    round(avg(humidity), 1)  AS humidity
FROM sensor.cold_room
WHERE room_id = 'No.3'
  AND toDate(ts) = '2026-04-20'
GROUP BY hour
ORDER BY hour;`}
        </pre>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-3.5 h-3.5" style={{ color: "#1890FF" }} />
          <span className="text-[12px]">Python · matplotlib</span>
          <span className="eu-tag gray">820 ms</span>
          <button className="ml-auto eu-btn" style={{ height: 26, fontSize: 11 }}><Copy className="w-3 h-3" />复制</button>
        </div>
        <pre className="p-3 text-[12px] leading-relaxed font-mono overflow-auto"
          style={{ background: "#FAFAFA", border: "1px solid #E4E7ED", color: "#303133", borderRadius: 3 }}>
{`import pandas as pd, matplotlib.pyplot as plt
df = pd.read_sql(QUERY, conn)
fig, ax1 = plt.subplots(figsize=(10, 3.5))
ax1.plot(df.hour, df.temp_c, color='#1890FF', label='temp')
ax1.axhline(y=THRESHOLD, color='#E6A23C', ls='--')
ax1.scatter(df[df.temp_c > THRESHOLD].hour,
            df[df.temp_c > THRESHOLD].temp_c,
            color='#F56C6C', s=30, zorder=3)
ax2 = ax1.twinx()
ax2.plot(df.hour, df.humidity, color='#67C23A', ls=':', label='humidity')
fig.savefig('out.png', dpi=180, bbox_inches='tight')`}
        </pre>
      </div>
    </div>
  );
}
