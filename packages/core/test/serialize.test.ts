import { describe, expect, it } from 'vitest'
import { parseCoT } from '../src/protocol/parse'

import { serializeCoT } from '../src/protocol/serialize'

const sample = `<event version="2.0" uid="BLUE-1" type="a-f-G-U-C-I" time="2026-01-01T00:00:00Z" start="2026-01-01T00:00:00Z" stale="2026-01-01T00:01:00Z"><point lat="40.4168" lon="-3.7038" hae="100" ce="5" le="10"/><detail><contact callsign="BLUE-1"/></detail></event>`

describe('serializeCoT', () => {
  it('roun-trips through parse', () => {
    const event = parseCoT(sample)
    expect(parseCoT(serializeCoT(event))).toEqual(event)
  })
})
