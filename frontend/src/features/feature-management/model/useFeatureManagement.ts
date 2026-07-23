import { useEffect, useMemo, useState } from 'react'
import type {
  FeatureGroup,
  FeatureType,
  FeatureValue,
  FeatureValuePagination,
} from '@entities/document-feature'
import { useAuth } from '@features/auth'
import { ApiError } from '@shared/api'
import type { FormErrors } from '@shared/api'
import {
  createFeatureGroup,
  createFeatureType,
  createFeatureValue,
  deleteFeatureGroup,
  deleteFeatureType,
  deleteFeatureValue,
  fetchFeatureGroups,
  fetchFeatureTypes,
  fetchFeatureValues,
  updateFeatureGroup,
  updateFeatureType,
  updateFeatureValue,
} from '../api/featureManagement'

export type EditorKind = 'group' | 'type' | 'value'
export type EditorMode = 'create' | 'edit'

type EditorFields = {
  feature: string
  description: string
  note: string
  cWeight: string
  sWeight: string
  oWeight: string
}

export type EditorFieldName = keyof EditorFields

export type FeatureEditorState = {
  kind: EditorKind
  mode: EditorMode
  id: number | null
  fields: EditorFields
}

const EMPTY_PAGINATION: FeatureValuePagination = {
  page: 1,
  pageSize: 8,
  totalItems: 0,
  totalPages: 1,
}

const EMPTY_FIELDS: EditorFields = {
  feature: '',
  description: '',
  note: '',
  cWeight: '',
  sWeight: '',
  oWeight: '',
}

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'
}

function weightValue(value: string) {
  return value.trim() ? Number(value) : null
}

