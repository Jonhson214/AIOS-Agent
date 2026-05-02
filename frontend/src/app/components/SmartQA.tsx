import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { graphragApi, ApiError } from "../../integrations/graphragApi";
import type { ApiToolCall } from "../../integrations/graphragApi";
import {
  Mic, Camera, ScanLine, Send, Volume2, Sparkles, User,
  FileText, ShieldAlert, CheckCircle2, AlertTriangle, WifiOff,
  ChevronRight, Clock, Tag, Image as ImageIcon, Plus, Pause,
  Headphones, Box, Wrench, Stethoscope, BookOpen, Zap,
  ArrowRight, Lock, Radio, Languages, Power
} from "lucide-react";

/* ────────────────────────────── types ────────────────────────────── */
type Role = "user" | "ai" | "system";
type Cite = { id: string; title: string; chapter: string };
type Msg = {
  id: string;
  role: Role;
  time: string;
  text?: string;
  image?: string;
  overlay?: { x: number; y: number; w: number; h: number; label: string; color: string }[];
  compareRef?: string;
  cites?: Cite[];
  confidence?: number;
  actions?: { label: string; tone: "danger" | "warn" | "ok" | "ghost" }[];
};

/* ────────────────────────────── demo data ────────────────────────────── */
const HISTORY = [
  { group: "今日 · 早班 06:00-14:00", items: [
    { id: "h1", title: "批次 #4092 PSE 肉判定", tag: "PSE", tone: "danger", time: "09:42" },
    { id: "h2", title: "8号传送带异响排查", tag: "设备", tone: "warn", time: "08:15" },
    { id: "h3", title: "冷却间温度异常咨询", tag: "SOP", tone: "ok", time: "07:30" },
  ]},
  { group: "昨日 · 夜班", items: [
    { id: "h4", title: "旋毛虫检测流程复核", tag: "检疫", tone: "ok", time: "23:10" },
    { id: "h5", title: "分割刀 B-12 磨损判断", tag: "设备", tone: "warn", time: "21:45" },
  ]},
];

const QUICK_CMDS = [
  { icon: AlertTriangle, label: "一键上报异常", tone: "danger" },
  { icon: BookOpen, label: "车间温湿度规范", tone: "info" },
  { icon: Stethoscope, label: "病变肉图谱", tone: "info" },
  { icon: Wrench, label: "设备故障手册", tone: "info" },
];

const ROLES = [
  { id: "qc", name: "品控质检员", icon: Stethoscope, color: "#06b6d4" },
  { id: "cut", name: "分割工人", icon: Box, color: "#f59e0b" },
  { id: "tech", name: "设备维保", icon: Wrench, color: "#a855f7" },
];

function formatClock() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const INITIAL_MSGS: Msg[] = [
  {
    id: "m1", role: "system", time: "09:41",
    text: "已关联上下文 · 批次 #4092 · 挂钩 A-407 · 来源 X 农场",
  },
  {
    id: "m2", role: "user", time: "09:42",
    text: "这块肉颜色发白，渗水严重，帮我判断一下。",
    image: "pork-sample",
  },
  {
    id: "m3", role: "ai", time: "09:42",
    text: "根据图像特征（颜色 L* ≈ 58，高于阈值 50）与滴水损失描述，该胴体高度疑似为 PSE 肉（苍白、柔软、渗出性），检出置信度 92%。建议立即隔离并转交高级兽医复核。",
    overlay: [
      { x: 18, y: 22, w: 38, h: 30, label: "渗水区 L*=58", color: "#ef4444" },
      { x: 55, y: 48, w: 28, h: 22, label: "肌纤维松弛", color: "#f59e0b" },
    ],
    compareRef: "std-pse",
    confidence: 92,
    cites: [
      { id: "c1", title: "冷却车间质检手册 V3.2", chapter: "第4章 · 异常肉品判定" },
      { id: "c2", title: "GB/T 17236-2019", chapter: "生猪屠宰操作规程 §6.3" },
      { id: "c3", title: "厂内缺陷图库", chapter: "PSE 样本 #218" },
    ],
    actions: [
      { label: "标记 PSE 并隔离", tone: "danger" },
      { label: "转交兽医复核", tone: "warn" },
      { label: "重新拍摄", tone: "ghost" },
    ],
  },
];

