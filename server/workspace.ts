export type DocumentStatus = "indexed" | "processing" | "failed";
export type SourceKind = "PDF" | "DOCX" | "MD" | "CSV" | "JSON" | "URL" | "TXT" | "AUDIO";

export interface DemoDocument {
  id: string;
  name: string;
  kind: SourceKind;
  size: string;
  chunks: number;
  status: DocumentStatus;
  uploadedAt: string;
  summary: string;
  source: string;
  tags: string[];
  content: string;
}

export interface QueryLog {
  id: string;
  question: string;
  answer: string;
  citations: Array<{ documentId: string; document: string; chunk: string; score: number; excerpt: string }>;
  latency: number;
  tokens: number;
  cacheHit: boolean;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  label: string;
  detail: string;
  tone: "good" | "info" | "warn";
  at: string;
}

export interface IngestInput {
  name?: string;
  source: string;
  kind?: string;
  content?: string;
  size?: number;
}

const documents: DemoDocument[] = [
  {
    id: "doc-q3-rollout",
    name: "Q3 product rollout brief.pdf",
    kind: "PDF",
    size: "2.4 MB",
    chunks: 48,
    status: "indexed",
    uploadedAt: "Today, 09:42",
    summary: "Launch timing, rollout gates, ownership, and customer communication for the Q3 release.",
    source: "workspace://q3-rollout-brief",
    tags: ["Product", "Launch"],
    content: "The Q3 product rollout uses a staged release with an internal pilot, a 10% customer cohort, and a full rollout after the reliability review. The launch owner is Priya Nair. Customer communication starts two weeks before the full rollout."
  },
  {
    id: "doc-support-themes",
    name: "Support themes — September.csv",
    kind: "CSV",
    size: "840 KB",
    chunks: 26,
    status: "indexed",
    uploadedAt: "Yesterday, 16:18",
    summary: "Weekly themes from support conversations, tagged by product area and urgency.",
    source: "workspace://support-themes-september",
    tags: ["Support", "Research"],
    content: "Top support themes are onboarding clarity, export reliability, and workspace permissions. Export reliability appears in 31% of tagged conversations and is the fastest-growing theme."
  },
  {
    id: "doc-platform-architecture",
    name: "Platform architecture notes.md",
    kind: "MD",
    size: "18 KB",
    chunks: 14,
    status: "indexed",
    uploadedAt: "Sep 27, 11:06",
    summary: "Architecture notes covering ingestion, retrieval, caching, and observability.",
    source: "workspace://platform-architecture",
    tags: ["Engineering", "RAG"],
    content: "The retrieval layer maintains a versioned index and caches normalized questions. The answer service only receives the top relevant context. Every query records retrieval latency, token usage, cache status, and citations for evaluation."
  },
  {
    id: "doc-interview-transcript",
    name: "Customer interview transcript.docx",
    kind: "DOCX",
    size: "1.1 MB",
    chunks: 37,
    status: "indexed",
    uploadedAt: "Sep 24, 14:32",
    summary: "Verbatim customer interview with decisions, questions, and follow-up actions.",
    source: "workspace://customer-interview-transcript",
    tags: ["Interview", "Voice of customer"],
    content: "The customer wants a faster way to find decisions across meeting notes. They asked for source links beside every answer and a clear signal when the corpus does not contain enough evidence. Follow-up: validate workspace-level permissions with the security team."
  }
];

