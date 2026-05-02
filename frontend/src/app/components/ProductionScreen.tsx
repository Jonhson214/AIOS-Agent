import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Thermometer,
  Info,
  Truck,
  Snowflake,
  Radio,
  Cpu,
  Factory,
  Gauge,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const COLORS = {
  bg: "#0B1426",
  panel: "rgba(17,34,64,0.65)",
  border: "rgba(0,245,255,0.25)",
  cyan: "#00F5FF",
  orange: "#FF8C00",
  blue: "#1E90FF",
  green: "#00FF77",
  red: "#FF4D6D",
  purple: "#B084FF",
  text: "#E6F1FF",
  dim: "#6B87B8",
};

function Panel({
  title,
  icon: Icon,
  children,
  accent = COLORS.cyan,
  className = "",
}: {
  title: string;
  icon?: typeof Activity;
  children: React.ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded ${className}`}
      style={{
        background: `linear-gradient(180deg, rgba(0,245,255,0.04), rgba(11,20,38,0.6))`,
        border: `1px solid ${accent}33`,
        boxShadow: `inset 0 0 20px ${accent}11`,
      }}
    >
      {/* corners */}
      {(["tl", "tr", "bl", "br"] as const).map((p) => (
        <span
          key={p}
          className="absolute w-3 h-3"
          style={{
            borderColor: accent,
            borderStyle: "solid",
            ...(p === "tl" ? { top: -1, left: -1, borderWidth: "1.5px 0 0 1.5px" } : {}),
            ...(p === "tr" ? { top: -1, right: -1, borderWidth: "1.5px 1.5px 0 0" } : {}),
            ...(p === "bl" ? { bottom: -1, left: -1, borderWidth: "0 0 1.5px 1.5px" } : {}),
            ...(p === "br" ? { bottom: -1, right: -1, borderWidth: "0 1.5px 1.5px 0" } : {}),
          }}
        />
      ))}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${accent}22` }}>
        {Icon && <Icon size={14} style={{ color: accent }} />}
        <span className="text-sm tracking-wider" style={{ color: COLORS.text }}>
          {title}
        </span>
        <span className="ml-auto text-[10px]" style={{ color: accent }}>● LIVE</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function Digits({ value, color = COLORS.cyan }: { value: string | number; color?: string }) {
  return (
    <span
      className="tabular-nums"
      style={{
        color,
        textShadow: `0 0 8px ${color}, 0 0 16px ${color}88`,
        letterSpacing: "0.05em",
      }}
    >
      {value}
    </span>
  );
}

const FEED_TEMPLATES = [
  { lvl: "warn", txt: "AI视觉报警：2号打毛机漏毛率偏高，建议检查转速" },
  { lvl: "info", txt: "批次追溯：批次 #20260419-A 已全部入库，共 15 吨" },
  { lvl: "warn", txt: "测温报警：3号冷链月台门未关闭，温度上升中" },
  { lvl: "info", txt: "同步卫检：B-412 批次全部合格放行 120 头" },
  { lvl: "crit", txt: "冷链红线：排酸库 A-05 温度触碰 4°C 安全阈值" },
  { lvl: "info", txt: "设备启动：分割线 #CU-01 自动复产" },
  { lvl: "warn", txt: "出肉率波动：当前 62.1%，低于基准 62.5%" },
  { lvl: "info", txt: "能耗统计：本时段电耗 1,248 kWh，环比 -3.2%" },
];

type FeedItem = { id: number; ts: string; lvl: string; txt: string };

