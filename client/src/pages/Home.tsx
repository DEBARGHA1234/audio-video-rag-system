import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, ClipboardPaste, CloudUpload, FileText, Link2, Loader2, MessageSquare, Paperclip, Search, Sparkles, UploadCloud, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import AppShell, { SectionHeader, StatusPill } from "@/components/AppShell";
import { MetricCard } from "@/components/MetricCard";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const examples = ["How is retrieval latency kept low?", "Who owns the Q3 rollout?", "What did the customer ask us to validate?"];

export default function Home() {
  const overview = trpc.workspace.overview.useQuery();
  const ingest = trpc.workspace.ingest.useMutation({ onSuccess: () => { toast.success("Source indexed", { description: "Your material is now ready for grounded questions." }); setSourceInput(""); overview.refetch(); }, onError: error => toast.error("Could not index source", { description: error.message }) });
  const ask = trpc.workspace.ask.useMutation({ onSuccess: () => overview.refetch(), onError: error => toast.error("Question failed", { description: error.message }) });
  const [sourceInput, setSourceInput] = useState("");
  const [question, setQuestion] = useState("");
  const [dragging, setDragging] = useState(false);
  const [sourceMode, setSourceMode] = useState<"paste" | "file">("paste");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") { event.preventDefault(); queryInputRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : `Uploaded ${file.name}`;
      ingest.mutate({ source: raw, content: raw, name: file.name, size: file.size, kind: file.name.split(".").pop()?.toUpperCase() });
    };
    if (file.type.startsWith("text/") || /\.(md|markdown|csv|json)$/i.test(file.name)) reader.readAsText(file);
    else { ingest.mutate({ source: `Uploaded file: ${file.name}`, name: file.name, size: file.size, kind: file.name.split(".").pop()?.toUpperCase() }); }
  };

  const submitSource = () => {
    if (!sourceInput.trim()) { toast.info("Paste a link or some text first"); return; }
    ingest.mutate({ source: sourceInput, content: sourceInput, kind: /^https?:\/\//i.test(sourceInput) ? "URL" : "TXT" });
  };
  const submitQuestion = () => {
    if (!question.trim()) return;
    ask.mutate({ question: question.trim() });
  };
  const latestAnswer = ask.data;
  const data = overview.data;

  return <AppShell><div className="space-y-8">
    <section className="hero-grid">
      <div><p className="eyebrow text-[var(--cyan-ink)]">Workspace / grounded intelligence</p><h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.055em] text-[var(--ink)] sm:text-6xl">Ask the corpus,<br /><span className="text-[var(--cyan-ink)]">not the guess.</span></h2><p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">Bring scattered files and links into one clean, searchable context. Every answer comes back with the evidence that shaped it.</p><div className="mt-6 flex flex-wrap items-center gap-3"><StatusPill label="Index operational" /><span className="text-xs text-[var(--muted)]">{data?.corpus.chunks.toLocaleString() ?? "—"} chunks ready for retrieval</span></div></div>
      <div className="hero-signal hidden lg:block"><div className="signal-orbit orbit-one" /><div className="signal-orbit orbit-two" /><div className="signal-core"><Sparkles size={23} /></div><span className="signal-label signal-label-a">INDEX / v1.4.8</span><span className="signal-label signal-label-b">RAG / READY</span><span className="signal-label signal-label-c">CACHE / 54%</span></div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Indexed sources" value={data ? data.metrics.documents.toLocaleString() : "—"} note="Across the active workspace" icon={<FileText size={16} />} tone="cyan" loading={overview.isLoading} />
      <MetricCard label="Questions answered" value={data ? data.metrics.queries.toLocaleString() : "—"} note="Grounded requests this month" icon={<MessageSquare size={16} />} tone="violet" loading={overview.isLoading} />
      <MetricCard label="Avg retrieval" value={data ? `${data.metrics.avgLatency.toFixed(2)}s` : "—"} note="Across cached + live requests" icon={<Zap size={16} />} tone="amber" loading={overview.isLoading} />
      <MetricCard label="Daily active" value={data ? data.metrics.dailyActiveUsers.toLocaleString() : "—"} note="People asking the corpus today" icon={<Search size={16} />} tone="coral" loading={overview.isLoading} />
    </section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.16fr)_minmax(330px,0.84fr)]">
      <div className="panel overflow-hidden">
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--line)] p-5 sm:flex-row sm:items-center sm:p-6"><div><p className="eyebrow">01 / add context</p><h3 className="mt-1 text-lg font-semibold tracking-[-0.025em]">Bring in a source</h3></div><div className="flex rounded-lg bg-[var(--subtle)] p-1"><button className={cn("tab-button", sourceMode === "paste" && "tab-button-active")} onClick={() => setSourceMode("paste")}><ClipboardPaste size={14} /> Paste</button><button className={cn("tab-button", sourceMode === "file" && "tab-button-active")} onClick={() => setSourceMode("file")}><Paperclip size={14} /> Files</button></div></div>
        <div className="p-5 sm:p-6">
          <div className={cn("drop-zone", dragging && "drop-zone-active")} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); handleFile(event.dataTransfer.files?.[0]); }}>
            <div className="drop-icon">{ingest.isPending ? <Loader2 className="animate-spin" size={22} /> : sourceMode === "paste" ? <Link2 size={22} /> : <CloudUpload size={22} />}</div><div><p className="text-sm font-semibold">{ingest.isPending ? "Cleaning and indexing…" : dragging ? "Drop it here" : sourceMode === "paste" ? "Paste a URL, note, or transcript" : "Drop files anywhere in this zone"}</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{sourceMode === "paste" ? "Links and plain text are cleaned, chunked, and indexed automatically." : "PDF, DOCX, Markdown, CSV, JSON, TXT, and audio sources."}</p></div>
            <input ref={fileInputRef} type="file" className="sr-only" accept=".pdf,.docx,.md,.markdown,.csv,.json,.txt,.mp3,.wav,.m4a" onChange={event => handleFile(event.target.files?.[0])} />
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={ingest.isPending}>{sourceMode === "paste" ? "Browse files" : "Choose files"}</Button>
          </div>
          {sourceMode === "paste" && <div className="mt-4"><textarea value={sourceInput} onChange={event => setSourceInput(event.target.value)} onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submitSource(); }} placeholder="https://… or paste the source text you want to remember" className="textarea min-h-[92px]" aria-label="Paste a link or source text" /><div className="mt-3 flex items-center justify-between gap-3"><span className="text-[11px] text-[var(--muted)]">⌘ / Ctrl + Enter to index</span><Button size="sm" onClick={submitSource} disabled={ingest.isPending || !sourceInput.trim()}><UploadCloud size={15} /> Index source</Button></div></div>}
        </div>
      </div>

      <div className="panel flex flex-col overflow-hidden">
        <div className="border-b border-[var(--line)] p-5 sm:p-6"><p className="eyebrow">02 / ask the corpus</p><h3 className="mt-1 text-lg font-semibold tracking-[-0.025em]">What do you want to know?</h3></div>
        <div className="flex flex-1 flex-col p-5 sm:p-6"><div className="query-box"><textarea ref={queryInputRef} value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submitQuestion(); }} placeholder="Ask a question grounded in your sources…" className="min-h-[100px] w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-[var(--muted)]" aria-label="Ask a question" /><div className="mt-4 flex items-center justify-between"><span className="flex items-center gap-2 text-[11px] text-[var(--muted)]"><span className="status-dot bg-[var(--cyan)]" /> {ask.isPending ? "Retrieving context…" : "Answers cite their sources"}</span><Button size="sm" onClick={submitQuestion} disabled={ask.isPending || !question.trim()}>{ask.isPending ? <Loader2 className="animate-spin" size={15} /> : <ArrowUpRight size={15} />} Ask</Button></div></div><div className="mt-5"><p className="eyebrow">Try asking</p><div className="mt-3 flex flex-wrap gap-2">{examples.map(example => <button key={example} className="example-chip" onClick={() => { setQuestion(example); queryInputRef.current?.focus(); }}>{example}</button>)}</div></div></div>
      </div>
    </section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.16fr)_minmax(330px,0.84fr)]">
      <div className="panel min-h-[285px] overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--line)] p-5 sm:p-6"><div><p className="eyebrow">03 / evidence trail</p><h3 className="mt-1 text-lg font-semibold tracking-[-0.025em]">{latestAnswer ? "Latest grounded answer" : "Your answer will land here"}</h3></div>{latestAnswer && <StatusPill label={`${latestAnswer.latency.toFixed(2)}s`} tone="info" />}</div>{latestAnswer ? <div className="p-5 sm:p-6"><p className="max-w-3xl text-base leading-7 text-[var(--ink)]">{latestAnswer.answer}</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{latestAnswer.citations.map(citation => <div key={`${citation.documentId}-${citation.chunk}`} className="evidence-card"><div className="flex items-center justify-between gap-2"><span className="evidence-kind"><FileText size={12} /> {citation.chunk}</span><span className="font-mono text-[10px] text-[var(--cyan-ink)]">{Math.round(citation.score * 100)}%</span></div><p className="mt-3 truncate text-xs font-semibold">{citation.document}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{citation.excerpt}</p></div>)}</div><div className="mt-5 flex flex-wrap items-center gap-4 border-t border-[var(--line)] pt-4 text-[11px] text-[var(--muted)]"><span>{latestAnswer.tokens} tokens</span><span>•</span><span>{latestAnswer.cacheHit ? "Retrieved from cache" : "Live retrieval"}</span><span>•</span><span>{latestAnswer.citations.length} citations</span></div></div> : <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center"><div className="empty-icon"><Sparkles size={19} /></div><p className="mt-4 text-sm font-medium">Ask something to see the evidence trail</p><p className="mt-2 max-w-sm text-xs leading-5 text-[var(--muted)]">ContextCore will show the retrieved chunks beside every answer so you can inspect the why, not just the what.</p></div>}</div>
      <div className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--line)] p-5 sm:p-6"><div><p className="eyebrow">Recent questions</p><h3 className="mt-1 text-lg font-semibold tracking-[-0.025em]">Query stream</h3></div><a href="/admin" className="text-xs font-semibold text-[var(--cyan-ink)] hover:underline">View telemetry</a></div><div className="divide-y divide-[var(--line)]">{overview.isLoading ? [1,2,3].map(item => <div key={item} className="p-5"><div className="skeleton h-3 w-4/5" /><div className="mt-3 skeleton h-3 w-1/3" /></div>) : data?.queries.slice(0, 4).map(item => <button key={item.id} className="query-row w-full text-left" onClick={() => { setQuestion(item.question); queryInputRef.current?.focus(); }}><span className="query-row-icon"><MessageSquare size={14} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-[var(--ink)]">{item.question}</span><span className="mt-1 block text-[10px] text-[var(--muted)]">{item.createdAt} · {item.latency.toFixed(2)}s</span></span><Check size={14} className="text-[var(--cyan-ink)]" /></button>)}</div></div>
    </section>
  </div></AppShell>;
}