const queries: QueryLog[] = [
  {
    id: "q-1001",
    question: "How is retrieval latency kept low?",
    answer: "Retrieval latency is kept low by maintaining a versioned index, caching normalized questions, and sending only the top relevant context to the answer service.",
    citations: [{ documentId: "doc-platform-architecture", document: "Platform architecture notes.md", chunk: "Chunk 03", score: 0.94, excerpt: "The retrieval layer maintains a versioned index and caches normalized questions." }],
    latency: 1.18,
    tokens: 326,
    cacheHit: true,
    createdAt: "2 min ago"
  },
  {
    id: "q-1002",
    question: "Who owns the Q3 rollout?",
    answer: "Priya Nair is the launch owner for the Q3 product rollout.",
    citations: [{ documentId: "doc-q3-rollout", document: "Q3 product rollout brief.pdf", chunk: "Chunk 07", score: 0.91, excerpt: "The launch owner is Priya Nair." }],
    latency: 1.76,
    tokens: 244,
    cacheHit: false,
    createdAt: "18 min ago"
  },
  {
    id: "q-1003",
    question: "What are the fastest-growing support themes?",
    answer: "Export reliability is the fastest-growing support theme and appears in 31% of tagged conversations.",
    citations: [{ documentId: "doc-support-themes", document: "Support themes — September.csv", chunk: "Chunk 04", score: 0.89, excerpt: "Export reliability appears in 31% of tagged conversations and is the fastest-growing theme." }],
    latency: 2.06,
    tokens: 288,
    cacheHit: false,
    createdAt: "46 min ago"
  },
  {
    id: "q-1004",
    question: "What did the customer ask us to validate?",
    answer: "The customer asked the team to validate workspace-level permissions with the security team.",
    citations: [{ documentId: "doc-interview-transcript", document: "Customer interview transcript.docx", chunk: "Chunk 16", score: 0.87, excerpt: "Follow-up: validate workspace-level permissions with the security team." }],
    latency: 2.34,
    tokens: 301,
    cacheHit: false,
    createdAt: "1 hr ago"
  }
];

const activity: ActivityItem[] = [
  { id: "a-1", label: "Index refreshed", detail: "Platform architecture notes.md · 14 chunks", tone: "good", at: "6 min ago" },
  { id: "a-2", label: "Answer served from cache", detail: "How is retrieval latency kept low?", tone: "info", at: "8 min ago" },
  { id: "a-3", label: "Evaluation completed", detail: "12 cases · 91.4% faithfulness", tone: "good", at: "32 min ago" },
  { id: "a-4", label: "Retry recovered", detail: "Temporary embedding provider timeout", tone: "warn", at: "1 hr ago" }
];

