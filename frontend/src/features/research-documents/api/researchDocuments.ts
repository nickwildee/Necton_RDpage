import { apiRequest } from '@shared/api'

export type ResearchCategory = 'O' | 'S' | 'C'

export type ResearchFile = {
  name: string
  url: string
}

export type ResearchDocument = {
  id: number
  category: ResearchCategory
  title: string | null
  orderingAgency: string | null
  department: string | null
  productionDate: string | null
  bodyFile: ResearchFile | null
  otherFiles: ResearchFile[]
}

export type ResearchPagination = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type ResearchSummary = {
  totalItems: number
  counts: Record<ResearchCategory, number>
}

type DocumentListResponse = {
  items: ResearchDocument[]
  pagination: ResearchPagination
}

export function fetchResearchSummary(signal?: AbortSignal) {
  return apiRequest<ResearchSummary>(
    '/api/research/documents/summary/',
    { signal },
  )
}

export function fetchResearchDocuments(
  category: ResearchCategory,
  page: number,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    category,
    page: String(page),
  })
  return apiRequest<DocumentListResponse>(
    `/api/research/documents/?${query}`,
    { signal },
  )
}
