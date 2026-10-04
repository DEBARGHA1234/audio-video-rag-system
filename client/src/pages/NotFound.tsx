import { Link } from "wouter";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/AppShell";

export default function NotFound() {
  return <AppShell><div className="flex min-h-[64vh] items-center justify-center"><div className="max-w-md text-center"><div className="empty-icon mx-auto"><SearchX size={21} /></div><p className="eyebrow mt-6">404 / signal lost</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">This route is not indexed.</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">The page you requested does not exist in this workspace. Go back to the corpus and keep asking better questions.</p><Button asChild className="mt-6"><Link href="/"><ArrowLeft size={15} /> Back to workspace</Link></Button></div></div></AppShell>;
}
