import { useState } from "react";
import { Archive, ArrowUpRight, Clock3, History as HistoryIcon, Loader2, MessageSquare, Plus, Video } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import AppShell, { SectionHeader, StatusPill } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const ACTIVE_SESSION_KEY = "contextcore.activeSessionId";

function activateSession(id: string) {
  localStorage.setItem(ACTIVE_SESSION_KEY, id);
  window.dispatchEvent(new CustomEvent("contextcore-session-changed", { detail: id }));
}

export default function History() {
  const [, setLocation] = useLocation();
  const sessions = trpc.workspace.sessions.useQuery({ page: 1, pageSize: 24 });
  const createSession = trpc.workspace.createSession.useMutation({
    onSuccess: result => {
      activateSession(result.active.id);
      toast.success("Fresh session ready", { description: "Your next sources will stay inside this context." });
      setLocation("/");
    },
    onError: error => toast.error("Could not create session", { description: error.message }),
  });
  const [filter, setFilter] = useState<"all" | "active" | "forgotten">("all");
  const items = (sessions.data?.items ?? []).filter(item => filter === "all" || (filter === "forgotten" ? item.contextForgotten : item.status === filter));

  return <AppShell>
    <div className="space-y-8">
      <SectionHeader eyebrow="Context / history" title="Past sessions" description="Your active session keeps its media context close. Older sessions remain here as a durable trail, while expired message context is gradually forgotten." action={<Button onClick={() => createSession.mutate({})} disabled={createSession.isPending}><Plus size={15} /> New session</Button>} />
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "active", "forgotten"] as const).map(value => <button key={value} className={cn("tab-button", filter === value && "tab-button-active")} onClick={() => setFilter(value)}>{value === "all" ? "All sessions" : value === "active" ? "Active context" : "Forgotten context"}</button>)}
        <span className="ml-auto text-xs text-[var(--muted)]">{sessions.data?.total ?? 0} sessions</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {sessions.isLoading ? [1, 2, 3, 4].map(item => <div key={item} className="panel p-5"><div className="skeleton h-4 w-2/3" /><div className="mt-4 skeleton h-3 w-1/3" /><div className="mt-7 skeleton h-9 w-28" /></div>) : items.length ? items.map(item => <article key={item.id} className={cn("panel p-5 transition-colors", item.contextForgotten && "opacity-80")}>
          <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><div className="empty-icon mt-0.5"><HistoryIcon size={16} /></div><div className="min-w-0"><h3 className="truncate text-base font-semibold text-[var(--ink)]">{item.title}</h3><p className="mt-1 flex items-center gap-2 text-xs text-[var(--muted)]"><Clock3 size={12} /> {item.lastActiveAt}</p></div></div><StatusPill label={item.contextForgotten ? "Context forgotten" : item.status === "active" ? "Active" : "Archived"} tone={item.contextForgotten ? "warn" : "good"} /></div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-y border-[var(--line)] py-4 text-xs"><span className="flex items-center gap-2 text-[var(--muted)]"><Video size={14} /> {item.documentCount} sources</span><span className="flex items-center gap-2 text-[var(--muted)]"><MessageSquare size={14} /> {item.messageCount} messages</span></div>
          <p className="mt-4 text-xs leading-5 text-[var(--muted)]">{item.contextForgotten ? "The session shell and source trail remain available, but old prompt context will not be restored automatically." : "Questions and media added here remain available until the inactivity horizon is reached."}</p>
          <div className="mt-5 flex flex-wrap gap-2">{item.contextForgotten ? <Button variant="outline" size="sm" onClick={() => createSession.mutate({ title: item.title })} disabled={createSession.isPending}><Archive size={14} /> Start fresh from this session</Button> : <Button variant="outline" size="sm" onClick={() => { activateSession(item.id); setLocation("/"); }}><ArrowUpRight size={14} /> Resume session</Button>}</div>
        </article>) : <div className="panel col-span-full flex min-h-[260px] flex-col items-center justify-center px-6 text-center"><div className="empty-icon"><HistoryIcon size={19} /></div><p className="mt-4 text-sm font-medium">No sessions in this view</p><p className="mt-2 max-w-sm text-xs leading-5 text-[var(--muted)]">Start a session from the workspace and your source context will appear here.</p></div>}
      </div>
      {sessions.isFetching && !sessions.isLoading && <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted)]"><Loader2 size={13} className="animate-spin" /> Refreshing history</div>}
    </div>
  </AppShell>;
}
