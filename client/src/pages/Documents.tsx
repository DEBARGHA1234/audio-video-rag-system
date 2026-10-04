import { useState } from "react";
import { ChevronLeft, ChevronRight, FileJson, FileSpreadsheet, FileText, FileType2, FolderOpen, Search, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import AppShell, { SectionHeader, StatusPill } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

function kindIcon(kind: string) { if (kind === "CSV") return <FileSpreadsheet size={18} />; if (kind === "JSON") return <FileJson size={18} />; if (kind === "DOCX") return <FileType2 size={18} />; return <FileText size={18} />; }

export default function Documents() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const documents = trpc.workspace.documents.useQuery({ page, pageSize: 6, search });
  return <AppShell><div className="space-y-8">
    <SectionHeader eyebrow="Corpus / source library" title="Documents" description="Cleaned, chunked, and indexed sources available to the answer engine." action={<Button onClick={() => toast.info("Use the workspace drop zone to add a source.")}><UploadCloud size={16} /> Add source</Button>} />
    <div className="grid gap-4 sm:grid-cols-3"><div className="panel p-5"><p className="eyebrow">Indexed</p><p className="metric-value mt-3">{documents.data?.total ?? "—"}</p><p className="mt-2 text-xs text-[var(--muted)]">Visible in this workspace</p></div><div className="panel p-5"><p className="eyebrow">Chunks ready</p><p className="metric-value mt-3">42.3k</p><p className="mt-2 text-xs text-[var(--muted)]">Searchable retrieval units</p></div><div className="panel p-5"><p className="eyebrow">Index version</p><p className="metric-value mt-3 font-mono text-2xl">v1.4.8</p><p className="mt-2 text-xs text-[var(--muted)]">Updated 6 min ago</p></div></div>
    <div className="panel overflow-hidden"><div className="flex flex-col gap-4 border-b border-[var(--line)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><p className="eyebrow">All sources</p><h3 className="mt-1 text-lg font-semibold">Your indexed library</h3></div><label className="relative block w-full sm:w-[280px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><input value={search} onChange={event => { setPage(1); setSearch(event.target.value); }} placeholder="Search documents" className="input pl-9" aria-label="Search documents" /></label></div>
      <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Source</th><th>Type</th><th>Chunks</th><th>Added</th><th>Status</th><th className="text-right">Score</th></tr></thead><tbody>{documents.isLoading ? [1,2,3,4].map(item => <tr key={item}><td colSpan={6}><div className="skeleton h-4 w-full" /></td></tr>) : documents.data?.items.map(document => <tr key={document.id}><td><div className="flex min-w-[250px] items-center gap-3"><div className="file-icon">{kindIcon(document.kind)}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{document.name}</p><p className="mt-1 truncate text-[11px] text-[var(--muted)]">{document.summary}</p></div></div></td><td><span className="font-mono text-[11px] text-[var(--muted)]">{document.kind}</span></td><td><span className="font-mono text-xs">{document.chunks}</span></td><td><span className="text-xs text-[var(--muted)]">{document.uploadedAt}</span></td><td><StatusPill label={document.status} /></td><td className="text-right"><span className="font-mono text-xs text-[var(--cyan-ink)]">{document.tags[0]}</span></td></tr>)}</tbody></table></div>
      {!documents.isLoading && documents.data?.items.length === 0 && <div className="empty-state"><div className="empty-icon"><FolderOpen size={19} /></div><p className="mt-4 text-sm font-medium">No matching sources</p><p className="mt-2 text-xs text-[var(--muted)]">Try a different search term or add a new source from the workspace.</p></div>}
      <div className="flex items-center justify-between border-t border-[var(--line)] px-5 py-4 sm:px-6"><p className="text-xs text-[var(--muted)]">Showing {documents.data?.items.length ?? 0} of {documents.data?.total ?? 0} sources</p><div className="flex gap-2"><Button variant="outline" size="icon-sm" disabled={page === 1} onClick={() => setPage(current => Math.max(1, current - 1))} aria-label="Previous page"><ChevronLeft size={15} /></Button><Button variant="outline" size="icon-sm" disabled={!documents.data?.hasMore} onClick={() => setPage(current => current + 1)} aria-label="Next page"><ChevronRight size={15} /></Button></div></div>
    </div>
  </div></AppShell>;
}
