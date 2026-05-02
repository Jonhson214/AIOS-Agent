import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { agentTeamApi } from "../../integrations/agentTeamApi";
import {
  Plus, Mic, ArrowUp, PanelLeftClose, PanelLeftOpen, Paperclip,
  ChevronDown, ChevronRight, Sparkles, FileText, MoreHorizontal,
  Search, Image as ImageIcon,
} from "lucide-react";

type Role = "user" | "assistant";
type Block =
  | { kind: "md"; text: string }
  | { kind: "report"; time: string; models: string; ok: number; bad: number }
  | {
      kind: "slice"; title: string; img: string; stainCell?: boolean;
      ocrText: string; ocrConf: number; rule: string; actions: string[];
    }
  | {
      kind: "table"; caption: string;
      head: string[]; rows: Array<{ cells: string[]; alert?: boolean }>;
      explainIdx?: number;
    }
  | {
      kind: "log"; lines: string[];
    }
  | { kind: "evidence"; caption: string; notes: string[] }
  | { kind: "ack"; text: string };

type Msg = { role: Role; blocks: Block[]; ts: string };

type Session = { id: string; title: string; date: string; msgs: Msg[] };

const seedSessions: Session[] = [
  {
    id: "s1",
    title: "4月21日 A班次进场检疫单",
    date: "今天",
    msgs: [
      {
        role: "user",
        ts: "09:02",
        blocks: [
          { kind: "md", text: "批量上传了今天早班 50 份《生猪屠宰前静息记录表》照片，帮我审一下。" },
        ],
      },
      {
        role: "assistant",
        ts: "09:02",
        blocks: [
          { kind: "report", time: "4.5s", models: "Vision-OCR · RAG-HACCP", ok: 48, bad: 2 },
          {
            kind: "md",
            text: "🟢 **48 份完全合规**，已自动打上电子时间戳并归档至数据库。\n\n🔴 **2 份存在异常**，已为您提取如下，等待人工决策：",
          },
          {
            kind: "slice",
            title: "异常单据 1 · PH-2026-0421-007",
            img: "stain",
            stainCell: true,
            ocrText: "12",
            ocrConf: 45,
            rule: "刀具消毒水温：GB/T 19477 规定 ≥ 82°C",
            actions: ["查看原图全貌", "修正为 82°C (基于历史习惯)", "驳回给车间班长"],
          },
          {
            kind: "slice",
            title: "异常单据 2 · PH-2026-0421-014",
            img: "sign",
            ocrText: "张三",
            ocrConf: 92,
            rule: "签名区：代签风险检测",
            actions: ["查看原图全貌", "比对签名样本", "驳回给车间班长"],
          },
          {
            kind: "log",
            lines: [
              "[Log] 提取签名区...匹配到 \"张三\"。",
              "[Log] 交叉验证排班表 schedule_20260421.json ...",
              "[Log] 结果：张三今日休假 (leave_type=annual)。",
              "[Alert] 触发规则：代签风险。置信度：99%。",
            ],
          },
        ],
      },
      {
        role: "user",
        ts: "09:05",
        blocks: [
          { kind: "md", text: "把 PH-2026-0421-014 这张单据作废，给车间主任发个邮件警告一下代签问题，把刚才你分析的日志附在邮件里。" },
        ],
      },
      {
        role: "assistant",
        ts: "09:05",
        blocks: [
          {
            kind: "ack",
            text: "邮件已发送至车间主任 (liu.gz@muyuan.cn)。\n单据 PH-2026-0421-014 状态已更改为：**作废**。",
          },
        ],
      },
    ],
  },
  { id: "s2", title: "排酸车间温湿度手写表", date: "今天", msgs: [] },
  { id: "s3", title: "动物检疫合格证明比对", date: "昨天", msgs: [] },
  { id: "s4", title: "消毒记录表批量归档", date: "昨天", msgs: [] },
  { id: "s5", title: "胴体修整工序留痕审核", date: "4月19日", msgs: [] },
];

function LogoDot() {
  return (
    <div
      style={{
        width: 28, height: 28, borderRadius: 999,
        background: "linear-gradient(135deg,#111 0%,#555 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", flexShrink: 0,
      }}
    >
      <Sparkles size={14} />
    </div>
  );
}

