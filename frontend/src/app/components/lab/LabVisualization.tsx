import { LineChart as LineIcon, BarChart3, PieChart as PieIcon, Map, Plus, Eye } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from "recharts";

const cardBg = { background: "#ffffff", border: "1px solid #e5e7eb" };

const yield7 = Array.from({ length: 7 }, (_, i) => ({ d: `D-${6 - i}`, 出肉率: 60 + Math.random() * 3, 瘦肉率: 58 + Math.random() * 4 }));
const breach = Array.from({ length: 24 }, (_, i) => ({ h: `${i}h`, 偏离分钟: Math.round(Math.random() * 15) }));
const defects = [
  { n: "甲状腺未除净", v: 32, c: "#f59e0b" },
  { n: "局部病变", v: 18, c: "#ef4444" },
  { n: "内脏异常", v: 14, c: "#fb923c" },
  { n: "淋巴结检出", v: 9, c: "#a78bfa" },
  { n: "外观破损", v: 7, c: "#60a5fa" },
];
const cost = Array.from({ length: 12 }, (_, i) => ({ m: `${i + 1}月`, 饲料: 52 + Math.random() * 4, 人工: 18 + Math.random() * 2, 能源: 12 + Math.random() * 2 }));

const boards = [
  { name: "全厂日屠宰看板", desc: "日屠宰量 / 出肉率 / 合格率", updated: "2 分钟前", views: 428, I: BarChart3 },
  { name: "冷链温度总览", desc: "4 座排酸库 + 成品冷库实时温度", updated: "10 秒前", views: 1204, I: LineIcon },
  { name: "养殖场对标分析", desc: "6 厂区 PSY / 料肉比 / 成活率 对比", updated: "1 小时前", views: 316, I: Map },
  { name: "成本结构穿透", desc: "饲料 / 人工 / 能源 月度结构", updated: "今日 06:00", views: 182, I: PieIcon },
];

export function LabVisualization() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl">数据可视化</h1>
          <p className="text-slate-400 text-sm mt-1">自助拖拽式图表与看板 · 赋能业务自助分析</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white" style={{ background: "linear-gradient(135deg,#06b6d4,#0ea5e9)" }}>
          <Plus size={14} /> 新建看板
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg p-5" style={cardBg}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-900 text-sm">近 7 日出肉率 / 瘦肉率</div>
            <span className="text-xs text-cyan-600">折线图</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={yield7}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="d" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[55, 65]} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }} />
              <Line type="monotone" dataKey="出肉率" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="瘦肉率" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg p-5" style={cardBg}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-900 text-sm">24h 冷链温度偏离分钟数</div>
            <span className="text-xs text-cyan-600">柱状图</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={breach}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="h" stroke="#94a3b8" fontSize={10} interval={2} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }} />
              <Bar dataKey="偏离分钟" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg p-5" style={cardBg}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-900 text-sm">卫检异常分类占比</div>
            <span className="text-xs text-cyan-600">饼图</span>
          </div>
          <div className="flex items-center gap-4">
            <div style={{ width: 180, height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={defects} dataKey="v" nameKey="n" innerRadius={40} outerRadius={80} paddingAngle={2}>
                    {defects.map((d) => <Cell key={d.n} fill={d.c} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 text-xs">
              {defects.map((d) => (
                <div key={d.n} className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: d.c }} />{d.n}</span>
                  <span className="tabular-nums text-slate-500">{d.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg p-5" style={cardBg}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-900 text-sm">年度成本结构趋势</div>
            <span className="text-xs text-cyan-600">堆叠面积图</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cost}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="m" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }} />
              <Area type="monotone" dataKey="饲料" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
              <Area type="monotone" dataKey="人工" stackId="1" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.6} />
              <Area type="monotone" dataKey="能源" stackId="1" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg p-5" style={cardBg}>
        <div className="text-slate-900 mb-4">已发布看板</div>
        <div className="grid grid-cols-4 gap-3">
          {boards.map((b) => (
            <div key={b.name} className="p-4 rounded-md hover:shadow-md transition-shadow cursor-pointer" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center mb-3" style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4" }}>
                <b.I size={18} />
              </div>
              <div className="text-slate-800 text-sm">{b.name}</div>
              <div className="text-slate-400 text-xs mt-1 leading-relaxed h-8">{b.desc}</div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                <span>{b.updated}</span>
                <span className="flex items-center gap-1"><Eye size={10} />{b.views}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