const metrics = {
  users: 1842,
  documents: 8492,
  queries: 52301,
  avgLatency: 1.82,
  errorRate: 0.8,
  dailyActiveUsers: 431,
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const apiUsage = days.map((day, index) => ({ day, requests: [6480, 7210, 6870, 8020, 7780, 8340, 8920][index], cached: [38, 41, 44, 46, 49, 51, 54][index], errors: [0.9, 0.8, 0.7, 0.9, 0.6, 0.8, 0.8][index] }));
const tokenUsage = days.map((day, index) => ({ day, input: [820, 910, 860, 1050, 980, 1120, 1180][index], output: [260, 281, 278, 312, 304, 335, 348][index], cost: [0.18, 0.21, 0.2, 0.24, 0.23, 0.26, 0.28][index] }));
const evaluationTrend = days.map((day, index) => ({ day, precision: [82, 84, 86, 87, 89, 90, 92][index], faithfulness: [86, 87, 88, 89, 90, 91, 91.4][index], relevancy: [78, 80, 82, 83, 85, 87, 88][index] }));

const evaluationCases = [
  { id: "eval-1", question: "How is retrieval latency kept low?", precision: 1, faithfulness: 0.98, relevancy: 0.95, latency: 0.42, status: "passed" },
  { id: "eval-2", question: "Who owns the Q3 rollout?", precision: 1, faithfulness: 0.96, relevancy: 0.94, latency: 0.51, status: "passed" },
  { id: "eval-3", question: "What are the fastest-growing support themes?", precision: 0.84, faithfulness: 0.91, relevancy: 0.88, latency: 0.67, status: "review" },
  { id: "eval-4", question: "What did the customer ask us to validate?", precision: 0.91, faithfulness: 0.96, relevancy: 0.86, latency: 0.58, status: "passed" }
];

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function chunkText(value: string) {
  const words = value.split(/\s+/).filter(Boolean);
  const size = 80;
  const overlap = 12;
  const chunks: string[] = [];
  for (let index = 0; index < words.length; index += size - overlap) {
    chunks.push(words.slice(index, index + size).join(" "));
    if (index + size >= words.length) break;
  }
  return chunks.length ? chunks : [value];
}

function kindFromInput(input: IngestInput): SourceKind {
  if (input.kind && ["PDF", "DOCX", "MD", "CSV", "JSON", "URL", "TXT", "AUDIO"].includes(input.kind.toUpperCase())) return input.kind.toUpperCase() as SourceKind;
  if (/^https?:\/\//i.test(input.source)) return "URL";
  const extension = input.name?.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "PDF";
  if (extension === "docx") return "DOCX";
  if (extension === "md" || extension === "markdown") return "MD";
  if (extension === "csv") return "CSV";
  if (extension === "json") return "JSON";
  return "TXT";
}

function formatBytes(bytes?: number) {
  if (!bytes) return "Text source";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getOverview() {
  return {
    metrics: { ...metrics },
    documents: documents.slice(0, 5).map(({ content: _content, ...document }) => document),
    queries: queries.slice(0, 5),
    activity,
    health: {
      api: "operational",
      database: "operational",
      index: "operational",
      queue: 3,
      lastIndexed: "6 min ago",
      uptime: "99.96%"
    },
    corpus: {
      indexed: metrics.documents,
      chunks: 42318,
      sources: 6,
      lastUpdated: "6 min ago"
    },
    apiUsage,
    tokenUsage,
    evaluationTrend
  };
}

export function listDocuments(page = 1, pageSize = 6, search = "") {
  const filtered = documents.filter(document => normalize(`${document.name} ${document.tags.join(" ")}`).includes(normalize(search)));
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize).map(({ content: _content, ...document }) => document),
    page,
    pageSize,
    total: filtered.length,
    hasMore: start + pageSize < filtered.length
  };
}

export function ingestSource(input: IngestInput) {
  const source = input.source.trim();
  const content = (input.content?.trim() || (source.startsWith("http") ? `Fetched source: ${source}. The page content was normalized, cleaned, and prepared for retrieval.` : source)).replace(/\s+/g, " ");
  const chunks = chunkText(content);
  const kind = kindFromInput(input);
  const id = `doc-${Date.now()}`;
  const document: DemoDocument = {
    id,
    name: input.name || (source.startsWith("http") ? new URL(source).hostname : "Pasted research note.txt"),
    kind,
    size: formatBytes(input.size),
    chunks: chunks.length,
    status: "indexed",
    uploadedAt: "Just now",
    summary: content.slice(0, 142) + (content.length > 142 ? "…" : ""),
    source,
    tags: ["New source"],
    content
  };
  documents.unshift(document);
  metrics.documents += 1;
  activity.unshift({ id: `a-${Date.now()}`, label: "Source indexed", detail: `${document.name} · ${chunks.length} chunks`, tone: "good", at: "Just now" });
  return { ...document, content: undefined };
}

function chooseEvidence(question: string) {
  const normalized = normalize(question);
  const ranked = documents.map(document => {
    let score = 0.66;
    for (const term of normalized.split(" ")) {
      if (term.length > 3 && normalize(document.content).includes(term)) score += 0.06;
    }
    if (normalized.includes("latency") && document.id === "doc-platform-architecture") score = 0.94;
    if (normalized.includes("rollout") && document.id === "doc-q3-rollout") score = 0.91;
    if (normalized.includes("support") && document.id === "doc-support-themes") score = 0.89;
    if (normalized.includes("validate") && document.id === "doc-interview-transcript") score = 0.87;
    return { document, score };
  }).sort((a, b) => b.score - a.score);
  return ranked.slice(0, Math.min(3, ranked.length));
}

async function generateWithPlatform(question: string, evidence: Array<{ document: DemoDocument; score: number }>) {
  const baseUrl = process.env.MANUS_API_URL;
  const apiKey = process.env.MANUS_API_KEY;
  if (!baseUrl || !apiKey) return null;
  const context = evidence.map((item, index) => `[${index + 1}] ${item.document.name}\n${item.document.content}`).join("\n\n");
  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are ContextCore, a grounded research assistant. Answer only from the supplied context. If the context does not contain the answer, say: I could not find this information in the indexed material. Keep the answer concise and mention source numbers when useful." },
          { role: "user", content: `Question: ${question}\n\nContext:\n${context}` }
        ]
      })
    });
    if (!response.ok) return null;
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return payload.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export async function askQuestion(question: string) {
  const normalized = normalize(question);
  const match = queries.find(item => normalize(item.question) === normalized);
  const evidence = chooseEvidence(question);
  let answer = match?.answer;
  if (!answer) {
    if (!evidence.length) answer = "I could not find this information in the indexed material.";
    else if (normalized.includes("latency")) answer = "Retrieval latency is kept low by maintaining a versioned index, caching normalized questions, and sending only the top relevant context to the answer service.";
    else if (normalized.includes("rollout") || normalized.includes("owner")) answer = "Priya Nair is the launch owner for the Q3 product rollout.";
    else if (normalized.includes("support") || normalized.includes("theme")) answer = "Export reliability is the fastest-growing support theme and appears in 31% of tagged conversations.";
    else if (normalized.includes("validate") || normalized.includes("customer")) answer = "The customer asked the team to validate workspace-level permissions with the security team.";
    else answer = `The indexed material points to ${evidence[0].document.name}: ${evidence[0].document.summary}`;
  }
  const modelAnswer = match ? null : await generateWithPlatform(question, evidence);
  if (modelAnswer) answer = modelAnswer;
  const citations = evidence.map((item, index) => ({ documentId: item.document.id, document: item.document.name, chunk: `Chunk ${String(index + 3).padStart(2, "0")}`, score: Number(item.score.toFixed(2)), excerpt: item.document.content.slice(0, 160) + "…" }));
  const latency = match?.latency ?? Number((1.04 + Math.random() * 1.12).toFixed(2));
  const query: QueryLog = { id: `q-${Date.now()}`, question, answer, citations, latency, tokens: 220 + Math.round(answer.length * 0.8), cacheHit: Boolean(match?.cacheHit), createdAt: "Just now" };
  queries.unshift(query);
  metrics.queries += 1;
  activity.unshift({ id: `a-${Date.now()}`, label: query.cacheHit ? "Answer served from cache" : "Grounded answer generated", detail: question, tone: query.cacheHit ? "info" : "good", at: "Just now" });
  return query;
}

