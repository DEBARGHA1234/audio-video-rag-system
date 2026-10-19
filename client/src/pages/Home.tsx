import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, ClipboardPaste, CloudUpload, Clock3, FileText, History, Link2, Loader2, MessageSquare, Paperclip, Plus, Search, Sparkles, UploadCloud, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import AppShell, { StatusPill } from "@/components/AppShell";
import { MetricCard } from "@/components/MetricCard";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const examples = ["How is retrieval latency kept low?", "Who owns the Q3 rollout?", "What did the speakers agree to?"];

export default function Home() {
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(() => typeof window === "undefined" ? undefined : localStorage.getItem("contextcore.activeSessionId") ?? undefined);
  const session = trpc.workspace.session.useQuery({ sessionId: activeSessionId });
  const overview = trpc.workspace.overview.useQuery();
  const createSession = trpc.workspace.createSession.useMutation({ onSuccess: result => { localStorage.setItem("contextcore.activeSessionId", result.active.id); setActiveSessionId(result.active.id); toast.success("New session ready", { description: "Your next sources will stay inside this context." }); session.refetch(); }, onError: error => toast.error("Could not create session", { description: error.message }) });
  const ingest = trpc.workspace.ingest.useMutation({ onSuccess: result => { if (result.sessionId) { localStorage.setItem("contextcore.activeSessionId", result.sessionId); setActiveSessionId(result.sessionId); } toast.success("Source indexed", { description: "Your material is now ready for grounded questions in this session." }); setSourceInput(""); overview.refetch(); session.refetch(); }, onError: error => toast.error("Could not index source", { description: error.message }) });
  const transcribe = trpc.workspace.transcribe.useMutation({ onSuccess: result => { toast.success("Transcript ready", { description: `${result.segments.length} timestamped segments are being indexed.` }); ingest.mutate({ source: result.audioUrl, sessionId: activeSessionId, kind: result.kind, content: result.text, segments: result.segments, mediaDurationMs: result.durationMs }); }, onError: error => toast.error("Could not transcribe media", { description: error.message }) });
  const ask = trpc.workspace.ask.useMutation({ onSuccess: result => { if (result.sessionId) { localStorage.setItem("contextcore.activeSessionId", result.sessionId); setActiveSessionId(result.sessionId); } overview.refetch(); session.refetch(); }, onError: error => toast.error("Question failed", { description: error.message }) });
  const [sourceInput, setSourceInput] = useState("");
  const [question, setQuestion] = useState("");
  const [dragging, setDragging] = useState(false);
  const [sourceMode, setSourceMode] = useState<"paste" | "file">("paste");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryInputRef = useRef<HTMLTextAreaElement>(null);
  const sourceBusy = ingest.isPending || transcribe.isPending;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") { event.preventDefault(); queryInputRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onSessionChanged = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      if (next) setActiveSessionId(next);
    };
    window.addEventListener("contextcore-session-changed", onSessionChanged);
    return () => window.removeEventListener("contextcore-session-changed", onSessionChanged);
  }, []);

  useEffect(() => {
    const id = session.data?.active.id;
    if (!id) return;
    if (id !== activeSessionId) setActiveSessionId(id);
    localStorage.setItem("contextcore.activeSessionId", id);
    if (session.data?.replacedSessionId) toast.info("This session’s message context was forgotten", { description: "A fresh context is active. The source trail remains in History." });
  }, [session.data?.active.id, session.data?.replacedSessionId]);

  const handleFile = (file?: File) => {
    if (!file) return;
    if (/\.(mp3|wav|m4a|ogg|aac|mp4|webm|mov)$/i.test(file.name)) {
      toast.info("Paste a reachable media URL for timestamped transcription", { description: "The transcription service needs a server-readable audio or video URL." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : `Uploaded ${file.name}`;
      ingest.mutate({ source: raw, sessionId: activeSessionId, content: raw, name: file.name, size: file.size, kind: file.name.split(".").pop()?.toUpperCase() });
    };
    if (file.type.startsWith("text/") || /\.(md|markdown|csv|json)$/i.test(file.name)) reader.readAsText(file);
    else ingest.mutate({ source: `Uploaded file: ${file.name}`, sessionId: activeSessionId, name: file.name, size: file.size, kind: file.name.split(".").pop()?.toUpperCase() });
  };

  const submitSource = () => {
    if (!sourceInput.trim()) { toast.info("Paste a link or some text first"); return; }
    const mediaUrl = /\.(mp3|wav|m4a|ogg|aac|mp4|webm|mov)(?:\?.*)?$/i.test(sourceInput.trim());
    if (mediaUrl) transcribe.mutate({ audioUrl: sourceInput.trim() });
    else ingest.mutate({ source: sourceInput, sessionId: activeSessionId, content: sourceInput, kind: /^https?:\/\//i.test(sourceInput) ? "URL" : "TXT" });
  };
  const submitQuestion = () => {
    if (!question.trim()) return;
    ask.mutate({ question: question.trim(), sessionId: activeSessionId });
  };
  const latestAnswer = ask.data;
  const data = overview.data;

  return <AppShell><div className="space-y-8">
    <section className="hero-grid"><div><p className="eyebrow text-[var(--cyan-ink)]">Workspace / grounded intelligence</p><h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.055em] text-[var(--ink)] sm:text-6xl">Ask the corpus,<br /><span className="text-[var(--cyan-ink)]">not the guess.</span></h2><p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">Bring scattered files, links, and timestamped conversations into one clean, searchable context. Every answer comes back with the evidence that shaped it.</p><div className="mt-6 flex flex-wrap items-center gap-3"><StatusPill label="Index operational" /><span className="text-xs text-[var(--muted)]">{data?.corpus.chunks.toLocaleString() ?? "—"} chunks ready for retrieval</span></div></div><div className="hero-signal hidden lg:block"><div className="signal-orbit orbit-one" /><div className="signal-orbit orbit-two" /><div className="signal-core"><Sparkles size={23} /></div><span className="signal-label signal-label-a">INDEX / v1.4.8</span><span className="signal-label signal-label-b">RAG / READY</span><span className="signal-label signal-label-c">MEDIA / GROUNDED</span></div></section>

    <section className="panel flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5"><div className="flex min-w-0 items-center gap-3"><div className="empty-icon"><History size={16} /></div><div className="min-w-0"><p className="eyebrow">Active session</p><h3 className="truncate text-sm font-semibold text-[var(--ink)]">{session.isLoading ? "Opening context…" : session.data?.active.title ?? "Untitled session"}</h3><p className="mt-1 truncate text-xs text-[var(--muted)]">{session.data?.active.documents.length ?? 0} sources retained · {session.data?.active.messageCount ?? 0} messages · forgetting after 30 days inactive</p></div></div><div className="flex shrink-0 flex-wrap items-center gap-2"><Link href="/history" className="tab-button"><History size={14} /> History</Link><Button variant="outline" size="sm" onClick={() => createSession.mutate({})} disabled={createSession.isPending}>{createSession.isPending ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} New session</Button></div></section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Indexed sources" value={data ? data.metrics.documents.toLocaleString() : "—"} note="Across the active workspace" icon={<FileText size={16} />} tone="cyan" loading={overview.isLoading} /><MetricCard label="Questions answered" value={data ? data.metrics.queries.toLocaleString() : "—"} note="Grounded requests this month" icon={<MessageSquare size={16} />} tone="violet" loading={overview.isLoading} /><MetricCard label="Avg retrieval" value={data ? `${data.metrics.avgLatency.toFixed(2)}s` : "—"} note="Across cached + live requests" icon={<Zap size={16} />} tone="amber" loading={overview.isLoading} /><MetricCard label="Daily active" value={data ? data.metrics.dailyActiveUsers.toLocaleString() : "—"} note="People asking the corpus today" icon={<Search size={16} />} tone="coral" loading={overview.isLoading} /></section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.16fr)_minmax(330px,0.84fr)]"><div className="panel overflow-hidden"><div className="flex flex-col justify-between gap-4 border-b border-[var(--line)] p-5 sm:flex-row sm:items-center sm:p-6"><div><p className="eyebrow">01 / add context</p><h3 className="mt-1 text-lg font-semibold tracking-[-0.025em]">Bring in a source</h3></div><div className="flex rounded-lg bg-[var(--subtle)] p-1"><button className={cn("tab-button", sourceMode === "paste" && "tab-button-active")} onClick={() => setSourceMode("paste")}><ClipboardPaste size={14} /> Paste</button><button className={cn("tab-button", sourceMode === "file" && "tab-button-active")} onClick={() => setSourceMode("file")}><Paperclip size={14} /> Files</button></div></div><div className="p-5 sm:p-6"><div className={cn("drop-zone", dragging && "drop-zone-active")} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); handleFile(event.dataTransfer.files?.[0]); }}><div className="drop-icon">{sourceBusy ? <Loader2 className="animate-spin" size={22} /> : sourceMode === "paste" ? <Link2 size={22} /> : <CloudUpload size={22} />}</div><div><p className="text-sm font-semibold">{sourceBusy ? "Cleaning, transcribing, and indexing…" : dragging ? "Drop it here" : sourceMode === "paste" ? "Paste a URL, note, or transcript" : "Drop files anywhere in this zone"}</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{sourceMode === "paste" ? "Text is cleaned and chunked. Audio/video URLs get timestamped transcript segments." : "PDF, DOCX, Markdown, CSV, JSON, and TXT files are supported directly."}</p></div><input ref={fileInputRef} type="file" className="sr-only" accept=".pdf,.docx,.md,.markdown,.csv,.json,.txt,.mp3,.wav,.m4a,.mp4,.webm" onChange={event => handleFile(event.target.files?.[0])} /><Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={sourceBusy}>{sourceMode === "paste" ? "Browse files" : "Choose files"}</Button></div>{sourceMode === "paste" && <div className="mt-4"><textarea value={sourceInput} onChange={event => setSourceInput(event.target.value)} onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submitSource(); }} placeholder="https://… or paste the source text you want to remember" className="textarea min-h-[92px]" aria-label="Paste a link or source text" /><div className="mt-3 flex items-center justify-between gap-3"><span className="text-[11px] text-[var(--muted)]">⌘ / Ctrl + Enter to index</span><Button size="sm" onClick={submitSource} disabled={sourceBusy || !sourceInput.trim()}><UploadCloud size={15} /> Index source</Button></div></div>}</div></div>

      <div className="panel flex flex-col overflow-hidden"><div className="border-b border-[var(--line)] p-5 sm:p-6"><p className="eyebrow">02 / ask the corpus</p><h3 className="mt-1 text-lg font-semibold tracking-[-0.025em]">What do you want to know?</h3></div><div className="flex flex-1 flex-col p-5 sm:p-6"><div className="query-box"><textarea ref={queryInputRef} value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submitQuestion(); }} placeholder="Ask a question grounded in your sources…" className="min-h-[100px] w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-[var(--muted)]" aria-label="Ask a question" /><div className="mt-4 flex items-center justify-between"><span className="flex items-center gap-2 text-[11px] text-[var(--muted)]"><span className="status-dot bg-[var(--cyan)]" /> {ask.isPending ? "Retrieving context…" : "Answers cite timestamps and speakers when available"}</span><Button size="sm" onClick={submitQuestion} disabled={ask.isPending || !question.trim()}>{ask.isPending ? <Loader2 className="animate-spin" size={15} /> : <ArrowUpRight size={15} />} Ask</Button></div></div><div className="mt-5"><p className="eyebrow">Try asking</p><div className="mt-3 flex flex-wrap gap-2">{examples.map(example => <button key={example} className="example-chip" onClick={() => { setQuestion(example); queryInputRef.current?.focus(); }}>{example}</button>)}</div></div></div></div>
    </section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.16fr)_minmax(330px,0.84fr)]"><div className="panel min-h-[285px] overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--line)] p-5 sm:p-6"><div><p className="eyebrow">03 / evidence trail</p><h3 className="mt-1 text-lg font-semibold tracking-[-0.025em]">{latestAnswer ? "Latest grounded answer" : "Your answer will land here"}</h3></div>{latestAnswer && <StatusPill label={`${latestAnswer.latency.toFixed(2)}s`} tone="info" />}</div>{latestAnswer ? <div className="p-5 sm:p-6"><p className="max-w-3xl text-base leading-7 text-[var(--ink)]">{latestAnswer.answer}</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{latestAnswer.citations.map(citation => { const citationLink = citation.source && citation.startMs !== undefined && /^https?:\/\//i.test(citation.source) ? `${citation.source}#t=${Math.floor(citation.startMs / 1000)}` : undefined; return <div key={`${citation.documentId}-${citation.chunk}-${citation.startMs ?? ""}`} className="evidence-card"><div className="flex items-center justify-between gap-2"><span className="evidence-kind">{citation.timestampLabel ? <Clock3 size={12} /> : <FileText size={12} />}{citationLink ? <a href={citationLink} target="_blank" rel="noreferrer" className="hover:underline">{citation.timestampLabel}</a> : citation.chunk}</span><span className="font-mono text-[10px] text-[var(--cyan-ink)]">{Math.round(citation.score * 100)}%</span></div>{citation.speaker && <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[var(--muted)]"><Users size={11} /> {citation.speaker}</p>}<p className="mt-3 truncate text-xs font-semibold">{citation.document}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{citation.excerpt}</p>{citation.corrected && <p className="mt-2 text-[10px] font-semibold text-[var(--cyan-ink)]">Corrected transcript segment</p>}</div>; })}</div><div className="mt-5 flex flex-wrap items-center gap-4 border-t border-[var(--line)] pt-4 text-[11px] text-[var(--muted)]"><span>{latestAnswer.tokens} tokens</span><span>•</span><span>{latestAnswer.cacheHit ? "Retrieved from cache" : "Live retrieval"}</span><span>•</span><span>{latestAnswer.citations.length} citations</span></div></div> : <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center"><div className="empty-icon"><Sparkles size={19} /></div><p className="mt-4 text-sm font-medium">Ask something to see the evidence trail</p><p className="mt-2 max-w-sm text-xs leading-5 text-[var(--muted)]">ContextCore will show retrieved chunks, timestamps, and speakers beside every answer when the source supports them.</p></div>}</div><div className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--line)] p-5 sm:p-6"><div><p className="eyebrow">Recent questions</p><h3 className="mt-1 text-lg font-semibold">Query stream</h3></div><a href="/admin" className="text-xs font-semibold text-[var(--cyan-ink)] hover:underline">View telemetry</a></div><div className="divide-y divide-[var(--line)]">{overview.isLoading ? [1,2,3].map(item => <div key={item} className="p-5"><div className="skeleton h-3 w-4/5" /><div className="mt-3 skeleton h-3 w-1/3" /></div>) : data?.queries.slice(0, 4).map(item => <button key={item.id} className="query-row w-full text-left" onClick={() => { setQuestion(item.question); queryInputRef.current?.focus(); }}><span className="query-row-icon"><MessageSquare size={14} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-[var(--ink)]">{item.question}</span><span className="mt-1 block text-[10px] text-[var(--muted)]">{item.createdAt} · {item.latency.toFixed(2)}s</span></span><Check size={14} className="text-[var(--cyan-ink)]" /></button>)}</div></div></section>
  </div></AppShell>;
}
