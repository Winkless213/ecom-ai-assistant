/** 调用 api/web.py 提供的接口。网页和接口在同一个地址下，所以用相对路径。 */
export class ApiError extends Error {}

/** 静态演示或尚未启动后端时抛出，页面应展示说明而不是接口报错。 */
export class OfflineApiError extends ApiError {
  constructor() {
    super("当前是静态演示，没有后端接口")
    this.name = "OfflineApiError"
  }
}

function isOfflineResponse(r: Response) {
  const ct = r.headers.get("content-type") ?? ""
  return r.status === 404 || r.status === 405 || ct.includes("text/html")
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let r: Response
  try {
    r = await fetch(`./api/${path}`, init)
  } catch {
    throw new OfflineApiError()
  }
  if (isOfflineResponse(r)) throw new OfflineApiError()
  if (!r.ok) {
    let detail = ""
    try {
      detail = (await r.json()).detail ?? ""
    } catch {
      /* ignore */
    }
    throw new ApiError(detail || `接口返回错误（${r.status}）`)
  }
  return r.json()
}

export const apiGet = <T,>(path: string) => request<T>(path)
export const apiPost = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })

export type Status = {
  llm: boolean; model: string; demo: boolean; daily_limit: number; retriever: string
  ask_examples: string[]; service_examples: string[]
  eval_dev: { accuracy: string; correct: number; total: number } | null
  eval_holdout: { accuracy: string; correct: number; total: number } | null
}
export type Table = { columns: string[]; rows: (string | number | null)[][]; total_rows: number }
export type AskAnswer = {
  question: string; sql: string; explanation: string; summary: string; error: string
  attempts: number; seconds: number; trace: { sql: string; error: string }[]; table: Table | null
}
export type ReportResult = {
  title: string; markdown: string; source: string; unverified_numbers: string[]; error: string; facts: unknown
  cached?: boolean; generated_at?: string
}
export type ServiceResult = {
  question: string; answer: string; need_human: boolean; error: string; mode: string; top_score: number
  no_answer_score: number; hits: { source: string; text: string; score: number }[]
}
export type TicketResult = {
  rule: string; error: string
  llm: { category?: string; urgency?: string; sentiment?: string; summary?: string; need_human?: boolean } | null
}
export type BatchResult = {
  accuracy: number; total: number; dist: { category: string; count: number }[]
  wrong: { text: string; label: string; pred: string }[]; categories: { name: string; desc: string }[]; llm: boolean
}