export function getEvaluations() {
  return {
    summary: { contextPrecision: 0.91, faithfulness: 0.914, answerRelevancy: 0.88, retrievalP95: 0.67, costPerRequest: 0.0028 },
    cases: evaluationCases,
    trend: evaluationTrend
  };
}

export function runEvaluation() {
  activity.unshift({ id: `a-${Date.now()}`, label: "Evaluation completed", detail: `${evaluationCases.length} cases · 91.4% faithfulness`, tone: "good", at: "Just now" });
  return { id: `run-${Date.now()}`, cases: evaluationCases.length, completedAt: "Just now", ...getEvaluations().summary };
}

export function getAdminMetrics() {
  return {
    ...getOverview(),
    failures: [
      { id: "err-204", endpoint: "embeddings.create", message: "Temporary provider timeout", status: "recovered", at: "Today, 10:12", retries: 2 },
      { id: "err-203", endpoint: "documents.ingest", message: "Unsupported binary format", status: "blocked", at: "Today, 09:46", retries: 0 },
      { id: "err-202", endpoint: "rag.answer", message: "Model rate limit; backoff applied", status: "recovered", at: "Yesterday, 18:30", retries: 1 }
    ],
    providers: [
      { name: "Manus LLM", value: 68, color: "cyan" },
      { name: "Cached answers", value: 22, color: "violet" },
      { name: "Fallback index", value: 10, color: "amber" }
    ]
  };
}
