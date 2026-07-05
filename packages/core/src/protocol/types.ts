export type CoTPoint = {
  lat: number;
  lon: number;
  hae: number;
  ce: number;
  le: number;
};

export type CoTContact = {
  callsign?: string;
  endpoint?: string;
};
export type CoTDetail = {
  contact?: CoTContact;
};
export type CoTEvent = {
  version: string;
  uid: string;
  type: string;
  time: string;
  start: string;
  stale: string;
  how?: string;
  point: CoTPoint;
  detail?: CoTDetail;
};
