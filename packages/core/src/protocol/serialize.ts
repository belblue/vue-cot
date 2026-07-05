import type { CoTEvent } from "./types";

export function serializeCoT(event: CoTEvent): string {
  const how = event.how ? ` how="${event.how}"` : "";
  const callsign = event.detail?.contact?.callsign;
  const detail = callsign
    ? `<detail><contact callsign="${callsign}"/></detail>`
    : "";

  return (
    `<event version="${event.version}" uid="${event.uid}" type="${event.type}" ` +
    `time="${event.time}" start="${event.start}" stale="${event.stale}"${how}>` +
    `<point lat="${event.point.lat}" lon="${event.point.lon}" hae="${event.point.hae}" ` +
    `ce="${event.point.ce}" le="${event.point.le}"/>` +
    detail +
    `</event>`
  );
}
