import { describe, expect, it } from 'vitest'
import { parseCoT } from '../src/protocol/parse'

const sample = `<event version="2.0" uid="BLUE-1" type="a-f-G-U-C-I" time="2026-01-01T00:00:00Z" start="2026-01-01T00:00:00Z" stale="2026-01-01T00:01:00Z"><point lat="40.4168" lon="-3.7038" hae="100" ce="5" le="10"/><detail><contact callsign="BLUE-1"/></detail></event>`

describe('parseCoT', () => {
  it('parses identity and type', () => {
    const event = parseCoT(sample)
    expect(event.uid).toBe('BLUE-1')
    expect(event.type).toBe('a-f-G-U-C-I')
  })
  it('coerces point fields to numbers', () => {
    const event = parseCoT(sample)
    expect(event.point.lat).toBe(40.4168)
    expect(typeof event.point.hae).toBe('number')
  })
  it('reads the nested contact callsign', () => {
    const event = parseCoT(sample)
    expect(event.detail?.contact?.callsign).toBe('BLUE-1')
  })
  it('throws on missing <event> root', () => {
    expect(() => parseCoT('<foo/>')).toThrow('missing <event>')
  })
  it('throws on <event> without <point>', () => {
    expect(() => parseCoT('<event uid="X"></event>')).toThrow(
      'missing <point>',
    )
  })
})
