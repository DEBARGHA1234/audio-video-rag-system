import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock3, FileJson, FileSpreadsheet, FileText, FileType2, FolderOpen, MessageSquareText, RefreshCw, Search, UploadCloud, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import AppShell, { SectionHeader, StatusPill } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

function kindIcon(kind: string) {
  if (kind === "CSV") return <FileSpreadsheet size={18} />;
  if (kind === "JSON") return <FileJson size={18} />;
  if (kind === "DOCX") return <FileType2 size={18} />;
  return <FileText size={18} />;
}

function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function Documents() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const documents = trpc.workspace.documents.useQuery({ page, pageSize: 6, search });
  const transcript = trpc.workspace.transcript.useQuery({ documentId: selectedId ?? "00000000-0000-0000-0000-000000000000" }, { enabled: Boolean(selectedId) });
  const correction = trpc.workspace.correctTranscriptSegment.useMutation({
    onSuccess: () => {
      toast.success("Transcript correction saved", { description: "The edited segment was re-indexed with its timestamp and speaker metadata." });
      transcript.refetch();
      documents.refetch();
    },
    onError: error => toast.error("Correction failed", { description: error.message }),
  });
  const reindex = trpc.workspace.reindex.useMutation({
    onSuccess: () => {
      toast.success("Document re-indexed", { description: "Answer cache was invalidated and the latest transcript metadata is searchable." });
      transcript.refetch();
      documents.refetch();
    },
    onError: error => toast.error("Re-index failed", { description: error.message }),
  });

  useEffect(() => {
    if (!transcript.data) return;
    setDrafts(Object.fromEntries(transcript.data.segments.map(segment => [segment.id, segment.text])));
  }, [transcript.data]);

  const selectedDocument = documents.data?.items.find(document => document.id === selectedId);
  const isMedia = transcript.data?.isMedia ?? (selectedDocument?.kind === "AUDIO" || selectedDocument?.kind === "VIDEO");

  return <AppShell><div className="space-y-8">
    <SectionHeader eyebrow="Corpus / source library" title="Documents" description="Cleaned, chunked, and indexed sources available to the answer engine." action={<Button onClick={() => toast.info("Use the workspace drop zone to add a source.")}><UploadCloud size={16} /> Add source</Button>} />
    <div className="grid gap-4 sm:grid-cols-3"><div className="panel p-5"><p className="eyebrow">Indexed</p><p className="metric-value mt-3">{documents.data?.total ?? "—"}</p><p className="mt-2 text-xs text-[var(--muted)]">Visible in this workspace</p></div><div className="panel p-5"><p className="eyebrow">Chunks ready</p><p className="metric-value mt-3">{documents.data ? documents.data.items.reduce((total, item) => total + item.chunks, 0).toLocaleString() : "—"}</p><p className="mt-2 text-xs text-[var(--muted)]">Searchable retrieval units on this page</p></div><div className="panel p-5"><p className="eyebrow">Media grounding</p><p className="metric-value mt-3 font-mono text-2xl">{documents.data?.items.filter(item => item.kind === "AUDIO" || item.kind === "VIDEO").length ?? "—"}</p><p className="mt-2 text-xs text-[var(--muted)]">Audio/video sources with review tools</p></div></div>
    <div className="panel overflow-hidden"><div className="flex flex-col gap-4 border-b border-[var(--line)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><p className="eyebrow">All sources</p><h3 className="mt-1 text-lg font-semibold">Your indexed library</h3></div><label className="relative block w-full sm:w-[280px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><input value={search} onChange={event => { setPage(1); setSearch(event.target.value); }} placeholder="Search documents" className="input pl-9" aria-label="Search documents" /></label></div>
      <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Source</th><th>Type</th><th>Chunks</th><th>Added</th><th>Status</th><th className="text-right">Grounding</th></tr></thead><tbody>{documents.isLoading ? [1,2,3,4].map(item => <tr key={item}><td colSpan={6}><div className="skeleton h-4 w-full" /></td></tr>) : documents.data?.items.map(document => <tr key={document.id} tabIndex={0} aria-selected={document.id === selectedId} className={cn("cursor-pointer transition-colors hover:bg-[var(--subtle)]", document.id === selectedId && "bg-[var(--subtle)]")} onClick={() => setSelectedId(document.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(document.id); } }}><td><div className="flex min-w-[250px] items-center gap-3"><div className="file-icon">{kindIcon(document.kind)}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{document.name}</p><p className="mt-1 truncate text-[11px] text-[var(--muted)]">{document.summary}</p></div></div></td><td><span className="font-mono text-[11px] text-[var(--muted)]">{document.kind}</span></td><td><span className="font-mono text-xs">{document.chunks}</span></td><td><span className="text-xs text-[var(--muted)]">{document.uploadedAt}</span></td><td><StatusPill label={document.status} /></td><td className="text-right"><span className="font-mono text-xs text-[var(--cyan-ink)]">{document.kind === "AUDIO" || document.kind === "VIDEO" ? "Timestamps" : document.tags[0]}</span></td></tr>)}</tbody></table></div>
      {!documents.isLoading && documents.data?.items.length === 0 && <div className="empty-state"><div className="empty-icon"><FolderOpen size={19} /></div><p className="mt-4 text-sm font-medium">No matching sources</p><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Try a different search term or add a new source from the workspace.</p></div>}
      <div className="flex items-center justify-between border-t border-[var(--line)] px-5 py-4 sm:px-6"><p className="text-xs text-[var(--muted)]">Showing {documents.data?.items.length ?? 0} of {documents.data?.total ?? 0} sources</p><div className="flex gap-2"><Button variant="outline" size="icon-sm" disabled={page === 1} onClick={() => setPage(current => Math.max(1, current - 1))} aria-label="Previous page"><ChevronLeft size={15} /></Button><Button variant="outline" size="icon-sm" disabled={!documents.data?.hasMore} onClick={() => setPage(current => current + 1)} aria-label="Next page"><ChevronRight size={15} /></Button></div></div>
    </div>

    {selectedId && <section className="panel overflow-hidden"><div className="flex flex-col gap-4 border-b border-[var(--line)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><p className="eyebrow">Transcript / correction desk</p><h3 className="mt-1 text-lg font-semibold">{selectedDocument?.name ?? "Selected source"}</h3><p className="mt-1 text-xs text-[var(--muted)]">{isMedia ? "Edit words without losing timestamps or speaker provenance." : "Re-index this source to rebuild its searchable chunks."}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => reindex.mutate({ documentId: selectedId })} disabled={reindex.isPending}><RefreshCw size={14} className={cn(reindex.isPending && "animate-spin")} /> {reindex.isPending ? "Re-indexing…" : "Re-index source"}</Button></div></div>{transcript.isLoading ? <div className="space-y-3 p-5 sm:p-6">{[1,2,3].map(item => <div className="skeleton h-20 w-full" key={item} />)}</div> : transcript.data && isMedia ? <div className="divide-y divide-[var(--line)]">{transcript.data.segments.map(segment => <div key={segment.id} className="grid gap-4 p-5 sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-start sm:p-6"><div className="space-y-2"><span className="inline-flex items-center gap-1 rounded-full bg-[var(--subtle)] px-2 py-1 font-mono text-[11px] text-[var(--cyan-ink)]"><Clock3 size={12} /> {segment.timestampLabel ?? `${formatTime(segment.startMs)}–${formatTime(segment.endMs)}`}</span><span className="flex items-center gap-1 text-[11px] text-[var(--muted)]"><Users size={12} /> {segment.speaker}</span>{segment.corrected && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--cyan-ink)]"><Check size={12} /> Corrected</span>}</div><div><textarea value={drafts[segment.id] ?? segment.text} onChange={event => setDrafts(current => ({ ...current, [segment.id]: event.target.value }))} className="textarea min-h-[78px] text-sm leading-6" aria-label={`Transcript segment ${segment.timestampLabel ?? segment.id}`} /><p className="mt-2 text-[10px] text-[var(--muted)]">Segment ID · {segment.id}</p></div><Button size="sm" variant="outline" onClick={() => correction.mutate({ documentId: selectedId, segmentId: segment.id, text: drafts[segment.id] ?? segment.text })} disabled={correction.isPending || (drafts[segment.id] ?? segment.text).trim() === segment.text.trim()}><MessageSquareText size={14} /> Save</Button></div>)}</div> : <div className="p-6 text-sm text-[var(--muted)]">This source has no timestamped transcript segments. Re-indexing will still rebuild its text chunks.</div>}</section>}
  </div></AppShell>;
}
