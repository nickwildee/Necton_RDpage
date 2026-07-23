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
