export const DOCUMENT_IMAGE_GROUP_ID = 3

export type FeatureGroup = {
  id: number
  feature: string
  description: string
}

export type FeatureType = {
  id: number
  groupId: number | null
  feature: string
  description: string
  note: string | null
  physicalType: string | null
  semanticRole: string | null
}

export type FeatureValue = {
  id: number
  groupId: number | null
  typeId: number | null
  featureType: string
  feature: string
  description: string | null
  cWeight: number | null
  sWeight: number | null
  oWeight: number | null
}

export type FeatureValuePagination = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type ImageReference = {
  id: number
  valueId: number
  originName: string
  storedName: string
  description: string
  registeredAt: string
  updatedAt: string
  fileUrl: string
}

export type ImageReferencePagination = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