/* ────────────────────────────── page ────────────────────────────── */
export function SmartQA() {
  const [activeRole, setActiveRole] = useState("qc");
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [online, setOnline] = useState(true);
  const [ttsOn, setTtsOn] = useState(false);
  const [activeCite, setActiveCite] = useState<Cite | null>({
    id: "c1", title: "冷却车间质检手册 V3.2", chapter: "第4章 · 异常肉品判定"
  });
  const [queryLoading, setQueryLoading] = useState(false);
  const [streamStep, setStreamStep] = useState(0);
  const [rfidCtx, setRfidCtx] = useState({ batch: "#4092", farm: "X 农场 · 华北基地", hook: "A-407" });
  const [selectedHistory, setSelectedHistory] = useState("h1");
  const [msgs, setMsgs] = useState<Msg[]>(INITIAL_MSGS);
  const [conversationHistory, setConversationHistory] = useState<{ question: string; answer: string }[]>([]);
  const [lastToolCalls, setLastToolCalls] = useState<ApiToolCall[]>([]);

  const submitQuery = useCallback(async (text?: string) => {
    const q = (text != null && text !== "" ? text : input).trim();
    if (!q || queryLoading) return;
    setInput("");
    setQueryLoading(true);
    setStreamStep(0);
    const stepTimer = window.setInterval(() => {
      setStreamStep((s) => (s < 4 ? s + 1 : s));
    }, 500);

    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      role: "user",
      time: formatClock(),
      text: q,
    };
    setMsgs((prev) => [...prev, userMsg]);

    try {
      const result = await graphragApi.query(q, conversationHistory);
      const cites: Cite[] = (result.cited_nodes ?? []).slice(0, 8).map((id) => ({
        id,
        title: "知识图谱节点",
        chapter: id,
      }));
      const aiMsg: Msg = {
        id: result.id || `a-${Date.now()}`,
        role: "ai",
        time: formatClock(),
        text: result.answer,
        cites: cites.length ? cites : undefined,
        confidence: 90,
      };
      setMsgs((prev) => [...prev, aiMsg]);
      setConversationHistory((h) => [...h, { question: q, answer: result.answer }]);
      setLastToolCalls(result.tool_calls ?? []);
      if (cites[0]) setActiveCite(cites[0]);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : (err as Error).message;
      toast.error(msg);
      setMsgs((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "ai",
          time: formatClock(),
          text: `GraphRAG 请求失败：${msg}\n请确认后端已启动（默认 ${import.meta.env?.VITE_GRAPHRAG_API_BASE || "http://localhost:8000/api/v1"}）且知识库已就绪。`,
        },
      ]);
      setLastToolCalls([]);
    } finally {
      window.clearInterval(stepTimer);
      setQueryLoading(false);
      setStreamStep(0);
    }
  }, [input, queryLoading, conversationHistory]);

  /* long-press mic */
  const micTimer = useRef<number | null>(null);
  const startListen = () => {
    setListening(true);
    setVoiceText("");
    setVoiceProgress(0);
    const phrases = ["这块肉", "这块肉颜色发白", "这块肉颜色发白，渗水严重", "这块肉颜色发白，渗水严重，帮我判断一下。"];
    let i = 0;
    micTimer.current = window.setInterval(() => {
      i++;
      if (i <= phrases.length) {
        setVoiceText(phrases[i - 1]);
        setVoiceProgress((i / phrases.length) * 100);
      }
    }, 600);
  };
  const stopListen = () => {
    if (micTimer.current) window.clearInterval(micTimer.current);
    micTimer.current = null;
    if (voiceText) {
      setInput(voiceText);
    }
    setTimeout(() => { setListening(false); setVoiceText(""); }, voiceText ? 1400 : 200);
  };

  return (
    <div className="h-full w-full overflow-hidden flex flex-col" style={{ background: "#FAFAFA", color: "#111827" }}>
      <style>{`
        @keyframes qa-wave { 0%,100%{transform:scaleY(.4)} 50%{transform:scaleY(1)} }
        @keyframes qa-ring { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.6);opacity:0} }
        @keyframes qa-scan { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes qa-blink { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes qa-bbox { 0%{stroke-dashoffset:40} 100%{stroke-dashoffset:0} }
        @keyframes qa-type { 0%{opacity:0;transform:translateY(4px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes qa-dot { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
        .qa-glass { background: rgba(255,255,255,.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid #e5e7eb; box-shadow: 0 10px 40px rgba(15,23,42,.08); }
        .qa-card { background: #ffffff; border: 1px solid #e5e7eb; }
        .qa-btn-touch { min-width: 64px; min-height: 64px; }
        .qa-chip { background: #ffffff; border: 1px solid #e5e7eb; transition: all .18s ease; }
        .qa-chip:hover { border-color: #06b6d4; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(6,182,212,.14); }
        @keyframes qa-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes qa-pulse-dot { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,.55); } 50% { box-shadow: 0 0 0 6px rgba(16,185,129,0); } }
        @keyframes qa-shimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }
        @keyframes qa-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .qa-card { transition: box-shadow .2s ease, transform .2s ease, border-color .2s ease; }
        .qa-card:hover { box-shadow: 0 6px 22px rgba(15,23,42,.08); }
        .qa-btn-touch { transition: transform .15s ease, box-shadow .15s ease; }
        .qa-btn-touch:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(6,182,212,.18); }
        .qa-btn-touch:active { transform: translateY(0) scale(.97); }
        button { transition: background .15s ease, color .15s ease, border-color .15s ease, transform .1s ease; }
        button:active { transform: scale(.97); }
        .qa-msg { animation: qa-fadein .32s ease both; }
        .qa-live-dot { animation: qa-pulse-dot 1.6s infinite; }
        .qa-confbar > span { transition: width .6s cubic-bezier(.2,.8,.2,1); }
        .qa-shimmer { background: linear-gradient(90deg,#f3f4f6 0%,#e5e7eb 40%,#f3f4f6 80%); background-size: 400px 100%; animation: qa-shimmer 1.4s infinite linear; }
        .qa-float { animation: qa-float 3.2s ease-in-out infinite; }
      `}</style>

      {/* ═══════ top bar: context strip ═══════ */}
      <div className="h-12 border-b flex items-center gap-3 px-4 shrink-0" style={{ borderColor: "#e5e7eb", background: "#ffffff" }}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Sparkles className="w-4 h-4" style={{ color: "#06b6d4" }} />
            <div className="absolute inset-0 animate-pulse" style={{ background: "radial-gradient(circle,#06b6d4,transparent)", opacity: .3 }} />
          </div>
          <span className="text-sm" style={{ color: "#111827" }}>多模态生产助手</span>
          <span className="px-2 py-0.5 rounded text-[10px]" style={{ background: "#ecfeff", color: "#0891b2", border: "1px solid #a5f3fc" }}>RAG · GB-LLM-7B</span>
        </div>

        <div className="flex-1 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full qa-chip">
            <ScanLine className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
            <span className="text-[11px]" style={{ color: "#6b7280" }}>RFID 已关联</span>
            <span className="text-[11px]" style={{ color: "#0891b2" }}>批次 {rfidCtx.batch}</span>
            <span className="text-[11px]" style={{ color: "#d1d5db" }}>·</span>
            <span className="text-[11px]" style={{ color: "#6b7280" }}>挂钩 {rfidCtx.hook}</span>
            <span className="text-[11px]" style={{ color: "#d1d5db" }}>·</span>
            <span className="text-[11px]" style={{ color: "#6b7280" }}>{rfidCtx.farm}</span>
          </div>
          <div className="flex items-center gap-2">
            {ROLES.map(r => {
              const Icon = r.icon;
              const on = activeRole === r.id;
              return (
                <button key={r.id} onClick={() => setActiveRole(r.id)}
                  className="h-7 px-2 rounded flex items-center gap-1.5 transition-all"
                  style={{
                    background: on ? `${r.color}14` : "#ffffff",
                    border: `1px solid ${on ? r.color : "#e5e7eb"}`,
                    color: on ? r.color : "#6b7280",
                  }}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{r.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setTtsOn(!ttsOn)} className="h-7 px-2 rounded flex items-center gap-1"
            style={{ background: ttsOn ? "#ecfeff" : "#ffffff", border: `1px solid ${ttsOn ? "#a5f3fc" : "#e5e7eb"}`, color: ttsOn ? "#0891b2" : "#6b7280" }}>
            <Volume2 className="w-3.5 h-3.5" />
            <span className="text-[11px]">大音量播报</span>
          </button>
          <button onClick={() => setOnline(!online)} className="h-7 px-2 rounded flex items-center gap-1"
            style={{ background: online ? "#ecfdf5" : "#fff7ed", border: `1px solid ${online ? "#a7f3d0" : "#fed7aa"}`, color: online ? "#059669" : "#ea580c" }}>
            {online ? <Radio className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{online ? "云端在线" : "离线降级"}</span>
          </button>
        </div>
      </div>

      {/* offline banner */}
      {!online && (
        <div className="px-4 py-2 flex items-center gap-2 border-b" style={{ background: "#fff7ed", borderColor: "#fed7aa", color: "#c2410c" }}>
          <WifiOff className="w-4 h-4" />
          <span className="text-[12px]">⚠️ 已切换至本地离线模式 · 仅可检索缓存 SOP · 图像分析已禁用</span>
        </div>
      )}

      {/* ═══════ body ═══════ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── left: history ── */}
        <aside className="w-64 border-r flex flex-col shrink-0" style={{ borderColor: "#e5e7eb", background: "#ffffff" }}>
          <div className="p-3 border-b" style={{ borderColor: "#e5e7eb" }}>
            <button className="w-full h-10 rounded-lg flex items-center justify-center gap-2 transition"
              style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)", color: "#fff", boxShadow: "0 4px 12px rgba(6,182,212,.25)" }}>
              <Plus className="w-4 h-4" />
              <span className="text-[13px]">新会话</span>
            </button>
          </div>

          <div className="px-3 pt-3 pb-1">
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>快捷指令</div>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_CMDS.map((q, i) => {
                const Icon = q.icon;
                const tone = q.tone === "danger" ? "#ef4444" : "#06b6d4";
                return (
                  <button key={i} className="p-2 rounded text-left transition hover:border-cyan-400"
                    style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
                    <Icon className="w-3.5 h-3.5 mb-1" style={{ color: tone }} />
                    <div className="text-[10px] leading-tight" style={{ color: "#374151" }}>{q.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-auto px-2 pb-3">
            {HISTORY.map((g, gi) => (
              <div key={gi} className="mt-4">
                <div className="px-2 text-[10px] uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>{g.group}</div>
                {g.items.map(it => {
                  const on = selectedHistory === it.id;
                  const tone = it.tone === "danger" ? "#ef4444" : it.tone === "warn" ? "#f59e0b" : "#10b981";
                  return (
                    <button key={it.id} onClick={() => setSelectedHistory(it.id)}
                      className="w-full text-left p-2 rounded mb-1 transition"
                      style={{ background: on ? "#ecfeff" : "transparent", border: `1px solid ${on ? "#a5f3fc" : "transparent"}` }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: `${tone}14`, color: tone, border: `1px solid ${tone}44` }}>{it.tag}</span>
                        <Clock className="w-2.5 h-2.5" style={{ color: "#9ca3af" }} />
                        <span className="text-[10px]" style={{ color: "#9ca3af" }}>{it.time}</span>
                      </div>
                      <div className="text-[12px] leading-snug" style={{ color: "#374151" }}>{it.title}</div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* ── center: conversation ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* messages */}
          <div className="flex-1 overflow-auto px-6 py-5 space-y-5" style={{ background: "#FAFAFA" }}>
            {msgs.map(m => <MessageRow key={m.id} msg={m} onCite={setActiveCite} />)}

            {queryLoading && <RagSkeleton step={Math.min(streamStep, 3)} />}

            {/* suggested follow-ups */}
            <div className="flex flex-wrap gap-2 pt-2">
              {["PSE 肉发生率近 7 天趋势", "该批次同来源其他猪体温记录", "触发 SOP 隔离并生成工单"].map((s, i) => (
                <button key={i} onClick={() => void submitQuery(s)}
                  className="px-3 py-1.5 rounded-full text-[12px] transition qa-chip hover:border-cyan-500"
                  style={{ color: "#374151" }}>
                  <Sparkles className="inline w-3 h-3 mr-1" style={{ color: "#06b6d4" }} />{s}
                </button>
              ))}
            </div>
          </div>

          {/* ── input bar (industrial multimodal) ── */}
          <div className="border-t p-4 shrink-0" style={{ borderColor: "#e5e7eb", background: "#ffffff" }}>
            {/* voice overlay */}
            {listening && (
              <div className="absolute inset-x-0 bottom-36 flex justify-center pointer-events-none z-30">
                <div className="qa-glass px-8 py-6 rounded-2xl flex flex-col items-center" style={{ minWidth: 540 }}>
                  <div className="flex items-center gap-1 mb-3 h-10">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="w-1 rounded-full" style={{
                        height: 32, background: "#06b6d4",
                        animation: `qa-wave ${0.5 + (i % 5) * 0.08}s ease-in-out infinite`,
                        animationDelay: `${i * 0.04}s`, transformOrigin: "center",
                      }} />
                    ))}
                  </div>
                  <div className="text-[22px] mb-2" style={{ color: "#111827", minHeight: 32 }}>
                    {voiceText || "正在聆听…"}
                  </div>
                  <div className="text-[11px] mb-2" style={{ color: "#6b7280" }}>环境噪音 72 dB · 已启用声源降噪</div>
                  <div className="w-80 h-1 rounded-full overflow-hidden" style={{ background: "#e5e7eb" }}>
                    <div className="h-full transition-all" style={{ width: `${voiceProgress}%`, background: "linear-gradient(90deg,#06b6d4,#67e8f9)" }} />
                  </div>
                  <div className="text-[10px] mt-2" style={{ color: "#9ca3af" }}>松开发送 · 识别结果将以大号文字确认</div>
                </div>
              </div>
            )}

            <div className="flex items-end gap-3">
              {/* scan rfid */}
              <button className="qa-btn-touch rounded-xl flex flex-col items-center justify-center gap-0.5 transition hover:border-cyan-500"
                style={{ background: "#ffffff", border: "1px solid #e5e7eb", color: "#6b7280", width: 72, height: 72 }}>
                <ScanLine className="w-6 h-6" style={{ color: "#10b981" }} />
                <span className="text-[10px]">扫码/RFID</span>
              </button>

              {/* camera */}
              <button className="qa-btn-touch rounded-xl flex flex-col items-center justify-center gap-0.5 transition hover:border-cyan-500"
                style={{ background: "#ffffff", border: "1px solid #e5e7eb", color: "#6b7280", width: 72, height: 72 }}>
                <Camera className="w-6 h-6" style={{ color: "#06b6d4" }} />
                <span className="text-[10px]">工业相机</span>
              </button>

              {/* mic — the core button */}
              <button
                onMouseDown={startListen} onMouseUp={stopListen}
                onTouchStart={startListen} onTouchEnd={stopListen}
                className="relative rounded-2xl flex flex-col items-center justify-center transition select-none"
                style={{
                  flex: 1, height: 72,
                  background: listening
                    ? "linear-gradient(135deg,#06b6d4,#0891b2)"
                    : "linear-gradient(135deg,#ecfeff,#cffafe)",
                  border: `2px solid ${listening ? "#0891b2" : "#67e8f9"}`,
                  color: listening ? "#ffffff" : "#0891b2",
                  boxShadow: listening ? "0 0 40px rgba(6,182,212,.4)" : "0 2px 8px rgba(6,182,212,.12)",
                }}>
                {listening && (
                  <>
                    <span className="absolute inset-0 rounded-2xl" style={{ border: "2px solid #06b6d4", animation: "qa-ring 1.4s ease-out infinite" }} />
                    <span className="absolute inset-0 rounded-2xl" style={{ border: "2px solid #06b6d4", animation: "qa-ring 1.4s ease-out .4s infinite" }} />
                  </>
                )}
                <Mic className="w-8 h-8 mb-1" />
                <span className="text-[13px]">{listening ? "松开发送" : "长按说话 · Hey 助手"}</span>
              </button>

              {/* text */}
              <div className="flex items-center gap-2 px-3 rounded-xl" style={{ background: "#ffffff", border: "1px solid #e5e7eb", height: 72, minWidth: 260, flex: 1 }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                  placeholder="或输入文字…（戴手套可直接语音）"
                  className="flex-1 bg-transparent outline-none text-[14px]"
                  style={{ color: "#111827" }} />
                <button type="button" disabled={queryLoading} onClick={() => void submitQuery()} className="h-12 px-4 rounded-lg flex items-center gap-1.5 transition"
                  style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)", color: "#ffffff", boxShadow: "0 4px 12px rgba(6,182,212,.25)", opacity: queryLoading ? 0.7 : 1 }}>
                  <Send className="w-4 h-4" />
                  <span className="text-[12px]">发送</span>
                </button>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-3 text-[10px]" style={{ color: "#9ca3af" }}>
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" />数据不出厂区 · 合规审计留痕</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Languages className="w-3 h-3" />支持 普通话/英语/方言</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Headphones className="w-3 h-3" />环境噪音自适应</span>
            </div>
          </div>
        </main>

        {/* ── right: RAG source panel ── */}
        <aside className="w-80 border-l flex flex-col shrink-0" style={{ borderColor: "#e5e7eb", background: "#ffffff" }}>
          <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: "#e5e7eb" }}>
            <BookOpen className="w-4 h-4" style={{ color: "#06b6d4" }} />
            <span className="text-[13px]" style={{ color: "#111827" }}>RAG 知识溯源</span>
            <span className="ml-auto text-[10px]" style={{ color: "#9ca3af" }}>{lastToolCalls.length ? `${lastToolCalls.length} 步工具` : "GraphRAG"}</span>
          </div>

          {lastToolCalls.length > 0 && (
            <div className="p-3 border-b max-h-40 overflow-auto text-[10px] font-mono" style={{ borderColor: "#e5e7eb", background: "#f8fafc", color: "#475569" }}>
              {lastToolCalls.map((tc, i) => (
                <div key={i} className="mb-2">
                  <span style={{ color: "#0891b2" }}>{tc.step}. {tc.tool_name}</span>
                  <div className="opacity-90 line-clamp-3">{tc.tool_output}</div>
                </div>
              ))}
            </div>
          )}

          {activeCite && (
            <div className="p-3 border-b" style={{ borderColor: "#e5e7eb", background: "#f0fdff" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5" style={{ color: "#0891b2" }} />
                <span className="text-[11px]" style={{ color: "#0891b2" }}>{activeCite.title}</span>
              </div>
              <div className="text-[10px] mb-2" style={{ color: "#6b7280" }}>{activeCite.chapter}</div>
              <div className="qa-card rounded p-3 text-[11px] leading-relaxed" style={{ borderColor: "#a5f3fc", color: "#374151" }}>
                <div className="mb-2" style={{ background: "linear-gradient(90deg,#fef3c7,transparent)", padding: "2px 4px", borderRadius: 3 }}>
                  § 4.2.3　<span style={{ color: "#b45309" }}>PSE 肉的判定应依据胴体色泽 L* 值、滴水损失率与 pH45min</span> 综合判断。当 L* ≥ 50、滴水损失 &gt; 5%、pH45 &lt; 5.8 时，判定为 PSE 肉。
                </div>
                <div style={{ color: "#6b7280" }}>§ 4.2.4　确认为 PSE 肉的胴体应于 30 分钟内隔离至 B 区冷库，并由兽医复核签字放行或判废。</div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px]" style={{ color: "#9ca3af" }}>相似度 0.93 · Top-1</span>
                <button className="text-[10px] flex items-center gap-0.5" style={{ color: "#06b6d4" }}>
                  查看完整文档 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* knowledge graph mini */}
          <div className="p-3 border-b" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>关联知识图谱</div>
            <svg viewBox="0 0 260 140" className="w-full h-32">
              <defs>
                <radialGradient id="kg-glow">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity=".4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>
              </defs>
              {[
                { x: 70, y: 40 }, { x: 190, y: 30 },
                { x: 50, y: 100 }, { x: 210, y: 100 },
              ].map((p, i) => (
                <line key={i} x1={130} y1={70} x2={p.x} y2={p.y} stroke="#1e90ff" strokeWidth=".8" strokeDasharray="2 3" opacity=".5" />
              ))}
              <circle cx={130} cy={70} r={24} fill="url(#kg-glow)" />
              <circle cx={130} cy={70} r={14} fill="#06b6d4" />
              <text x={130} y={74} textAnchor="middle" fontSize={9} fill="#ffffff">PSE 肉</text>
              {[
                { x: 70, y: 40, l: "L* 值", c: "#f59e0b" },
                { x: 190, y: 30, l: "pH45", c: "#f59e0b" },
                { x: 50, y: 100, l: "应激反应", c: "#a855f7" },
                { x: 210, y: 100, l: "隔离 SOP", c: "#10b981" },
              ].map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r={9} fill={n.c} opacity=".2" />
                  <circle cx={n.x} cy={n.y} r={5} fill={n.c} />
                  <text x={n.x} y={n.y + 20} textAnchor="middle" fontSize={8} fill="#6b7280">{n.l}</text>
                </g>
              ))}
            </svg>
          </div>

          {/* confidence & safeguard */}
          <div className="p-3 border-b" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>安全兜底</div>
            <div className="space-y-2">
              <div className="qa-card rounded p-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: "#10b981" }} />
                <div className="flex-1">
                  <div className="text-[11px]" style={{ color: "#374151" }}>置信度 92%</div>
                  <div className="text-[9px]" style={{ color: "#9ca3af" }}>高于阈值 85% · 可辅助决策</div>
                </div>
              </div>
              <div className="qa-card rounded p-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" style={{ color: "#f59e0b" }} />
                <div className="flex-1">
                  <div className="text-[11px]" style={{ color: "#374151" }}>食品安全关键决策</div>
                  <div className="text-[9px]" style={{ color: "#9ca3af" }}>需兽医或质检主管双签</div>
                </div>
              </div>
              <div className="qa-card rounded p-2 flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: "#06b6d4" }} />
                <div className="flex-1">
                  <div className="text-[11px]" style={{ color: "#374151" }}>留痕编号 QA-20260421-0942</div>
                  <div className="text-[9px]" style={{ color: "#9ca3af" }}>对话与判定结果已归档</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3">
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>今日洞察</div>
            <div className="qa-card rounded p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px]" style={{ color: "#374151" }}>PSE 检出率</span>
                <span className="text-[11px]" style={{ color: "#f59e0b" }}>2.1% ↑</span>
              </div>
              <div className="flex items-end gap-0.5 h-8">
                {[40, 55, 45, 62, 70, 58, 85].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 6 ? "#f59e0b" : "#1e90ff88" }} />
                ))}
              </div>
              <div className="text-[9px] mt-1" style={{ color: "#9ca3af" }}>近 7 日 · 今日高于阈值，建议排查冷却链</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ────────────────────────────── message row ────────────────────────────── */
function MessageRow({ msg, onCite }: { msg: Msg; onCite: (c: Cite) => void }) {
  if (msg.role === "system") {
    return (
      <div className="flex justify-center">
        <div className="px-3 py-1 rounded-full text-[10px] flex items-center gap-1.5" style={{ background: "#ecfeff", color: "#0891b2", border: "1px solid #a5f3fc" }}>
          <Tag className="w-3 h-3" />{msg.text}
        </div>
      </div>
    );
  }

  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: isUser ? "#dbeafe" : "linear-gradient(135deg,#06b6d4,#0891b2)",
          border: `1px solid ${isUser ? "#93c5fd" : "#67e8f9"}`
        }}>
        {isUser ? <User className="w-4 h-4" style={{ color: "#1e90ff" }} /> : <Sparkles className="w-4 h-4 text-white" />}
      </div>

      <div className={`max-w-[78%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`} style={{ animation: "qa-type .3s ease-out" }}>
        <div className="flex items-center gap-2 text-[10px]" style={{ color: "#9ca3af" }}>
          <span>{isUser ? "质检员 · 李伟" : "生产助手 AI"}</span>
          <span>{msg.time}</span>
        </div>

        {msg.image && <ImageWithOverlay overlay={msg.overlay} compareRef={msg.compareRef} />}

        {msg.text && (
          <div className="px-4 py-3 rounded-xl text-[13px] leading-relaxed"
            style={{
              background: isUser ? "#eff6ff" : "#ffffff",
              border: `1px solid ${isUser ? "#bfdbfe" : "#e5e7eb"}`,
              color: "#111827",
              boxShadow: isUser ? "none" : "0 1px 2px rgba(15,23,42,.04)",
            }}>
            {msg.text}
          </div>
        )}

        {msg.cites && msg.cites.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.cites.map((c, i) => (
              <button key={c.id} onClick={() => onCite(c)}
                className="px-2 py-1 rounded-full text-[10px] flex items-center gap-1 transition hover:border-cyan-400"
                style={{ background: "#ecfeff", color: "#0891b2", border: "1px solid #a5f3fc" }}>
                <FileText className="w-2.5 h-2.5" />
                <span>[{i + 1}]</span>
                <span>{c.title}</span>
              </button>
            ))}
          </div>
        )}

        {msg.confidence !== undefined && (
          <div className="flex items-center gap-2 text-[10px]">
            <span style={{ color: "#9ca3af" }}>置信度</span>
            <div className="w-32 h-1 rounded-full overflow-hidden" style={{ background: "#e5e7eb" }}>
              <div className="h-full" style={{ width: `${msg.confidence}%`, background: msg.confidence >= 85 ? "linear-gradient(90deg,#10b981,#34d399)" : "#f59e0b" }} />
            </div>
            <span style={{ color: msg.confidence >= 85 ? "#059669" : "#d97706" }}>{msg.confidence}%</span>
            {msg.confidence >= 85 ? (
              <span className="ml-2 flex items-center gap-0.5 text-[10px]" style={{ color: "#059669" }}>
                <CheckCircle2 className="w-3 h-3" />可辅助决策
              </span>
            ) : (
              <span className="ml-2 flex items-center gap-0.5 text-[10px]" style={{ color: "#d97706" }}>
                <AlertTriangle className="w-3 h-3" />建议人工复核
              </span>
            )}
          </div>
        )}

        {msg.actions && (
          <div className="flex flex-wrap gap-2 pt-1">
            {msg.actions.map((a, i) => {
              const palette = a.tone === "danger"
                ? { bg: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", border: "#ef4444" }
                : a.tone === "warn"
                  ? { bg: "linear-gradient(135deg,#f59e0b,#ea580c)", color: "#fff", border: "#f59e0b" }
                  : a.tone === "ok"
                    ? { bg: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "#10b981" }
                    : { bg: "#ffffff", color: "#374151", border: "#e5e7eb" };
              return (
                <button key={i}
                  className="h-12 px-5 rounded-lg flex items-center gap-2 transition hover:scale-[1.02]"
                  style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}`, minWidth: 160 }}>
                  {a.tone === "danger" && <ShieldAlert className="w-4 h-4" />}
                  {a.tone === "warn" && <Stethoscope className="w-4 h-4" />}
                  {a.tone === "ghost" && <Camera className="w-4 h-4" />}
                  <span className="text-[13px]">{a.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-70" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────── image + CV overlay ────────────────────────────── */
function ImageWithOverlay({
  overlay, compareRef
}: { overlay?: Msg["overlay"]; compareRef?: string }) {
  return (
    <div className="flex gap-2">
      <div className="relative rounded-lg overflow-hidden" style={{ width: 320, height: 220, border: "1px solid #e5e7eb", boxShadow: "0 1px 2px rgba(15,23,42,.04)" }}>
        {/* synthetic pork-like image */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 30% 40%,#fecaca 0%,#f87171 30%,#b91c1c 70%,#7f1d1d 100%)",
        }} />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 35% 45%,rgba(254,226,226,.8) 0%,rgba(254,226,226,0) 35%)",
          mixBlendMode: "screen",
        }} />
        {/* white marbling */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 220">
          {Array.from({ length: 20 }).map((_, i) => (
            <path key={i}
              d={`M${20 + i * 15},${30 + (i % 3) * 60} q${15 + (i % 5) * 4},${-10 + i % 7} ${30},${5 + i % 10}`}
              stroke="#fef3c7" strokeWidth=".8" fill="none" opacity=".6" />
          ))}
        </svg>
        {/* bounding boxes */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {overlay?.map((o, i) => (
            <g key={i}>
              <rect x={o.x} y={o.y} width={o.w} height={o.h}
                fill="none" stroke={o.color} strokeWidth=".4" strokeDasharray="2 1"
                style={{ animation: "qa-bbox 1.2s linear infinite" }} />
              <rect x={o.x} y={o.y - 5} width={o.label.length * 2.4} height="4" fill={o.color} />
              <text x={o.x + 0.8} y={o.y - 1.6} fontSize="2.4" fill="#fff">{o.label}</text>
            </g>
          ))}
        </svg>
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] flex items-center gap-1" style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}>
          <Camera className="w-2.5 h-2.5" />09:42 · 工业相机 #3
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[9px]" style={{ background: "rgba(239,68,68,.9)", color: "#fff" }}>
          现场样本
        </div>
      </div>

      {compareRef && (
        <div className="relative rounded-lg overflow-hidden" style={{ width: 220, height: 220, border: "1px solid #a5f3fc", boxShadow: "0 1px 2px rgba(15,23,42,.04)" }}>
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at 40% 40%,#fecaca 0%,#fca5a5 40%,#ef4444 80%,#991b1b 100%)",
            filter: "saturate(.6) brightness(.9)",
          }} />
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 220 220">
            {Array.from({ length: 14 }).map((_, i) => (
              <path key={i}
                d={`M${15 + i * 14},${40 + (i % 4) * 45} q${18 + i % 5},${-12 + i} ${30},${8}`}
                stroke="#fef3c7" strokeWidth="1" fill="none" opacity=".8" />
            ))}
          </svg>
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px]" style={{ background: "rgba(6,182,212,.9)", color: "#ffffff" }}>
            知识库参考 · PSE 标准样本
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[9px]" style={{ background: "rgba(255,255,255,.9)", color: "#0891b2" }}>
            #218
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────── RAG streaming skeleton ────────────────────────────── */
function RagSkeleton({ step }: { step: number }) {
  const steps = [
    { icon: ScanLine, label: "解析多模态输入 · 图像 + 语音" },
    { icon: BookOpen, label: "检索肉品缺陷图库 · 218 条候选" },
    { icon: FileText, label: "比对《工厂异常肉品处理 SOP》" },
    { icon: Sparkles, label: "生成带引用的决策建议" },
  ];
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#06b6d4,#0284c7)" }}>
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 px-4 py-3 rounded-xl" style={{ background: "#ffffff", border: "1px solid #e5e7eb", maxWidth: 520, boxShadow: "0 1px 2px rgba(15,23,42,.04)" }}>
        <div className="flex items-center gap-1 mb-3">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "#06b6d4", animation: `qa-dot 1.2s ease-in-out ${i * 0.16}s infinite` }} />
          ))}
          <span className="ml-2 text-[11px]" style={{ color: "#6b7280" }}>RAG 流水线运行中</span>
        </div>
        <div className="space-y-1.5">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className="flex items-center gap-2 text-[11px]"
                style={{ color: done ? "#059669" : active ? "#0891b2" : "#9ca3af", opacity: done || active ? 1 : .6 }}>
                <Icon className="w-3.5 h-3.5" />
                <span>{s.label}</span>
                {active && <span className="ml-auto" style={{ animation: "qa-blink 1s ease-in-out infinite" }}>●</span>}
                {done && <CheckCircle2 className="w-3 h-3 ml-auto" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