function ts(d: Date) {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function ProductionScreen() {
  const [now, setNow] = useState(new Date());
  const [slaughter, setSlaughter] = useState(8452);
  const [inProcess, setInProcess] = useState(2105);
  const [pace, setPace] = useState(650);
  const [chill1, setChill1] = useState<{ t: number; A: number; B: number; C: number; D: number }[]>(
    Array.from({ length: 30 }, (_, i) => ({
      t: i,
      A: 1.8 + Math.random() * 0.5,
      B: 2.1 + Math.random() * 0.4,
      C: 0.9 + Math.random() * 0.4,
      D: 1.5 + Math.random() * 0.4,
    }))
  );
  const [feed, setFeed] = useState<FeedItem[]>(
    FEED_TEMPLATES.slice(0, 6).map((f, i) => ({
      id: i,
      ts: ts(new Date(Date.now() - i * 90000)),
      lvl: f.lvl,
      txt: f.txt,
    }))
  );
  const [devices, setDevices] = useState<Array<"ok" | "idle" | "err">>(
    Array.from({ length: 48 }, () => {
      const r = Math.random();
      return r < 0.82 ? "ok" : r < 0.94 ? "idle" : "err";
    })
  );
  const [particleTick, setParticleTick] = useState(0);

  useEffect(() => {
    const clk = setInterval(() => setNow(new Date()), 1000);
    const dyn = setInterval(() => {
      setSlaughter((v) => v + Math.round(Math.random() * 5 + 1));
      setInProcess((v) => Math.max(1800, v + (Math.random() > 0.5 ? 1 : -1) * Math.round(Math.random() * 8)));
      setPace((v) => Math.max(580, Math.min(720, v + Math.round((Math.random() - 0.5) * 20))));
      setChill1((prev) => {
        const n = prev.slice(1);
        const last = prev[prev.length - 1];
        n.push({
          t: last.t + 1,
          A: Math.max(0.3, Math.min(4.5, last.A + (Math.random() - 0.5) * 0.4)),
          B: Math.max(0.3, Math.min(4.5, last.B + (Math.random() - 0.5) * 0.4)),
          C: Math.max(0.3, Math.min(4.5, last.C + (Math.random() - 0.5) * 0.3)),
          D: Math.max(0.3, Math.min(4.5, last.D + (Math.random() - 0.3) * 0.5)),
        });
        return n;
      });
      setParticleTick((t) => t + 1);
    }, 1200);
    const feedTimer = setInterval(() => {
      setFeed((prev) => {
        const tpl = FEED_TEMPLATES[Math.floor(Math.random() * FEED_TEMPLATES.length)];
        const next: FeedItem = { id: Date.now(), ts: ts(new Date()), lvl: tpl.lvl, txt: tpl.txt };
        return [next, ...prev].slice(0, 7);
      });
    }, 3500);
    const devTimer = setInterval(() => {
      setDevices((prev) => {
        const next = [...prev];
        const i = Math.floor(Math.random() * next.length);
        const r = Math.random();
        next[i] = r < 0.82 ? "ok" : r < 0.94 ? "idle" : "err";
        return next;
      });
    }, 800);
    return () => {
      clearInterval(clk);
      clearInterval(dyn);
      clearInterval(feedTimer);
      clearInterval(devTimer);
    };
  }, []);

  const target = 10000;
  const pct = (slaughter / target) * 100;
  const gaugeData = [{ name: "完成", value: pct, fill: COLORS.cyan }];

  const funnel = [
    { n: "进厂活猪", p: 100, w: 1000, c: COLORS.cyan },
    { n: "白条(放血去脏后)", p: 74, w: 740, c: COLORS.blue },
    { n: "排酸冷耗后白条", p: 72.5, w: 725, c: "#66D9EF" },
    { n: "细分割净肉", p: 62, w: 620, c: COLORS.green },
  ];

  const oee = [
    { n: "屠宰车间", 设备: 92, 人员: 88 },
    { n: "排酸出库", 设备: 86, 人员: 81 },
    { n: "分割包装", 设备: 94, 人员: 90 },
  ];

  const rose = [
    { n: "甲状腺未除净", v: 32, c: COLORS.orange },
    { n: "局部病变", v: 18, c: COLORS.red },
    { n: "内脏异常", v: 14, c: "#FFB347" },
    { n: "淋巴结检出", v: 9, c: COLORS.purple },
    { n: "外观破损", v: 7, c: COLORS.blue },
  ];

  const roseTotal = rose.reduce((s, r) => s + r.v, 0);

  return (
    <div
      className="relative -m-6 p-6 overflow-hidden"
      style={{
        minHeight: "calc(100vh - 56px)",
        background: `radial-gradient(ellipse at top, #0F1E3D 0%, ${COLORS.bg} 60%)`,
        color: COLORS.text,
      }}
    >
      {/* grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(${COLORS.cyan}22 1px, transparent 1px), linear-gradient(90deg, ${COLORS.cyan}22 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <style>{`
        @keyframes dashmove { to { stroke-dashoffset: -40; } }
        @keyframes breathe { 0%,100% { opacity:0.55 } 50% { opacity:1 } }
        @keyframes glow-pulse { 0%,100% { box-shadow: 0 0 4px currentColor } 50% { box-shadow: 0 0 14px currentColor } }
        @keyframes floatDot { from { offset-distance: 0% } to { offset-distance: 100% } }
        @keyframes scroll-up { 0% { transform: translateY(20px); opacity: 0 } 15% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(0); opacity: 1 } }
        .moving-line { stroke-dasharray: 8 6; animation: dashmove 1.5s linear infinite; }
        .breathe { animation: breathe 2.4s ease-in-out infinite; }
        .feed-new { animation: scroll-up 0.6s ease-out; }
      `}</style>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${COLORS.cyan}33, ${COLORS.blue}33)`, border: `1px solid ${COLORS.cyan}66` }}
          >
            <Factory size={22} style={{ color: COLORS.cyan }} />
          </div>
          <div>
            <div className="text-xs" style={{ color: COLORS.dim }}>MUYUAN · COMMAND CENTER</div>
            <div className="text-2xl tracking-[0.3em]" style={{ color: COLORS.text, textShadow: `0 0 10px ${COLORS.cyan}66` }}>
              牧原肉食生产指挥调度中枢
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Radio size={14} style={{ color: COLORS.green }} className="breathe" />
            <span className="text-xs" style={{ color: COLORS.dim }}>系统在线</span>
          </div>
          <div className="flex items-center gap-2">
            <Snowflake size={14} style={{ color: COLORS.blue }} />
            <span className="text-xs" style={{ color: COLORS.dim }}>冷链在线</span>
          </div>
          <div className="tabular-nums text-lg" style={{ color: COLORS.cyan, textShadow: `0 0 8px ${COLORS.cyan}88` }}>
            {ts(now)}
          </div>
          <div className="text-xs" style={{ color: COLORS.dim }}>
            {now.getFullYear()}-{String(now.getMonth() + 1).padStart(2, "0")}-{String(now.getDate()).padStart(2, "0")}
          </div>
        </div>
      </div>

      <div className="relative grid grid-cols-12 gap-4" style={{ minHeight: "calc(100vh - 180px)" }}>
        {/* LEFT */}
        <div className="col-span-3 space-y-4">
          <Panel title="屠宰产能仪表" icon={Gauge} accent={COLORS.cyan}>
            <div className="relative" style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="80%"
                  innerRadius="90%"
                  outerRadius="140%"
                  startAngle={180}
                  endAngle={0}
                  data={gaugeData}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background={{ fill: "#1a2f52" }} dataKey="value" cornerRadius={8} fill={COLORS.cyan} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-x-0 bottom-6 text-center">
                <div className="text-4xl"><Digits value={pct.toFixed(1) + "%"} /></div>
                <div className="text-xs mt-1" style={{ color: COLORS.dim }}>目标 {target.toLocaleString()} 头</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <div className="p-2 rounded" style={{ background: "rgba(0,245,255,0.06)", border: `1px solid ${COLORS.cyan}22` }}>
                <div style={{ color: COLORS.dim }}>当前头数</div>
                <div className="text-base mt-1"><Digits value={slaughter.toLocaleString()} /></div>
              </div>
              <div className="p-2 rounded" style={{ background: "rgba(0,245,255,0.06)", border: `1px solid ${COLORS.cyan}22` }}>
                <div style={{ color: COLORS.dim }}>当前节拍</div>
                <div className="text-base mt-1"><Digits value={`${pace} 头/h`} color={COLORS.green} /></div>
              </div>
            </div>
          </Panel>

          <Panel title="出肉率与损耗漏斗" icon={Activity} accent={COLORS.blue}>
            <div className="space-y-2">
              {funnel.map((f, i) => {
                const width = 100 - i * 12;
                return (
                  <div key={f.n} className="flex items-center gap-3">
                    <div style={{ width: `${width}%` }}>
                      <div
                        className="relative h-9 flex items-center justify-between px-3 overflow-hidden"
                        style={{
                          background: `linear-gradient(90deg, ${f.c}44, ${f.c}11)`,
                          border: `1px solid ${f.c}77`,
                          clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)",
                        }}
                      >
                        <span className="text-xs" style={{ color: COLORS.text }}>{f.n}</span>
                        <span className="text-sm tabular-nums" style={{ color: f.c, textShadow: `0 0 6px ${f.c}` }}>
                          {f.p}%
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] tabular-nums" style={{ color: COLORS.dim }}>
                      {f.w}t
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 text-xs flex justify-between" style={{ borderTop: `1px dashed ${COLORS.border}` }}>
              <span style={{ color: COLORS.dim }}>综合出肉率</span>
              <span><Digits value="62.0%" color={COLORS.green} /></span>
            </div>
          </Panel>

          <Panel title="各车间 OEE 综合效率" icon={Cpu} accent={COLORS.purple}>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={oee} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2f52" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke={COLORS.dim} fontSize={10} />
                  <YAxis type="category" dataKey="n" stroke={COLORS.dim} fontSize={11} width={70} />
                  <Tooltip contentStyle={{ background: "#0B1426", border: `1px solid ${COLORS.cyan}66`, borderRadius: 4, fontSize: 11 }} />
                  <Bar dataKey="设备" fill={COLORS.cyan} radius={[0, 2, 2, 0]} />
                  <Bar dataKey="人员" fill={COLORS.purple} radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* CENTER */}
        <div className="col-span-6 space-y-4">
          {/* Top bubbles */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "今日已屠宰", v: slaughter.toLocaleString(), u: "头", c: COLORS.cyan, I: Factory },
              { label: "当前在制白条", v: inProcess.toLocaleString(), u: "具", c: COLORS.blue, I: Activity },
              { label: "成品入库", v: "1,842", u: "箱", c: COLORS.green, I: PackageCheck },
            ].map((b) => (
              <div
                key={b.label}
                className="relative rounded p-4 flex items-center gap-3 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${b.c}22, transparent)`,
                  border: `1px solid ${b.c}66`,
                  boxShadow: `inset 0 0 20px ${b.c}22, 0 0 20px ${b.c}11`,
                }}
              >
                <b.I size={28} style={{ color: b.c }} />
                <div className="flex-1">
                  <div className="text-xs" style={{ color: COLORS.dim }}>{b.label}</div>
                  <div className="text-3xl mt-0.5">
                    <Digits value={b.v} color={b.c} />
                    <span className="text-sm ml-1" style={{ color: COLORS.dim }}>{b.u}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 3D Factory */}
          <Panel title="全厂生产流数字孪生" icon={Factory} accent={COLORS.cyan} className="flex-1">
            <div className="relative" style={{ height: 440 }}>
              <svg viewBox="0 0 900 440" className="w-full h-full">
                <defs>
                  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0F1E3D" />
                    <stop offset="100%" stopColor="#050A14" />
                  </linearGradient>
                  <linearGradient id="blueHeat" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={COLORS.blue} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={COLORS.blue} stopOpacity="0.05" />
                  </linearGradient>
                  <radialGradient id="redHeat" cx="50%" cy="50%">
                    <stop offset="0%" stopColor={COLORS.red} stopOpacity="0.65" />
                    <stop offset="100%" stopColor={COLORS.red} stopOpacity="0" />
                  </radialGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* perspective floor */}
                <polygon points="60,420 840,420 760,120 140,120" fill="url(#floor)" stroke={COLORS.cyan} strokeOpacity="0.3" />
                {/* floor grid */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <line
                    key={`h${i}`}
                    x1={140 + i * 10}
                    y1={120 + i * 38}
                    x2={760 - i * 10}
                    y2={120 + i * 38}
                    stroke={COLORS.cyan}
                    strokeOpacity="0.08"
                  />
                ))}

                {/* Stations */}
                {[
                  { x: 130, label: "静养圈", color: COLORS.cyan },
                  { x: 280, label: "屠宰线", color: COLORS.cyan },
                  { x: 430, label: "卫检线", color: COLORS.green },
                  { x: 580, label: "排酸库", color: COLORS.blue, heat: "blue" },
                  { x: 730, label: "分割线", color: COLORS.purple, heat: "red" },
                ].map((s, i) => (
                  <g key={s.label}>
                    {/* building */}
                    <rect x={s.x - 55} y={180} width="110" height="90" fill="#12233F" stroke={s.color} strokeOpacity="0.6" />
                    <rect x={s.x - 55} y={160} width="110" height="20" fill={s.color} fillOpacity="0.2" stroke={s.color} strokeOpacity="0.6" />
                    <polygon points={`${s.x - 55},160 ${s.x - 45},145 ${s.x + 65},145 ${s.x + 55},160`} fill={s.color} fillOpacity="0.12" stroke={s.color} strokeOpacity="0.5" />
                    {/* windows */}
                    {[0, 1, 2].map((w) => (
                      <rect key={w} x={s.x - 42 + w * 32} y={200} width="22" height="18" fill={s.color} fillOpacity={0.15 + Math.sin(particleTick / 3 + i + w) * 0.1} />
                    ))}
                    {/* heat overlay */}
                    {s.heat === "blue" && <rect x={s.x - 65} y={130} width="130" height="160" fill="url(#blueHeat)" className="breathe" />}
                    {s.heat === "red" && <circle cx={s.x} cy={200} r="60" fill="url(#redHeat)" className="breathe" />}
                    {/* label */}
                    <text x={s.x} y={290} textAnchor="middle" fill={s.color} fontSize="13" style={{ filter: `drop-shadow(0 0 3px ${s.color})` }}>
                      {s.label}
                    </text>
                    <text x={s.x} y={305} textAnchor="middle" fill={COLORS.dim} fontSize="9">STATION 0{i + 1}</text>
                  </g>
                ))}

                {/* conveyor line */}
                <line x1="130" y1="270" x2="730" y2="270" stroke={COLORS.cyan} strokeOpacity="0.4" strokeWidth="1" />
                <line
                  x1="130" y1="270" x2="730" y2="270"
                  stroke={COLORS.cyan}
                  strokeWidth="2"
                  className="moving-line"
                  filter="url(#glow)"
                />

                {/* moving particles - pigs on line */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const offset = ((particleTick * 12 + i * 85) % 620);
                  const x = 130 + offset;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={270} r="4" fill={COLORS.cyan} filter="url(#glow)" />
                      <circle cx={x} cy={270} r="2" fill="#ffffff" />
                    </g>
                  );
                })}

                {/* station metrics floating */}
                {[
                  { x: 130, y: 115, v: "120 头", l: "静养中" },
                  { x: 280, y: 115, v: "650/h", l: "节拍" },
                  { x: 430, y: 115, v: "99.6%", l: "合格率" },
                  { x: 580, y: 115, v: `${chill1[chill1.length - 1].A.toFixed(1)}°C`, l: "A库温" },
                  { x: 730, y: 115, v: "2.1t", l: "分割量" },
                ].map((m) => (
                  <g key={m.x}>
                    <rect x={m.x - 40} y={m.y - 20} width="80" height="32" rx="3" fill="#0B1426" stroke={COLORS.cyan} strokeOpacity="0.5" />
                    <text x={m.x} y={m.y - 6} textAnchor="middle" fill={COLORS.cyan} fontSize="12" style={{ filter: `drop-shadow(0 0 2px ${COLORS.cyan})` }}>
                      {m.v}
                    </text>
                    <text x={m.x} y={m.y + 6} textAnchor="middle" fill={COLORS.dim} fontSize="9">{m.l}</text>
                  </g>
                ))}
              </svg>

              {/* legend */}
              <div className="absolute bottom-2 right-2 flex gap-3 text-[10px]" style={{ color: COLORS.dim }}>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: COLORS.blue, boxShadow: `0 0 4px ${COLORS.blue}` }} />冷链热力</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: COLORS.red, boxShadow: `0 0 4px ${COLORS.red}` }} />温度预警</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: COLORS.cyan, boxShadow: `0 0 4px ${COLORS.cyan}` }} />白条流转</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* RIGHT */}
        <div className="col-span-3 space-y-4">
          <Panel title="冷链温湿度实时监测" icon={Thermometer} accent={COLORS.blue}>
            <div style={{ height: 170 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chill1}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2f52" />
                  <XAxis dataKey="t" stroke={COLORS.dim} fontSize={10} />
                  <YAxis stroke={COLORS.dim} fontSize={10} domain={[0, 5]} />
                  <Tooltip contentStyle={{ background: "#0B1426", border: `1px solid ${COLORS.blue}66`, borderRadius: 4, fontSize: 11 }} />
                  <ReferenceLine y={4} stroke={COLORS.red} strokeDasharray="4 3" label={{ value: "安全红线 4°C", fill: COLORS.red, fontSize: 10, position: "right" }} />
                  <Line type="monotone" dataKey="A" stroke={COLORS.cyan} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="B" stroke={COLORS.blue} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="C" stroke={COLORS.green} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="D" stroke={COLORS.purple} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-2 text-[10px] text-center">
              {(["A", "B", "C", "D"] as const).map((k, i) => {
                const colors = [COLORS.cyan, COLORS.blue, COLORS.green, COLORS.purple];
                const v = chill1[chill1.length - 1][k];
                const warn = v > 3.5;
                return (
                  <div key={k} className="p-1 rounded" style={{ background: warn ? `${COLORS.red}22` : "rgba(30,144,255,0.08)", border: `1px solid ${warn ? COLORS.red : colors[i]}44` }}>
                    <div style={{ color: COLORS.dim }}>排酸{k}库</div>
                    <div className="tabular-nums mt-0.5" style={{ color: warn ? COLORS.red : colors[i] }}>
                      {v.toFixed(1)}°C
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="同步卫检质量统计" icon={ShieldCheck} accent={COLORS.green}>
            <div className="flex items-center gap-3">
              <div style={{ width: 140, height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={rose} dataKey="v" nameKey="n" cx="50%" cy="50%" innerRadius={28} outerRadius={60} paddingAngle={3}>
                      {rose.map((r) => <Cell key={r.n} fill={r.c} stroke="none" />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1 text-xs">
                <div className="pb-1 mb-1" style={{ borderBottom: `1px dashed ${COLORS.border}` }}>
                  <div style={{ color: COLORS.dim }}>今日合格率</div>
                  <div className="text-xl"><Digits value="99.8%" color={COLORS.green} /></div>
                </div>
                {rose.map((r) => (
                  <div key={r.n} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: r.c, boxShadow: `0 0 4px ${r.c}` }} />
                      <span style={{ color: COLORS.text }}>{r.n}</span>
                    </span>
                    <span className="tabular-nums" style={{ color: r.c }}>{((r.v / roseTotal) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="AI 预警与溯源滚动" icon={AlertTriangle} accent={COLORS.orange}>
            <div className="space-y-1.5 overflow-hidden" style={{ height: 200 }}>
              {feed.map((f, i) => {
                const m = {
                  warn: { c: COLORS.orange, I: AlertTriangle, tag: "WARN" },
                  crit: { c: COLORS.red, I: AlertTriangle, tag: "CRIT" },
                  info: { c: COLORS.blue, I: Info, tag: "INFO" },
                }[f.lvl as "warn" | "crit" | "info"];
                return (
                  <div
                    key={f.id}
                    className={i === 0 ? "feed-new" : ""}
                    style={{
                      padding: "6px 8px",
                      background: `${m.c}12`,
                      borderLeft: `2px solid ${m.c}`,
                      fontSize: 11,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="tabular-nums" style={{ color: COLORS.dim }}>[{f.ts}]</span>
                      <span className="px-1.5 rounded text-[9px]" style={{ background: `${m.c}33`, color: m.c }}>{m.tag}</span>
                      <m.I size={10} style={{ color: m.c }} />
                    </div>
                    <div style={{ color: COLORS.text, lineHeight: 1.4 }}>{f.txt}</div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="relative mt-4 grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <Panel title="核心设备阵列 · 实时状态" icon={Cpu} accent={COLORS.cyan}>
            <div className="flex items-center gap-4">
              <div className="flex-1 grid grid-cols-24 gap-1" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                {devices.map((d, i) => {
                  const color = d === "ok" ? COLORS.green : d === "idle" ? COLORS.orange : COLORS.red;
                  return (
                    <div
                      key={i}
                      title={`设备 #${String(i + 1).padStart(3, "0")} · ${d}`}
                      className="aspect-square rounded-sm"
                      style={{
                        background: `${color}33`,
                        border: `1px solid ${color}99`,
                        boxShadow: d === "err" ? `0 0 8px ${color}` : `0 0 3px ${color}44`,
                        animation: d === "err" ? "breathe 1.2s ease-in-out infinite" : undefined,
                      }}
                    />
                  );
                })}
              </div>
              <div className="space-y-1.5 text-xs w-28 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2" style={{ background: COLORS.green, boxShadow: `0 0 4px ${COLORS.green}` }} />正常</span>
                  <span style={{ color: COLORS.green }}>{devices.filter((d) => d === "ok").length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2" style={{ background: COLORS.orange, boxShadow: `0 0 4px ${COLORS.orange}` }} />待机</span>
                  <span style={{ color: COLORS.orange }}>{devices.filter((d) => d === "idle").length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2" style={{ background: COLORS.red, boxShadow: `0 0 4px ${COLORS.red}` }} />故障</span>
                  <span style={{ color: COLORS.red }}>{devices.filter((d) => d === "err").length}</span>
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 text-[11px] flex items-center gap-5" style={{ borderTop: `1px dashed ${COLORS.border}`, color: COLORS.dim }}>
              <span>CO₂ 致昏机群 4/4</span>
              <span>自动开膛机 2/2</span>
              <span>劈半锯 6/6</span>
              <span>分割圆盘锯 8/8</span>
              <span>气调包装机 3/3</span>
            </div>
          </Panel>
        </div>
        <div className="col-span-4">
          <Panel title="物流吞吐状态" icon={Truck} accent={COLORS.blue}>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded" style={{ background: `${COLORS.cyan}0F`, border: `1px solid ${COLORS.cyan}44` }}>
                <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.dim }}>
                  <Truck size={14} style={{ color: COLORS.cyan }} /> 待卸车活猪
                </div>
                <div className="text-2xl mt-1"><Digits value="5" color={COLORS.cyan} /><span className="text-xs ml-1" style={{ color: COLORS.dim }}>辆</span></div>
                <div className="text-[10px] mt-1" style={{ color: COLORS.dim }}>约 598 头 · 74.8 吨</div>
              </div>
              <div className="p-3 rounded" style={{ background: `${COLORS.blue}0F`, border: `1px solid ${COLORS.blue}44` }}>
                <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.dim }}>
                  <Snowflake size={14} style={{ color: COLORS.blue }} /> 待发冷链车
                </div>
                <div className="text-2xl mt-1"><Digits value="12" color={COLORS.blue} /><span className="text-xs ml-1" style={{ color: COLORS.dim }}>辆</span></div>
                <div className="text-[10px] mt-1" style={{ color: COLORS.dim }}>计划发出 186 吨</div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
