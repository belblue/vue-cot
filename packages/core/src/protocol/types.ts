export interface CoTPoint {
  lat: number
  lon: number
  hae: number
  ce: number
  le: number
}

export interface CoTContact {
  callsign?: string
  endpoint?: string
}
export interface CoTDetail {
  contact?: CoTContact
}
export interface CoTEvent {
  version: string
  uid: string
  type: string
  time: string
  start: string
  stale: string
  how?: string
  point: CoTPoint
  detail?: CoTDetail
}
