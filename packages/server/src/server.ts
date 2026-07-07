import { WebSocketServer } from "ws";
const PORT = 8087;
const wss = new WebSocketServer({ port: PORT });
console.warn(`[mock-tak] listening on ws://localhost:${PORT}`);

const CALLSIGNS = ["BLUE-1", "BLUE-2", "BLUE-3", "BLUE-4"];

function makeCot(uid: string): string {
  const now = new Date();
  const stale = new Date(now.getTime() + 10_000);
  const lat = (40.4168 + (Math.random() - 0.5) * 0.02).toFixed(5);
  const lon = (-3.7038 + (Math.random() - 0.5) * 0.02).toFixed(5);

  return `<event version="2.0" uid="${uid}" type="a-f-G-U-C-I" time="${now.toISOString()}" start="${now.toISOString()}" stale="${stale.toISOString()}"><point lat="${lat}" lon="${lon}" hae="100" ce="5" le="10"/><detail><contact callsign="${uid}"/></detail></event>`;
}

wss.on("connection", (socket) => {
  console.warn("[mock-tak] client connected");
  const timer = setInterval(() => {
    for (const uid of CALLSIGNS) socket.send(`${makeCot(uid)}\n`);
  }, 1000);

  socket.on("close", () => {
    clearInterval(timer);
    console.warn("[mock-tak] client disconnected");
  });
});
