import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricCard({ label, value, note, trend, icon, tone = "cyan", loading = false }: { label: string; value: string; note: string; trend?: "up" | "down" | "flat"; icon?: React.ReactNode; tone?: "cyan" | "violet" | "amber" | "coral"; loading?: boolean }) {
  if (loading) return <div className="panel p-5"><div className="skeleton h-3 w-24" /><div className="mt-4 skeleton h-8 w-20" /><div className="mt-4 skeleton h-3 w-32" /></div>;
  return <div className="panel metric-card p-5"><div className="flex items-start justify-between"><p className="eyebrow">{label}</p><span className={cn("metric-icon", `metric-${tone}`)}>{icon}</span></div><div className="mt-3 flex items-end justify-between gap-3"><p className="metric-value">{value}</p>{trend && <span className={cn("flex items-center gap-1 text-xs font-semibold", trend === "down" ? "text-[var(--coral)]" : trend === "up" ? "text-[var(--cyan)]" : "text-[var(--muted)]")}>{trend === "up" ? <ArrowUpRight size={14} /> : trend === "down" ? <ArrowDownRight size={14} /> : <Minus size={14} />}</span>}</div><p className="mt-2 text-xs text-[var(--muted)]">{note}</p></div>;
}

export function SkeletonLine({ className = "" }: { className?: string }) { return <div className={cn("skeleton h-3", className)} />; }
