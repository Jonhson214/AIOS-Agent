import { NavLink, Outlet, useLocation } from "react-router";
import {
  LayoutDashboard,
  Database,
  Factory,
  Boxes,
  Code2,
  Network,
  Sparkles,
  MessageSquare,
  FileCheck,
  BarChart3,
  Search,
  Bell,
  LogOut,
  ChevronRight,
  HelpCircle,
  Terminal,
  FileCode,
  GitBranch,
  Monitor,
  LineChart,
  ArrowLeftRight,
  Grid3x3,
} from "lucide-react";

const topNav = [
  { to: "/", label: "总览" },
  { to: "/data-ingestion", label: "数据接入" },
  { to: "/data-development", label: "数据实验室" },
  { to: "/ontology-modeling", label: "本体建模" },
  { to: "/ontology-app", label: "本体应用" },
  { to: "/smart-qa", label: "智能问答" },
  { to: "/smart-doc-review", label: "智能文档审核" },
  { to: "/smart-data-analysis", label: "智能数据分析" },
  { to: "/production", label: "系统管理" },
];

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
};

const sidebarGroups: Record<string, { title: string; items: NavItem[] }[]> = {
  "/": [
    {
      title: "总览",
      items: [
        { to: "/", label: "运营总览", icon: LayoutDashboard },
        { to: "/production", label: "生产总览", icon: Factory },
        { to: "/production-screen", label: "总览大屏", icon: LayoutDashboard },
      ],
    },
  ],
  "/data-ingestion": [
    {
      title: "数据接入",
      items: [
        { to: "/data-ingestion", label: "接入概览", icon: LayoutDashboard },
        { to: "/data-source", label: "数据源管理", icon: Database },
        { to: "/ingestion-tasks", label: "接入任务", icon: Boxes },
      ],
    },
  ],
  "/production": [
    {
      title: "生产大屏",
      items: [
        { to: "/production", label: "生产总览", icon: Factory },
        { to: "/production-screen", label: "83号生产现场", icon: LayoutDashboard },
        { to: "/model-management", label: "模型管理", icon: Boxes },
      ],
    },
  ],
  "/data-development": [
    {
      title: "数据实验室",
      items: [
        { to: "/lab/ontology-app", label: "本体应用", icon: Grid3x3 },
        { to: "/lab/data-source", label: "数据源管理", icon: Database },
        { to: "/lab/sql", label: "SQL 工作台", icon: Terminal },
        { to: "/lab/scripts", label: "脚本管理", icon: FileCode },
        { to: "/lab/workflow", label: "工作流编排", icon: GitBranch },
        { to: "/lab/monitor", label: "实例监控", icon: Monitor },
        { to: "/lab/visualization", label: "数据可视化", icon: LineChart },
        { to: "/data-development", label: "数据映射", icon: ArrowLeftRight },
      ],
    },
  ],
  "/smart-qa": [
    {
      title: "智能问答",
      items: [{ to: "/smart-qa", label: "智能问答", icon: MessageSquare }],
    },
  ],
  "/smart-doc-review": [
    { title: "智能文档审核", items: [{ to: "/smart-doc-review", label: "智能文档审核", icon: FileCheck }] },
  ],
  "/smart-data-analysis": [
    { title: "智能数据分析", items: [{ to: "/smart-data-analysis", label: "智能数据分析", icon: BarChart3 }] },
  ],
  "/ontology-modeling": [
    {
      title: "本体建模",
      items: [
        { to: "/ontology-modeling/definition", label: "本体定义", icon: Network },
        { to: "/ontology-modeling/relation", label: "关系提取", icon: GitBranch },
        { to: "/ontology-modeling/graph", label: "图数据建模", icon: Grid3x3 },
        { to: "/ontology-modeling/schema", label: "Schema 管理", icon: FileCode },
        { to: "/ontology-modeling/inject", label: "本体注入", icon: ArrowLeftRight },
      ],
    },
  ],
  "/ontology-app": [
    {
      title: "本体应用",
      items: [{ to: "/ontology-app", label: "应用矩阵", icon: Sparkles }],
    },
  ],
};

function getSidebarKey(pathname: string): string {
  if (pathname === "/") return "/";
  if (pathname === "/production" || pathname === "/production-screen") return "/";
  if (pathname.startsWith("/data-ingestion") || pathname.startsWith("/data-source") || pathname.startsWith("/ingestion-tasks"))
    return "/data-ingestion";
  if (pathname.startsWith("/model-management"))
    return "/production";
  if (pathname.startsWith("/data-development") || pathname.startsWith("/lab/")) return "/data-development";
  if (pathname.startsWith("/smart-qa")) return "/smart-qa";
  if (pathname.startsWith("/smart-doc-review")) return "/smart-doc-review";
  if (pathname.startsWith("/smart-data-analysis")) return "/smart-data-analysis";
  if (pathname.startsWith("/ontology-modeling")) return "/ontology-modeling";
  if (pathname.startsWith("/ontology-app")) return "/ontology-app";
  return "/";
}

export function Layout() {
  const location = useLocation();
  const sideKey = getSidebarKey(location.pathname);
  const groups = sidebarGroups[sideKey] ?? sidebarGroups["/"];

  return (
    <div className="min-h-screen w-full" style={{ background: "#f5f7fa" }}>
      {/* Top Nav */}
      <header
        className="h-14 flex items-center px-6"
        style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}
      >
        <div className="flex items-center gap-2 mr-10">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#06b6d4,#0284c7)" }}
          >
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="text-slate-800 tracking-wide">牧原智能体平台</span>
        </div>

        <nav className="flex items-center gap-1 flex-1">
          {topNav.map((n) => {
            const active = getSidebarKey(location.pathname) === getSidebarKey(n.to);
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  active ? "text-cyan-600" : "text-slate-600 hover:text-slate-900"
                }`}
                style={active ? { background: "#ecfeff" } : {}}
              >
                {n.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-4 text-slate-500">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-md"
            style={{ background: "#f1f5f9" }}
          >
            <Search size={14} />
            <input
              placeholder="搜索..."
              className="bg-transparent outline-none text-sm w-40 placeholder:text-slate-400 text-slate-700"
            />
          </div>
          <Bell size={18} className="cursor-pointer hover:text-cyan-600" />
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm">
            牧
          </div>
          <button className="flex items-center gap-1 text-sm hover:text-cyan-600">
            <LogOut size={14} />
            退出系统
          </button>
        </div>
      </header>

      <div className="flex" style={{ minHeight: "calc(100vh - 56px)" }}>
        {/* Sidebar */}
        <aside
          className="w-56 px-3 py-5"
          style={{ background: "#ffffff", borderRight: "1px solid #e5e7eb" }}
        >
          {groups.map((g) => (
            <div key={g.title} className="mb-6">
              <div className="px-3 text-xs text-slate-400 mb-2 tracking-wider">
                {g.title}
              </div>
              <div className="space-y-1">
                {g.items.map((it) => (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end={it.to === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${
                        isActive
                          ? "text-cyan-700"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`
                    }
                    style={({ isActive }) =>
                      isActive
                        ? { background: "#ecfeff", borderLeft: "2px solid #06b6d4" }
                        : {}
                    }
                  >
                    <it.icon size={16} />
                    <span className="flex-1">{it.label}</span>
                    <ChevronRight size={12} className="opacity-40" />
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 overflow-auto relative">
          <Outlet />
          <button
            className="fixed bottom-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
            style={{ background: "linear-gradient(135deg,#06b6d4,#0284c7)" }}
            title="帮助"
          >
            <HelpCircle size={18} />
          </button>
        </main>
      </div>
    </div>
  );
}
