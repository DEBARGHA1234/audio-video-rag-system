import { useEffect, useState } from "react";
import { Bell, Check, Database, Loader2, Moon, Save, SlidersHorizontal, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import AppShell, { SectionHeader, StatusPill } from "@/components/AppShell";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const settings = trpc.workspace.settings.useQuery();
  const save = trpc.workspace.updateSettings.useMutation({
    onSuccess: saved => {
      setTopK(String(saved.top_k));
      setNotifications(saved.notifications_enabled);
      setAnswerCacheEnabled(saved.answer_cache_enabled);
      setEvaluationTelemetryEnabled(saved.evaluation_telemetry_enabled);
      toast.success("Settings saved", { description: "Workspace retrieval preferences are now persisted." });
      settings.refetch();
    },
    onError: error => toast.error("Could not save settings", { description: error.message }),
  });
  const [topK, setTopK] = useState("5");
  const [notifications, setNotifications] = useState(true);
  const [answerCacheEnabled, setAnswerCacheEnabled] = useState(true);
  const [evaluationTelemetryEnabled, setEvaluationTelemetryEnabled] = useState(true);

  useEffect(() => {
    if (!settings.data) return;
    setTopK(String(settings.data.top_k));
    setNotifications(settings.data.notifications_enabled);
    setAnswerCacheEnabled(settings.data.answer_cache_enabled);
    setEvaluationTelemetryEnabled(settings.data.evaluation_telemetry_enabled);
  }, [settings.data]);

  const saveSettings = () => save.mutate({ topK: Number(topK), notifications, answerCacheEnabled, evaluationTelemetryEnabled, theme: theme === "dark" ? "dark" : "light" });

  return <AppShell><div className="space-y-8">
    <SectionHeader eyebrow="Workspace / controls" title="Settings" description="Tune how ContextCore retrieves context and how you want the workspace to feel." action={<StatusPill label={settings.isLoading ? "Loading settings" : save.isPending ? "Saving changes" : "Synced to Supabase"} tone="info" />} />
    {settings.isError && <div className="rounded-xl border border-[var(--line)] bg-[var(--subtle)] p-4 text-sm text-[var(--amber-ink)]">Settings could not be loaded from the database. You can retry the page or save again.</div>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]"><div className="space-y-5"><div className="panel overflow-hidden"><div className="flex items-center gap-3 border-b border-[var(--line)] p-5 sm:p-6"><div className="mini-icon"><SlidersHorizontal size={16} /></div><div><h3 className="text-lg font-semibold">Retrieval controls</h3><p className="mt-1 text-xs text-[var(--muted)]">Balance context coverage and cost per request.</p></div></div><div className="space-y-6 p-5 sm:p-6"><label className="block"><span className="text-sm font-medium">Top-k chunks</span><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">The number of relevant chunks sent to the answer service.</span><select value={topK} onChange={event => setTopK(event.target.value)} className="input mt-3 max-w-[180px]" disabled={settings.isLoading}><option value="3">3 chunks</option><option value="5">5 chunks</option><option value="8">8 chunks</option></select></label><div className="flex items-center justify-between border-t border-[var(--line)] pt-5"><div><p className="text-sm font-medium">Answer cache</p><p className="mt-1 text-xs text-[var(--muted)]">Reuse identical questions for the current corpus version.</p></div><button className={answerCacheEnabled ? "toggle toggle-on" : "toggle"} onClick={() => setAnswerCacheEnabled(current => !current)} aria-label="Toggle answer cache"><span /></button></div><div className="flex items-center justify-between border-t border-[var(--line)] pt-5"><div><p className="text-sm font-medium">Evaluation telemetry</p><p className="mt-1 text-xs text-[var(--muted)]">Record latency, tokens, citations, and quality signals.</p></div><button className={evaluationTelemetryEnabled ? "toggle toggle-on" : "toggle"} onClick={() => setEvaluationTelemetryEnabled(current => !current)} aria-label="Toggle evaluation telemetry"><span /></button></div></div></div><div className="panel overflow-hidden"><div className="flex items-center gap-3 border-b border-[var(--line)] p-5 sm:p-6"><div className="mini-icon"><Bell size={16} /></div><div><h3 className="text-lg font-semibold">Notifications</h3><p className="mt-1 text-xs text-[var(--muted)]">Keep feedback close to the action.</p></div></div><div className="flex items-center justify-between p-5 sm:p-6"><div><p className="text-sm font-medium">Indexing and evaluation toasts</p><p className="mt-1 text-xs text-[var(--muted)]">Show completion and error feedback after background work.</p></div><button className={notifications ? "toggle toggle-on" : "toggle"} onClick={() => setNotifications(current => !current)} aria-label="Toggle notifications"><span /></button></div></div><Button onClick={saveSettings} disabled={save.isPending || settings.isLoading}>{save.isPending ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} {save.isPending ? "Saving…" : "Save changes"}</Button></div><div className="space-y-5"><div className="panel overflow-hidden"><div className="border-b border-[var(--line)] p-5 sm:p-6"><p className="eyebrow">Appearance</p><h3 className="mt-1 text-lg font-semibold">Your working surface</h3></div><div className="space-y-3 p-5 sm:p-6"><button className={theme === "light" ? "theme-option theme-option-active" : "theme-option"} onClick={() => theme === "dark" && toggleTheme?.()}><Sun size={17} /><span><b>Light studio</b><small>Warm, paper-like canvas</small></span>{theme === "light" && <Check size={16} className="ml-auto text-[var(--cyan-ink)]" />}</button><button className={theme === "dark" ? "theme-option theme-option-active" : "theme-option"} onClick={() => theme === "light" && toggleTheme?.()}><Moon size={17} /><span><b>Dark graphite</b><small>Low-glare, high-focus canvas</small></span>{theme === "dark" && <Check size={16} className="ml-auto text-[var(--cyan-ink)]" />}</button></div></div><div className="panel p-5 sm:p-6"><div className="flex items-center gap-3"><div className="mini-icon"><Database size={16} /></div><div><p className="text-sm font-semibold">Workspace storage</p><p className="mt-1 text-xs text-[var(--muted)]">Supabase Postgres + pgvector retrieval index</p></div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--subtle)]"><div className="h-full w-[68%] rounded-full bg-[var(--cyan)]" /></div><div className="mt-3 flex justify-between text-[11px] text-[var(--muted)]"><span>Managed in Supabase</span><span>pgvector ready</span></div></div></div></div>
  </div></AppShell>;
}
