import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart3, BookOpen, ChevronRight, Command, FileStack, LayoutDashboard, Menu, Moon, Settings, Sun, X, Zap } from "lucide-react";

const navItems = [
  { href: "/", label: "Workspace", caption: "Ask your corpus", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", caption: "Indexed sources", icon: FileStack },
  { href: "/evaluations", label: "RAG evaluation", caption: "Quality signals", icon: BarChart3 },
  { href: "/admin", label: "Admin dashboard", caption: "Live telemetry", icon: BookOpen },
  { href: "/settings", label: "Settings", caption: "Workspace controls", icon: Settings },
];

const pageTitles: Record<string, string> = {
  "/": "Workspace",
  "/documents": "Documents",
  "/evaluations": "RAG Evaluation",
  "/admin": "Admin Dashboard",
  "/settings": "Settings",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const title = pageTitles[location] ?? "Not Found";

  useEffect(() => {
    document.title = `${title} · ContextCore`;
    setMobileOpen(false);
  }, [title]);

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-[var(--line)] bg-[var(--rail)] px-4 py-5 lg:flex lg:flex-col">
        <Brand />
        <div className="mt-10 flex items-center gap-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          <span className="status-dot bg-[var(--cyan)]" /> Live workspace
        </div>
        <nav className="mt-4 space-y-1" aria-label="Primary navigation">
          {navItems.map(item => <NavItem key={item.href} item={item} location={location} />)}
        </nav>
        <div className="mt-auto space-y-4">
          <div className="rail-note">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]"><span>Index health</span><span className="text-[var(--cyan)]">99.96%</span></div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[92%] rounded-full bg-[var(--cyan)]" /></div>
            <p className="mt-3 text-xs leading-5 text-[var(--rail-muted)]">Every answer is tied back to the material you added.</p>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div className="flex items-center gap-2"><div className="avatar">AK</div><div><p className="text-xs font-medium text-white">Alex Kim</p><p className="text-[10px] text-[var(--rail-muted)]">Workspace admin</p></div></div>
            <button className="icon-button dark-icon" aria-label="Open account menu" title="Account menu"><ChevronRight size={15} /></button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--canvas)]/95 backdrop-blur">
          <div className="flex h-[72px] items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <button className="icon-button lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
              <div><p className="eyebrow">ContextCore / {title}</p><h1 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[var(--ink)] sm:text-xl">{title}</h1></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--muted)] sm:flex"><Command size={13} /> <span>Press / to ask</span><kbd>⌘K</kbd></div>
              <button className="icon-button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title="Toggle theme">{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button>
              <div className="avatar hidden sm:flex">AK</div>
            </div>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-[1560px] px-5 py-7 sm:px-8 sm:py-9">{children}</main>
      </div>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-[280px] bg-[var(--rail)] px-4 py-5 shadow-2xl transition-transform lg:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full")} aria-label="Mobile navigation">
        <div className="flex items-center justify-between"><Brand /><button className="icon-button dark-icon" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={19} /></button></div>
        <nav className="mt-10 space-y-1">{navItems.map(item => <NavItem key={item.href} item={item} location={location} />)}</nav>
        <div className="mt-10 rail-note"><p className="text-xs leading-5 text-[var(--rail-muted)]">Use the workspace to add sources, then ask a question grounded in your index.</p></div>
      </aside>
    </div>
  );
}

function Brand() {
  return <Link href="/" className="flex items-center gap-3" aria-label="ContextCore workspace home"><div className="brand-mark"><span>•</span></div><div><div className="text-[15px] font-semibold tracking-[-0.03em] text-white">Context<span className="text-[var(--cyan)]">Core</span></div><div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[var(--rail-muted)]">Grounded intelligence</div></div></Link>;
}

function NavItem({ item, location }: { item: (typeof navItems)[number]; location: string }) {
  const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
  const Icon = item.icon;
  return <Link href={item.href} className={cn("nav-item", active && "nav-item-active")}><Icon size={18} strokeWidth={active ? 2.2 : 1.8} /><span className="min-w-0"><span className="block text-sm font-medium">{item.label}</span><span className="mt-0.5 block truncate text-[10px] text-current opacity-55">{item.caption}</span></span></Link>;
}

export function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"> <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-[28px]">{title}</h2>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>}</div>{action}</div>;
}

export function StatusPill({ label, tone = "good" }: { label: string; tone?: "good" | "info" | "warn" | "bad" }) {
  return <span className={cn("status-pill", `status-${tone}`)}><span className="status-dot" />{label}</span>;
}
