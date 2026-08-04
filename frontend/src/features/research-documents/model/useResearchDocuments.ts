import { useEffect, useState } from 'react'
import { ApiError } from '@shared/api'
import {
  fetchResearchDocuments,
  fetchResearchSummary,
} from '../api/researchDocuments'
import type {
  ResearchCategory,
  ResearchDocument,
  ResearchPagination,
  ResearchSummary,
} from '../api/researchDocuments'

const EMPTY_PAGINATION: ResearchPagination = {
  page: 1,
  pageSize: 30,
  totalItems: 0,
  totalPages: 1,
}

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function useResearchSummary() {
  const [summary, setSummary] = useState<ResearchSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    fetchResearchSummary(controller.signal)
      .then(setSummary)
      .catch((caught: unknown) => {
        if (!isAbortError(caught)) {
          setSummary(null)
          setError(errorMessage(caught))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [revision])

  return {
    summary,
    isLoading,
    error,
    retry: () => setRevision((current) => current + 1),
  }
}

export function useResearchDocumentPanel(category: ResearchCategory) {
  const [documents, setDocuments] = useState<ResearchDocument[]>([])
  const [pagination, setPagination] =
    useState<ResearchPagination>(EMPTY_PAGINATION)
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    fetchResearchDocuments(category, page, controller.signal)
      .then((response) => {
        setDocuments(response.items)
        setPagination(response.pagination)
        setExpandedId((current) =>
          response.items.some((document) => document.id === current)
            ? current
            : null,
        )
        if (response.pagination.page !== page) {
          setPage(response.pagination.page)
        }
      })
      .catch((caught: unknown) => {
        if (!isAbortError(caught)) {
          setDocuments([])
          setError(errorMessage(caught))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [category, page, revision])

  const changePage = (nextPage: number) => {
    if (
      nextPage < 1 ||
      nextPage > pagination.totalPages ||
      nextPage === page
    ) {
      return
    }
    setExpandedId(null)
    setPage(nextPage)
  }

  const toggleDocument = (documentId: number) => {
    setExpandedId((current) =>
      current === documentId ? null : documentId,
    )
  }

  return {
    category,
    documents,
    pagination,
    page,
    expandedId,
    isLoading,
    error,
    changePage,
    toggleDocument,
    retry: () => setRevision((current) => current + 1),
  }
}

export type ResearchDocumentPanelModel = ReturnType<
  typeof useResearchDocumentPanel
>
