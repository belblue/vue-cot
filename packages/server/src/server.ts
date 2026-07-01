import { WebSocketServer } from "ws";
const PORT = 8087;
const wss = new WebSocketServer({ port: PORT });
console.warn(`[mock-tak] listening on ws://localhost:${PORT}`);

function makeCot(): string {
  const now = new Date();
  const stale = new Date(now.getTime() + 60_000);
  return `<event version="2.0" uid="BLUE-1" type="a-f-G-U-C-I" time="${now.toISOString()}" start="${now.toISOString()}" stale="${stale.toISOString()}"><point lat="40.4168" lon="-3.7038" hae="100" ce="5" le="10"/><detail><contact callsign="BLUE-1"/></detail></event>`;
}

wss.on("connection", (socket) => {
  console.warn("[mock-tak] client connected");
  const timer = setInterval(() => socket.send(`${makeCot()}\n`), 1000);

  socket.on("close", () => {
    clearInterval(timer);
    console.warn("[mock-tak] client disconnected");
  });
});
