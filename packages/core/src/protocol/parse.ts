import type { CoTEvent } from './types'
import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
})

/**
 * Parses a CoT (Cursor on Target) XML string into a typed {@link CoTEvent}.
 * Inverse of {@link serializeCoT}.
 *
 * @param xml - A single CoT XML message (an `<event>` element).
 * @returns The parsed, typed event.
 * @throws If the XML has no `<event>` root or is missing its `<point>`.
 */
export function parseCoT(xml: string): CoTEvent {
  const raw = parser.parse(xml)
  const event = raw?.event
  if (!event)
    throw new Error('invalid CoT:missing <event> root')
  const point = event.point
  if (!point)
    throw new Error('invalid CoT:<event> missing <point>')

  return {
    version: String(event.version),
    uid: String(event.uid),
    type: String(event.type),
    time: String(event.time),
    start: String(event.start),
    stale: String(event.stale),
    how: event.how ? String(event.how) : undefined,
    point: {
      lat: Number(point.lat),
      lon: Number(point.lon),
      hae: Number(point.hae),
      ce: Number(point.ce),
      le: Number(point.le),
    },
    detail: event.detail
      ? {
          contact: event.detail.contact
            ? { callsign: event.detail.contact.callsign }
            : undefined,
        }
      : undefined,
  }
}
