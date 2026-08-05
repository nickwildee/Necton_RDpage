import type {
  FeatureGroup,
  FeatureType,
  FeatureValue,
  FeatureValuePagination,
  ImageReference,
  ImageReferencePagination,
} from '@entities/document-feature'
import { apiRequest } from '@shared/api'

type ItemsResponse<T> = {
  items: T[]
}

type ItemResponse<T> = {
  item: T
}

type DetailResponse = {
  detail: string
}

type ValueListResponse = ItemsResponse<FeatureValue> & {
  pagination: FeatureValuePagination
}

type ImageListResponse = ItemsResponse<ImageReference> & {
  pagination: ImageReferencePagination
}

export type GroupPayload = {
  feature: string
  description: string
}

export type TypePayload = GroupPayload & {
  groupId: number
  note: string | null
  physicalType: string | null
  semanticRole: string | null
}

export type ValuePayload = {
  typeId: number
  feature: string
  description: string | null
  cWeight: number | null
  sWeight: number | null
  oWeight: number | null
}

function mutation<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  data: object,
  csrfToken: string,
) {
  return apiRequest<T>(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify(data),
  })
}

function imageMutation<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  csrfToken: string,
  body: BodyInit,
  contentType?: string,
) {
  return apiRequest<T>(path, {
    method,
    headers: {
      ...(contentType ? { 'Content-Type': contentType } : {}),
      'X-CSRFToken': csrfToken,
    },
    body,
  })
}

export function fetchFeatureGroups() {
  return apiRequest<ItemsResponse<FeatureGroup>>(
    '/api/settings/feature-groups/',
  )
}

export function createFeatureGroup(
  payload: GroupPayload,
  csrfToken: string,
) {
  return mutation<ItemResponse<FeatureGroup>>(
    '/api/settings/feature-groups/',
    'POST',
    payload,
    csrfToken,
  )
}

export function updateFeatureGroup(
  groupId: number,
  payload: GroupPayload,
  csrfToken: string,
) {
  return mutation<ItemResponse<FeatureGroup>>(
    `/api/settings/feature-groups/${groupId}/`,
    'PATCH',
    payload,
    csrfToken,
  )
}

export function deleteFeatureGroup(
  groupId: number,
  csrfToken: string,
) {
  return mutation<DetailResponse>(
    `/api/settings/feature-groups/${groupId}/`,
    'DELETE',
    {},
    csrfToken,
  )
}

export function fetchFeatureTypes(groupId: number) {
  const query = new URLSearchParams({ groupId: String(groupId) })
  return apiRequest<ItemsResponse<FeatureType>>(
    `/api/settings/feature-types/?${query}`,
  )
}

export function createFeatureType(
  payload: TypePayload,
  csrfToken: string,
) {
  return mutation<ItemResponse<FeatureType>>(
    '/api/settings/feature-types/',
    'POST',
    payload,
    csrfToken,
  )
}

export function updateFeatureType(
  typeId: number,
  payload: Omit<TypePayload, 'groupId'>,
  csrfToken: string,
) {
  return mutation<ItemResponse<FeatureType>>(
    `/api/settings/feature-types/${typeId}/`,
    'PATCH',
    payload,
    csrfToken,
  )
}

export function deleteFeatureType(
  typeId: number,
  csrfToken: string,
) {
  return mutation<DetailResponse>(
    `/api/settings/feature-types/${typeId}/`,
    'DELETE',
    {},
    csrfToken,
  )
}

export function fetchFeatureValues(
  typeId: number,
  page: number,
  pageSize: number,
) {
  const query = new URLSearchParams({
    typeId: String(typeId),
    page: String(page),
    pageSize: String(pageSize),
  })
  return apiRequest<ValueListResponse>(
    `/api/settings/feature-values/?${query}`,
  )
}

export function createFeatureValue(
  payload: ValuePayload,
  csrfToken: string,
) {
  return mutation<ItemResponse<FeatureValue>>(
    '/api/settings/feature-values/',
    'POST',
    payload,
    csrfToken,
  )
}

export function updateFeatureValue(
  valueId: number,
  payload: Omit<ValuePayload, 'typeId'>,
  csrfToken: string,
) {
  return mutation<ItemResponse<FeatureValue>>(
    `/api/settings/feature-values/${valueId}/`,
    'PATCH',
    payload,
    csrfToken,
  )
}

export function deleteFeatureValue(
  valueId: number,
  csrfToken: string,
) {
  return mutation<DetailResponse>(
    `/api/settings/feature-values/${valueId}/`,
    'DELETE',
    {},
    csrfToken,
  )
}

export function fetchImageReferences(
  valueId: number,
  page: number,
  pageSize: number,
) {
  const query = new URLSearchParams({
    valueId: String(valueId),
    page: String(page),
    pageSize: String(pageSize),
  })
  return apiRequest<ImageListResponse>(
    `/api/settings/image-references/?${query}`,
  )
}

export function createImageReference(
  valueId: number,
  image: File,
  description: string,
  csrfToken: string,
) {
  const formData = new FormData()
  formData.append('valueId', String(valueId))
  formData.append('image', image)
  formData.append('description', description)
  return imageMutation<
    ItemResponse<ImageReference> & { reactivated: boolean }
  >(
    '/api/settings/image-references/',
    'POST',
    csrfToken,
    formData,
  )
}

export function updateImageReference(
  imageId: number,
  description: string,
  csrfToken: string,
) {
  return imageMutation<ItemResponse<ImageReference>>(
    `/api/settings/image-references/${imageId}/`,
    'PATCH',
    csrfToken,
    JSON.stringify({ description }),
    'application/json',
  )
}

export function deactivateImageReference(
  imageId: number,
  csrfToken: string,
) {
  return imageMutation<DetailResponse>(
    `/api/settings/image-references/${imageId}/`,
    'DELETE',
    csrfToken,
    JSON.stringify({}),
    'application/json',
  )
}
