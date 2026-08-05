import { useEffect, useRef, useState } from 'react'
import type {
  ImageReference,
  ImageReferencePagination,
} from '@entities/document-feature'
import { useAuth } from '@features/auth'
import { ApiError } from '@shared/api'
import type { FormErrors } from '@shared/api'
import {
  createImageReference,
  deactivateImageReference,
  fetchImageReferences,
  updateImageReference,
} from '../api/featureManagement'

const IMAGE_PAGE_SIZE = 12

const EMPTY_PAGINATION: ImageReferencePagination = {
  page: 1,
  pageSize: IMAGE_PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
}

export type ImageReferenceEditor =
  | {
      mode: 'create'
      item: null
      file: File | null
      description: string
    }
  | {
      mode: 'edit'
      item: ImageReference
      file: null
      description: string
    }

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'
}

export function useImageReferences(valueId: number | null) {
  const { requestWithCsrf } = useAuth()
  const valueIdRef = useRef(valueId)
  const requestGenerationRef = useRef(0)
  const loadMoreInFlightRef = useRef(false)
  const [images, setImages] = useState<ImageReference[]>([])
  const [pagination, setPagination] =
    useState<ImageReferencePagination>(EMPTY_PAGINATION)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const [editor, setEditor] = useState<ImageReferenceEditor | null>(null)
  const [editorErrors, setEditorErrors] = useState<FormErrors>({})
  const [editorError, setEditorError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const requestGeneration = requestGenerationRef.current + 1
    requestGenerationRef.current = requestGeneration
    valueIdRef.current = valueId
    loadMoreInFlightRef.current = false
    setImages([])
    setPagination(EMPTY_PAGINATION)
    setError(null)
    setIsLoadingMore(false)
    setEditor(null)
    setEditorErrors({})
    setEditorError(null)

    if (valueId === null) {
      setIsLoading(false)
      return
    }

    let active = true
    setIsLoading(true)
    fetchImageReferences(valueId, 1, IMAGE_PAGE_SIZE)
      .then((response) => {
        if (
          !active ||
          requestGenerationRef.current !== requestGeneration
        ) {
          return
        }
        setImages(response.items)
        setPagination(response.pagination)
      })
      .catch((requestError: unknown) => {
        if (
          active &&
          requestGenerationRef.current === requestGeneration
        ) {
          setError(errorMessage(requestError))
        }
      })
      .finally(() => {
        if (
          active &&
          requestGenerationRef.current === requestGeneration
        ) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [revision, valueId])

  const loadMore = async () => {
    if (
      valueId === null ||
      isLoading ||
      isLoadingMore ||
      loadMoreInFlightRef.current ||
      pagination.page >= pagination.totalPages
    ) {
      return
    }

    const requestedValueId = valueId
    const requestedGeneration = requestGenerationRef.current
    loadMoreInFlightRef.current = true
    setIsLoadingMore(true)
    setError(null)
    try {
      const response = await fetchImageReferences(
        valueId,
        pagination.page + 1,
        IMAGE_PAGE_SIZE,
      )
      if (
        valueIdRef.current !== requestedValueId ||
        requestGenerationRef.current !== requestedGeneration
      ) {
        return
      }
      setImages((current) => {
        const currentIds = new Set(current.map((image) => image.id))
        return [
          ...current,
          ...response.items.filter(
            (image) => !currentIds.has(image.id),
          ),
        ]
      })
      setPagination(response.pagination)
    } catch (requestError) {
      if (
        valueIdRef.current === requestedValueId &&
        requestGenerationRef.current === requestedGeneration
      ) {
        setError(errorMessage(requestError))
      }
    } finally {
      if (
        valueIdRef.current === requestedValueId &&
        requestGenerationRef.current === requestedGeneration
      ) {
        loadMoreInFlightRef.current = false
        setIsLoadingMore(false)
      }
    }
  }

  const refreshImages = () => {
    requestGenerationRef.current += 1
    loadMoreInFlightRef.current = false
    setIsLoadingMore(false)
    setRevision((current) => current + 1)
  }

  const openCreate = () => {
    if (valueId === null) {
      return
    }
    setEditor({
      mode: 'create',
      item: null,
      file: null,
      description: '',
    })
    setEditorErrors({})
    setEditorError(null)
  }

  const openEdit = (item: ImageReference) => {
    setEditor({
      mode: 'edit',
      item,
      file: null,
      description: item.description,
    })
    setEditorErrors({})
    setEditorError(null)
  }

  const closeEditor = () => {
    if (!isSubmitting) {
      setEditor(null)
      setEditorErrors({})
      setEditorError(null)
    }
  }

  const changeDescription = (description: string) => {
    setEditor((current) =>
      current ? { ...current, description } : current,
    )
    setEditorErrors((current) => {
      if (!current.description) {
        return current
      }
      const next = { ...current }
      delete next.description
      return next
    })
    setEditorError(null)
  }

  const changeFile = (file: File | null) => {
    setEditor((current) =>
      current?.mode === 'create' ? { ...current, file } : current,
    )
    setEditorErrors((current) => {
      if (!current.image) {
        return current
      }
      const next = { ...current }
      delete next.image
      return next
    })
    setEditorError(null)
  }

  const submitEditor = async () => {
    if (!editor || valueId === null) {
      return
    }

    const localErrors: FormErrors = {}
    if (!editor.description.trim()) {
      localErrors.description = ['설명을 입력해 주세요.']
    }
    if (editor.mode === 'create' && editor.file === null) {
      localErrors.image = ['이미지 파일을 선택해 주세요.']
    }
    if (Object.keys(localErrors).length > 0) {
      setEditorErrors(localErrors)
      return
    }

    setIsSubmitting(true)
    setEditorErrors({})
    setEditorError(null)
    try {
      if (editor.mode === 'create') {
        await requestWithCsrf((token) =>
          createImageReference(
            valueId,
            editor.file!,
            editor.description,
            token,
          ),
        )
      } else {
        await requestWithCsrf((token) =>
          updateImageReference(
            editor.item.id,
            editor.description,
            token,
          ),
        )
      }
      setEditor(null)
      refreshImages()
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setEditorErrors(requestError.errors ?? {})
        if (
          !requestError.errors ||
          Object.keys(requestError.errors).length === 0
        ) {
          setEditorError(requestError.message)
        }
      } else {
        setEditorError(errorMessage(requestError))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const deactivateEditorItem = async () => {
    if (
      editor?.mode !== 'edit' ||
      !window.confirm('이 이미지를 비활성화하시겠습니까?')
    ) {
      return
    }

    setIsSubmitting(true)
    setEditorError(null)
    try {
      await requestWithCsrf((token) =>
        deactivateImageReference(editor.item.id, token),
      )
      setEditor(null)
      refreshImages()
    } catch (requestError) {
      setEditorError(errorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const deactivateItem = async (item: ImageReference) => {
    if (
      !window.confirm(`"${item.originName}" 이미지를 비활성화하시겠습니까?`)
    ) {
      return
    }

    setError(null)
    try {
      await requestWithCsrf((token) =>
        deactivateImageReference(item.id, token),
      )
      refreshImages()
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  return {
    images,
    pagination,
    isLoading,
    isLoadingMore,
    error,
    editor,
    editorErrors,
    editorError,
    isSubmitting,
    loadMore,
    openCreate,
    openEdit,
    closeEditor,
    changeDescription,
    changeFile,
    submitEditor,
    deactivateEditorItem,
    deactivateItem,
  }
}