export function useFeatureManagement() {
  const { requestWithCsrf } = useAuth()
  const [groups, setGroups] = useState<FeatureGroup[]>([])
  const [types, setTypes] = useState<FeatureType[]>([])
  const [values, setValues] = useState<FeatureValue[]>([])
  const [pagination, setPagination] =
    useState<FeatureValuePagination>(EMPTY_PAGINATION)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)
  const [isLoadingValues, setIsLoadingValues] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [editor, setEditor] = useState<FeatureEditorState | null>(null)
  const [editorErrors, setEditorErrors] = useState<FormErrors>({})
  const [editorError, setEditorError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [groupRevision, setGroupRevision] = useState(0)
  const [typeRevision, setTypeRevision] = useState(0)
  const [valueRevision, setValueRevision] = useState(0)

  useEffect(() => {
    let active = true
    setIsLoadingGroups(true)
    setGlobalError(null)

    fetchFeatureGroups()
      .then((response) => {
        if (!active) {
          return
        }
        setGroups(response.items)
        setSelectedGroupId((current) =>
          response.items.some((group) => group.id === current)
            ? current
            : (response.items[0]?.id ?? null),
        )
      })
      .catch((error: unknown) => {
        if (active) {
          setGlobalError(errorMessage(error))
          setGroups([])
          setSelectedGroupId(null)
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingGroups(false)
        }
      })

    return () => {
      active = false
    }
  }, [groupRevision])

  useEffect(() => {
    let active = true
    setTypes([])
    setValues([])
    setPagination(EMPTY_PAGINATION)
    setPage(1)

    if (selectedGroupId === null) {
      setSelectedTypeId(null)
      setIsLoadingTypes(false)
      return () => {
        active = false
      }
    }

    setIsLoadingTypes(true)
    setGlobalError(null)

    fetchFeatureTypes(selectedGroupId)
      .then((response) => {
        if (!active) {
          return
        }
        setTypes(response.items)
        setSelectedTypeId((current) =>
          response.items.some((type) => type.id === current)
            ? current
            : (response.items[0]?.id ?? null),
        )
      })
      .catch((error: unknown) => {
        if (active) {
          setGlobalError(errorMessage(error))
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingTypes(false)
        }
      })

    return () => {
      active = false
    }
  }, [selectedGroupId, typeRevision])

  useEffect(() => {
    let active = true
    setValues([])
    setPagination(EMPTY_PAGINATION)

    if (selectedTypeId === null) {
      setIsLoadingValues(false)
      return () => {
        active = false
      }
    }

    setIsLoadingValues(true)
    setGlobalError(null)

    fetchFeatureValues(selectedTypeId, page)
      .then((response) => {
        if (!active) {
          return
        }
        setValues(response.items)
        setPagination(response.pagination)
        if (response.pagination.page !== page) {
          setPage(response.pagination.page)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setGlobalError(errorMessage(error))
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingValues(false)
        }
      })

    return () => {
      active = false
    }
  }, [page, selectedTypeId, typeRevision, valueRevision])

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  )
  const selectedType = useMemo(
    () => types.find((type) => type.id === selectedTypeId) ?? null,
    [selectedTypeId, types],
  )

  const selectGroup = (groupId: number) => {
    setSelectedTypeId(null)
    setSelectedGroupId(groupId)
  }

  const selectType = (typeId: number) => {
    setPage(1)
    setSelectedTypeId(typeId)
  }

  const openEditor = (
    kind: EditorKind,
    mode: EditorMode,
    item?: FeatureGroup | FeatureType | FeatureValue,
  ) => {
    const featureValue = kind === 'value' ? (item as FeatureValue) : null
    const featureType = kind === 'type' ? (item as FeatureType) : null
    setEditorErrors({})
    setEditorError(null)
    setEditor({
      kind,
      mode,
      id: item?.id ?? null,
      fields: item
        ? {
            feature: item.feature,
            description: item.description ?? '',
            note: featureType?.note ?? '',
            cWeight: featureValue?.cWeight?.toString() ?? '',
            sWeight: featureValue?.sWeight?.toString() ?? '',
            oWeight: featureValue?.oWeight?.toString() ?? '',
          }
        : { ...EMPTY_FIELDS },
    })
  }

  const closeEditor = () => {
    if (!isSubmitting) {
      setEditor(null)
      setEditorErrors({})
      setEditorError(null)
    }
  }

  const changeEditorField = (
    name: EditorFieldName,
    value: string,
  ) => {
    setEditor((current) =>
      current
        ? {
            ...current,
            fields: { ...current.fields, [name]: value },
          }
        : current,
    )
    setEditorErrors((current) => {
      if (!(name in current)) {
        return current
      }
      const next = { ...current }
      delete next[name]
      return next
    })
    setEditorError(null)
  }

  const submitEditor = async () => {
    if (!editor) {
      return
    }

    setIsSubmitting(true)
    setEditorErrors({})
    setEditorError(null)
    setGlobalError(null)

    try {
      if (editor.kind === 'group') {
        const payload = {
          feature: editor.fields.feature,
          description: editor.fields.description,
        }
        if (editor.mode === 'create') {
          const response = await requestWithCsrf((token) =>
            createFeatureGroup(payload, token),
          )
          selectGroup(response.item.id)
        } else if (editor.id !== null) {
          await requestWithCsrf((token) =>
            updateFeatureGroup(editor.id!, payload, token),
          )
        }
        setGroupRevision((current) => current + 1)
      }

      if (editor.kind === 'type' && selectedGroup) {
        const payload = {
          feature: editor.fields.feature,
          description: editor.fields.description,
          note: editor.fields.note.trim() || null,
        }
        if (editor.mode === 'create') {
          const response = await requestWithCsrf((token) =>
            createFeatureType(
              { ...payload, groupId: selectedGroup.id },
              token,
            ),
          )
          setSelectedTypeId(response.item.id)
        } else if (editor.id !== null) {
          await requestWithCsrf((token) =>
            updateFeatureType(editor.id!, payload, token),
          )
        }
        setTypeRevision((current) => current + 1)
      }

      if (editor.kind === 'value' && selectedType) {
        const payload = {
          feature: editor.fields.feature,
          description: editor.fields.description.trim() || null,
          cWeight: weightValue(editor.fields.cWeight),
          sWeight: weightValue(editor.fields.sWeight),
          oWeight: weightValue(editor.fields.oWeight),
        }
        if (editor.mode === 'create') {
          await requestWithCsrf((token) =>
            createFeatureValue(
              { ...payload, typeId: selectedType.id },
              token,
            ),
          )
          setPage(
            Math.ceil(
              (pagination.totalItems + 1) / pagination.pageSize,
            ) || 1,
          )
        } else if (editor.id !== null) {
          await requestWithCsrf((token) =>
            updateFeatureValue(editor.id!, payload, token),
          )
        }
        setValueRevision((current) => current + 1)
      }

      setEditor(null)
    } catch (error) {
      if (error instanceof ApiError) {
        setEditorErrors(error.errors ?? {})
        if (!error.errors || Object.keys(error.errors).length === 0) {
          setEditorError(error.message)
        }
      } else {
        setEditorError(errorMessage(error))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteEditorItem = async () => {
    if (
      !editor ||
      editor.mode !== 'edit' ||
      editor.id === null ||
      !window.confirm('이 항목을 삭제하시겠습니까?')
    ) {
      return
    }

    setIsSubmitting(true)
    setEditorError(null)
    try {
      if (editor.kind === 'group') {
        await requestWithCsrf((token) =>
          deleteFeatureGroup(editor.id!, token),
        )
        setSelectedGroupId(null)
        setGroupRevision((current) => current + 1)
      }
      if (editor.kind === 'type') {
        await requestWithCsrf((token) =>
          deleteFeatureType(editor.id!, token),
        )
        setSelectedTypeId(null)
        setTypeRevision((current) => current + 1)
      }
      if (editor.kind === 'value') {
        await requestWithCsrf((token) =>
          deleteFeatureValue(editor.id!, token),
        )
        if (values.length === 1 && page > 1) {
          setPage((current) => current - 1)
        } else {
          setValueRevision((current) => current + 1)
        }
      }
      setEditor(null)
    } catch (error) {
      setEditorError(errorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteValue = async (featureValue: FeatureValue) => {
    if (!window.confirm(`"${featureValue.feature}" 항목을 삭제하시겠습니까?`)) {
      return
    }

    setGlobalError(null)
    try {
      await requestWithCsrf((token) =>
        deleteFeatureValue(featureValue.id, token),
      )
      if (values.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        setValueRevision((current) => current + 1)
      }
    } catch (error) {
      setGlobalError(errorMessage(error))
    }
  }

  return {
    groups,
    types,
    values,
    pagination,
    selectedGroup,
    selectedType,
    selectedGroupId,
    selectedTypeId,
    page,
    isLoadingGroups,
    isLoadingTypes,
    isLoadingValues,
    globalError,
    editor,
    editorErrors,
    editorError,
    isSubmitting,
    selectGroup,
    selectType,
    setPage,
    openEditor,
    closeEditor,
    changeEditorField,
    submitEditor,
    deleteEditorItem,
    deleteValue,
  }
}