function StainSlice() {
  return (
    <div style={{ width: "100%", background: "#faf7f0", border: "1px solid #ececec", borderRadius: 6, padding: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 0, fontFamily: "ui-monospace,monospace", color: "#333" }}>
        <div style={{ borderRight: "1px solid #d6c9ab", padding: "6px 8px", color: "#666" }}>时间</div>
        <div style={{ padding: "6px 8px", color: "#666" }}>刀具消毒水温 (°C)</div>
        <div style={{ borderRight: "1px solid #d6c9ab", borderTop: "1px solid #d6c9ab", padding: "6px 8px" }}>06:00</div>
        <div style={{ position: "relative", borderTop: "1px solid #d6c9ab", padding: "6px 8px" }}>
          <span style={{ fontFamily: "Caveat, cursive", color: "#1a2b5f" }}>12</span>
          <span
            aria-hidden
            style={{
              position: "absolute", left: 4, right: 30, top: 2, bottom: 2,
              background: "radial-gradient(ellipse at 40% 60%, rgba(120,30,20,0.38) 0%, rgba(120,30,20,0.12) 55%, transparent 75%)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SignSlice() {
  return (
    <div style={{ width: "100%", background: "#faf7f0", border: "1px solid #ececec", borderRadius: 6, padding: 18 }}>
      <div style={{ fontFamily: "ui-monospace,monospace", color: "#888", marginBottom: 8 }}>签名 / Signature</div>
      <div style={{ fontFamily: "Caveat, cursive", color: "#1a2b5f", letterSpacing: 2 }}>
        张三
      </div>
      <div style={{ borderBottom: "1px solid #d6c9ab", marginTop: 10 }} />
    </div>
  );
}

function ReportBlock(b: Extract<Block, { kind: "report" }>) {
  return (
    <div style={{ border: "1px solid #ececec", borderRadius: 10, padding: "12px 14px", background: "#fafafa" }}>
      <div style={{ color: "#111", marginBottom: 4 }}>📄 处理报告：批量审核完成</div>
      <div style={{ color: "#888", fontFamily: "ui-monospace,monospace" }}>
        耗时: {b.time} · 模型调用: {b.models}
      </div>
      <div style={{ display: "flex", gap: 18, marginTop: 10 }}>
        <div><span style={{ color: "#16a34a" }}>●</span> <span style={{ color: "#111" }}>{b.ok}</span> <span style={{ color: "#888" }}>合规</span></div>
        <div><span style={{ color: "#dc2626" }}>●</span> <span style={{ color: "#111" }}>{b.bad}</span> <span style={{ color: "#888" }}>异常</span></div>
      </div>
    </div>
  );
}

function SliceBlock(b: Extract<Block, { kind: "slice" }>) {
  const isErr = b.ocrConf < 60 || b.rule.includes("代签");
  return (
    <div className="dmr-slice" style={{ border: "1px solid #ececec", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #f0f0f0", color: "#111", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{b.title}</span>
        <span style={{ color: isErr ? "#dc2626" : "#888", fontFamily: "ui-monospace,monospace" }}>
          OCR conf = {b.ocrConf}%
        </span>
      </div>
      <div style={{ padding: 14, background: "#fff" }}>
        {b.img === "stain" ? <StainSlice /> : <SignSlice />}
        <div style={{ marginTop: 12, color: "#444" }}>
          <span style={{ color: "#888" }}>智能体分析：</span>
          {b.img === "stain" ? (
            <>刀具消毒水温记录：OCR 识别置信度仅为 <span style={{ color: "#dc2626" }}>{b.ocrConf}%</span>。系统读取为 <span style={{ color: "#dc2626" }}>12°C</span>，但 {b.rule}。</>
          ) : (
            <>签名区提取：“张三”。交叉验证排班表显示张三今日休假，触发<span style={{ color: "#dc2626" }}>代签风险</span>。</>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {b.actions.map((a, i) => (
            <button
              key={i}
              className="dmr-chip-btn"
              style={{
                padding: "6px 12px", borderRadius: 999, border: "1px solid #e5e5e5",
                background: "#fff", color: "#444", cursor: "pointer",
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TableBlock(b: Extract<Block, { kind: "table" }>) {
  return (
    <div>
      <div style={{ color: "#888", marginBottom: 6 }}>{b.caption}</div>
      <div style={{ border: "1px solid #ececec", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "ui-monospace,monospace" }}>
          <thead>
            <tr style={{ background: "#fafafa", color: "#666" }}>
              {b.head.map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #ececec" }}>{h}</th>
              ))}
              <th style={{ padding: "8px 12px", borderBottom: "1px solid #ececec" }} />
            </tr>
          </thead>
          <tbody>
            {b.rows.map((r, i) => (
              <tr key={i} style={{ background: r.alert ? "#fff5f5" : "#fff", color: r.alert ? "#dc2626" : "#333" }}>
                {r.cells.map((c, j) => (
                  <td key={j} style={{ padding: "8px 12px", borderBottom: "1px solid #f5f5f5" }}>{c}</td>
                ))}
                <td style={{ padding: "8px 12px", borderBottom: "1px solid #f5f5f5", textAlign: "right" }}>
                  {r.alert && (
                    <button
                      style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid #e5e5e5", background: "#fff", color: "#444", cursor: "pointer" }}
                    >
                      要求 AI 解释
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LogBlock({ lines }: { lines: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "#888", cursor: "pointer", padding: 0 }}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        查看解析日志
      </button>
      {open && (
        <div
          style={{
            marginTop: 8, padding: 12, background: "#fafafa", border: "1px solid #ececec",
            borderRadius: 8, color: "#333", fontFamily: "ui-monospace,monospace",
          }}
        >
          {lines.map((ln, i) => (
            <div
              key={i}
              className="dmr-log-line"
              style={{ animationDelay: `${i * 0.12}s`, color: ln.includes("[Alert]") ? "#dc2626" : "#444" }}
            >
              {ln}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AckBlock({ text }: { text: string }) {
  return (
    <div style={{ color: "#444", whiteSpace: "pre-wrap" }}>
      {text.split("**").map((s, i) => i % 2 ? <strong key={i} style={{ color: "#111" }}>{s}</strong> : <span key={i}>{s}</span>)}
    </div>
  );
}

function Markdown({ text }: { text: string }) {
  return (
    <div style={{ color: "#333", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
      {text.split("**").map((s, i) => i % 2 ? <strong key={i} style={{ color: "#111" }}>{s}</strong> : <span key={i}>{s}</span>)}
    </div>
  );
}

function BlockRender({ block }: { block: Block }) {
  switch (block.kind) {
    case "md": return <Markdown text={block.text} />;
    case "report": return <ReportBlock {...block} />;
    case "slice": return <SliceBlock {...block} />;
    case "table": return <TableBlock {...block} />;
    case "log": return <LogBlock lines={block.lines} />;
    case "ack": return <AckBlock text={block.text} />;
    case "evidence":
      return (
        <div style={{ border: "1px solid #ececec", borderRadius: 10, padding: 14, background: "#fafafa" }}>
          <div style={{ color: "#888", marginBottom: 8 }}>{block.caption}</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#333" }}>
            {block.notes.map((n, i) => <li key={i} style={{ marginBottom: 4 }}>{n}</li>)}
          </ul>
        </div>
      );
  }
}

function MessageRow({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className="dmr-msg" style={{ display: "flex", gap: 14, padding: "20px 0" }}>
      {isUser ? (
        <div style={{ width: 28, height: 28, borderRadius: 999, background: "#ececec", color: "#555", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          Q
        </div>
      ) : (
        <LogoDot />
      )}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#888" }}>
          <span style={{ color: "#111" }}>{isUser ? "品控员" : "审核智能体"}</span>
          <span style={{ fontFamily: "ui-monospace,monospace" }}>{msg.ts}</span>
        </div>
        {msg.blocks.map((b, i) => <BlockRender key={i} block={b} />)}
      </div>
    </div>
  );
}

export function SmartDocReview() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<Session[]>(seedSessions);
  const [activeId, setActiveId] = useState("s1");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [embeddedSessionId, setEmbeddedSessionId] = useState<string | null>(null);

  const tryAgentTeamReply = useCallback(async (text: string, ts: string): Promise<Msg | null> => {
    if (embeddedSessionId) {
      try {
        const [session, items] = await Promise.all([
          agentTeamApi.getSession(embeddedSessionId),
          agentTeamApi.listItems(embeddedSessionId, 12),
        ]);
        const lines =
          items.items?.slice(0, 8).map((it) => `• [${it.risk_level}] ${(it.ai_finding || "").slice(0, 160)}`) ?? [];
        const body = [
          `**会话状态：** ${session.state}`,
          session.progress_summary
            ? `**进度：** 高风险已决 ${session.progress_summary.decided_high_risk}/${session.progress_summary.total_high_risk} · 完成度 ${session.progress_summary.completion_percent}%`
            : "",
          lines.length ? `\n**审查条目（节选）：**\n${lines.join("\n")}` : "",
        ]
          .filter(Boolean)
          .join("\n\n");
        return {
          role: "assistant",
          ts,
          blocks: [{ kind: "md", text: body }],
        };
      } catch {
        /* fall through */
      }
    }
    try {
      const list = await agentTeamApi.listContracts(10);
      if (list.items?.length) {
        const table = list.items
          .slice(0, 8)
          .map((c) => `| ${c.title || c.original_filename} | ${c.contract_status} | ${c.uploaded_at?.slice(0, 10) ?? ""} |`)
          .join("\n");
        return {
          role: "assistant",
          ts,
          blocks: [
            {
              kind: "md",
              text: `已从 **AgentTeam** 后端读取合同列表（共 ${list.total} 条）。\n\n| 标题 | 状态 | 上传日 |\n| --- | --- | --- |\n${table}\n\n上传新合同（左侧 + 或下方 📎）将创建审查会话，并可在后续指令中分析该会话条目。`,
            },
          ],
        };
      }
    } catch {
      return null;
    }
    return null;
  }, [embeddedSessionId]);

  const active = sessions.find((s) => s.id === activeId) ?? sessions[0];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [activeId, active.msgs.length, sending]);

  const onSend = () => {
    const text = input.trim();
    if (!text) return;
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const userMsg: Msg = { role: "user", ts, blocks: [{ kind: "md", text }] };

    setSessions((prev) => prev.map((s) => s.id === activeId ? { ...s, msgs: [...s.msgs, userMsg] } : s));
    setInput("");
    setSending(true);

    void (async () => {
      let reply: Msg;
      try {
        const apiMsg = await tryAgentTeamReply(text, ts);
        reply = apiMsg ?? makeReply(text, ts);
      } catch (e) {
        toast.error((e as Error).message);
        reply = makeReply(text, ts);
      }
      setSessions((prev) => prev.map((s) => s.id === activeId ? { ...s, msgs: [...s.msgs, reply] } : s));
      setSending(false);
    })();
  };

  const onNew = () => {
    const id = "s" + Date.now();
    const s: Session = { id, title: "新审核任务", date: "今天", msgs: [] };
    setSessions([s, ...sessions]);
    setActiveId(id);
  };

  const grouped = sessions.reduce<Record<string, Session[]>>((m, s) => {
    (m[s.date] ||= []).push(s); return m;
  }, {});

  return (
    <div
      style={{
        width: "100%", height: "100vh", display: "flex", background: "#fff",
        color: "#111", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',PingFang SC,Roboto,sans-serif",
      }}
    >
      <style>{`
        @keyframes dmr-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dmr-slide { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes dmr-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,.45); } 50% { box-shadow: 0 0 0 8px rgba(220,38,38,0); } }
        @keyframes dmr-caret { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
        @keyframes dmr-shimmer { 0% { background-position: -200px 0; } 100% { background-position: 240px 0; } }
        @keyframes dmr-bar { from { width: 0; } }
        button { transition: background .15s, color .15s, border-color .15s, transform .1s, box-shadow .15s; }
        button:active { transform: scale(.97); }
        textarea, input { transition: border-color .15s, box-shadow .15s; }
        textarea:focus, input:focus { border-color: #111; }
        .dmr-msg { animation: dmr-fadein .36s ease both; }
        .dmr-chip-btn { transition: background .15s ease, border-color .15s ease, transform .12s ease; }
        .dmr-chip-btn:hover { background: #f5f5f5; transform: translateY(-1px); }
        .dmr-slice { transition: transform .25s ease, box-shadow .25s ease; }
        .dmr-slice:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(0,0,0,.06); }
        .dmr-log-line { animation: dmr-slide .28s ease both; }
        .dmr-send:not(:disabled):hover { background: #000 !important; }
        .dmr-new:hover { background: #000 !important; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,.2); }
        .dmr-session:hover { background: #f5f5f5 !important; }
        .dmr-live-dot { width: 6px; height: 6px; border-radius: 999px; background: #dc2626; display: inline-block; animation: dmr-pulse 1.5s infinite; }
        .dmr-caret::after { content: "▌"; display: inline-block; margin-left: 2px; animation: dmr-caret 1s infinite; color: #888; }
      `}</style>
      {sidebarOpen && (
        <aside style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", padding: "16px 12px", borderRight: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LogoDot />
              <span style={{ color: "#111" }}>智能文档审核</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: 4 }}
              title="收起"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const r = await agentTeamApi.uploadContract(f);
                setEmbeddedSessionId(r.session_id);
                toast.success(`合同已上传，会话 ${r.session_id.slice(0, 8)}…`);
                const now = new Date();
                const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                const userMsg: Msg = { role: "user", ts, blocks: [{ kind: "md", text: `上传文件：${f.name}` }] };
                const ack: Msg = {
                  role: "assistant",
                  ts,
                  blocks: [
                    {
                      kind: "md",
                      text: `**AgentTeam** 已接收。\n- 合同 ID：${r.contract_id}\n- 会话 ID：${r.session_id}\n- 状态：${r.state}\n\n可在后续对话中让我「分析当前会话」以拉取审查条目。`,
                    },
                  ],
                };
                setSessions((prev) =>
                  prev.map((s) => (s.id === activeId ? { ...s, msgs: [...s.msgs, userMsg, ack] } : s))
                );
              } catch (err) {
                toast.error((err as Error).message);
              }
              e.target.value = "";
            }}
          />
          <button
            onClick={onNew}
            className="dmr-new"
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
              border: "1px solid #111", background: "#111", color: "#fff", borderRadius: 999,
              cursor: "pointer", marginBottom: 14,
            }}
          >
            <Plus size={16} />
            新审核任务
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", border: "1px solid #f0f0f0", borderRadius: 8, marginBottom: 14 }}>
            <Search size={14} color="#999" />
            <input
              placeholder="搜索历史..."
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: "#333" }}
            />
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {Object.entries(grouped).map(([date, list]) => (
              <div key={date} style={{ marginBottom: 16 }}>
                <div style={{ color: "#aaa", padding: "4px 10px", fontFamily: "ui-monospace,monospace" }}>{date}</div>
                {list.map((s) => (
                  <button
                    key={s.id}
                    className="dmr-session"
                    onClick={() => setActiveId(s.id)}
                    style={{
                      width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8,
                      border: "none", background: s.id === activeId ? "#f5f5f5" : "transparent",
                      color: s.id === activeId ? "#111" : "#444", cursor: "pointer", marginBottom: 2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10, color: "#aaa", fontFamily: "ui-monospace,monospace" }}>
            牧原 · 品控 QC-0412
          </div>
        </aside>
      )}

      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid #f5f5f5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: 4 }}
              >
                <PanelLeftOpen size={18} />
              </button>
            )}
            <span style={{ color: "#111" }}>{active.title}</span>
            <span style={{ color: "#aaa", fontFamily: "ui-monospace,monospace" }}>· Vision-OCR + RAG-HACCP</span>
          </div>
          <button style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}>
            <MoreHorizontal size={18} />
          </button>
        </header>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 24px 80px" }}>
            {active.msgs.length === 0 ? (
              <EmptyState onPick={(p) => setInput(p)} />
            ) : (
              active.msgs.map((m, i) => <MessageRow key={i} msg={m} />)
            )}
            {sending && (
              <div style={{ display: "flex", gap: 14, padding: "20px 0", alignItems: "center" }}>
                <LogoDot />
                <TypingDots />
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "0 24px 20px", background: "linear-gradient(180deg,transparent,#fff 40%)" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div
              style={{
                display: "flex", alignItems: "flex-end", gap: 8,
                border: "1px solid #e5e5e5", borderRadius: 24, padding: "10px 10px 10px 14px",
                background: "#fff",
              }}
            >
              <button
                type="button"
                title="上传照片 / PDF / 扫描文件夹"
                onClick={() => fileRef.current?.click()}
                style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 6 }}
              >
                <Plus size={20} />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
                }}
                rows={1}
                placeholder="向审核智能体下达指令，或拖入单据照片..."
                style={{
                  flex: 1, border: "none", outline: "none", resize: "none",
                  background: "transparent", color: "#111", padding: "6px 4px",
                  maxHeight: 160, fontFamily: "inherit",
                }}
              />
              <button
                title="语音指令"
                style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 6 }}
              >
                <Mic size={18} />
              </button>
              <button
                onClick={onSend}
                disabled={!input.trim()}
                className="dmr-send"
                style={{
                  width: 32, height: 32, borderRadius: 999, border: "none",
                  background: input.trim() ? "#111" : "#e5e5e5",
                  color: "#fff", cursor: input.trim() ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <ArrowUp size={16} />
              </button>
            </div>
            <div style={{ textAlign: "center", color: "#bbb", marginTop: 8, fontFamily: "ui-monospace,monospace" }}>
              智能体可能出错 · 关键判定请以兽医/品控签字为准 · Enter 发送 · Shift+Enter 换行
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: 999, background: "#bbb",
            animation: `dmr-blink 1.2s ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes dmr-blink {0%,60%,100%{opacity:.25}30%{opacity:1}}`}</style>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (p: string) => void }) {
  const prompts = [
    "批量审核今天早班的《生猪屠宰前静息记录表》",
    "提取今天所有进场黑猪的检疫证编号并与 ERP 做对比",
    "排酸车间 02:00 的温度记录缺失，帮我回溯责任班组",
    "最近 7 天代签风险的单据都有哪些？",
  ];
  return (
    <div style={{ padding: "80px 0", textAlign: "center" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "#111", marginBottom: 10 }}>
        <LogoDot />
        <span>今天想审核点什么？</span>
      </div>
      <div style={{ color: "#888", marginBottom: 24 }}>上传单据照片、PDF，或直接对我下达指令。</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 600, margin: "0 auto" }}>
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => onPick(p)}
            style={{
              textAlign: "left", padding: "12px 14px", borderRadius: 12,
              border: "1px solid #f0f0f0", background: "#fafafa", color: "#444", cursor: "pointer",
            }}
          >
            <FileText size={14} style={{ marginRight: 6, verticalAlign: -2, color: "#888" }} />
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function makeReply(text: string, ts: string): Msg {
  if (/检疫证|ERP|黑猪/.test(text)) {
    return {
      role: "assistant", ts,
      blocks: [
        { kind: "md", text: "已拉取今晨 `08:00 - 09:30` 所有进场黑猪批次，与 ERP 采购单做了比对：" },
        {
          kind: "table",
          caption: "动物检疫合格证明 × ERP 入库单 对比",
          head: ["批次", "检疫证数量", "ERP 入库数量", "供应商"],
          rows: [
            { cells: ["#097", "80", "80", "豫南养殖场"] },
            { cells: ["#098", "60", "60", "信阳黑猪合作社"] },
            { cells: ["#099", "100", "102", "驻马店联营"], alert: true },
            { cells: ["#100", "120", "120", "豫南养殖场"] },
          ],
        },
        {
          kind: "evidence",
          caption: "批次 #099 核查证据",
          notes: [
            "门禁监控 GATE-03 · 08:47 共识别 102 头入场",
            "地磅 SCALE-02 · 累计过磅 102 头 / 14,820 kg",
            "推断：供应商可能多送 2 头未在检疫单上的生猪",
          ],
        },
        { kind: "md", text: "如需**冻结这 2 头的准宰权限**并生成异常报告，请直接回复。" },
      ],
    };
  }
  if (/冻结|准宰|异常报告/.test(text)) {
    return {
      role: "assistant", ts,
      blocks: [{ kind: "ack", text: "已冻结批次 #099 的 2 头未登记生猪准宰权限。\n异常报告 `RPT-2026-0421-003` 已生成并推送至驻场兽医。" }],
    };
  }
  if (/作废|邮件|警告/.test(text)) {
    return {
      role: "assistant", ts,
      blocks: [{ kind: "ack", text: "邮件已发送至车间主任。\n单据状态已更改为：**作废**。" }],
    };
  }
  return {
    role: "assistant", ts,
    blocks: [{ kind: "md", text: "已收到指令。请上传对应的单据照片，或告诉我要查询的批次/日期，我会调用 Vision-OCR + RAG-HACCP 进行审核。" }],
  };
}

export default SmartDocReview;
