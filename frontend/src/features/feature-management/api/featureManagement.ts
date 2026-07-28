import type {
  FeatureGroup,
  FeatureType,
  FeatureValue,
  FeatureValuePagination,
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

export type GroupPayload = {
  feature: string
  description: string
}

export type TypePayload = GroupPayload & {
  groupId: number
  note: string | null
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
