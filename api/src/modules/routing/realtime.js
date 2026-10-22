// Tempo real com socket.io.
//
// Em vez do app ficar perguntando "onde o veículo está?" (polling), o
// servidor EMPURRA a posição pra quem estiver conectado, a cada tick da
// simulação.
//
// Como o cliente (telefonista ou socorrista) usa:
//
//   const socket = io("http://localhost:3000");
//
//   // telefonista: acompanhar TODOS os veículos
//   socket.emit("vehicles:subscribe");
//
//   // socorrista (ou telefonista): acompanhar UM veículo
//   socket.emit("vehicle:subscribe", vehicleId);
//
//   socket.on("vehicle:route", (data) => { ... });    // rota completa (desenhar a linha no mapa)
//   socket.on("vehicle:position", (data) => { ... }); // nova posição (mover o marcador)
//   socket.on("vehicle:arrived", (data) => { ... });  // chegou ao destino
//
// "Sala" (room) é só um grupo de conexões: quem entra numa sala recebe
// apenas as mensagens enviadas pra ela.

import { readFile } from "node:fs/promises";

import { Server } from "socket.io";

const ALL_VEHICLES_ROOM = "vehicles:all";
const vehicleRoom = (vehicleId) => `vehicle:${vehicleId}`;

let io = null;

export function setupRealtime(app) {
  io = new Server(app.server, {
    // Libera qualquer origem — ok pra projeto de simulação. Em produção,
    // trocar pelo endereço real do front end.
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    socket.on("vehicles:subscribe", () => socket.join(ALL_VEHICLES_ROOM));
    socket.on("vehicles:unsubscribe", () => socket.leave(ALL_VEHICLES_ROOM));

    socket.on("vehicle:subscribe", (vehicleId) => {
      if (typeof vehicleId === "string") socket.join(vehicleRoom(vehicleId));
    });
    socket.on("vehicle:unsubscribe", (vehicleId) => {
      if (typeof vehicleId === "string") socket.leave(vehicleRoom(vehicleId));
    });
  });

  // Página de teste (só pra desenvolvimento): http://localhost:3000/realtime-test
  // Servida pela própria API, então não tem problema de CORS nem de CDN.
  app.get("/realtime-test", { schema: { hide: true } }, async (_request, reply) => {
    const page = await readFile(new URL("./realtime-test.html", import.meta.url), "utf-8");
    return reply.type("text/html; charset=utf-8").send(page);
  });

  app.addHook("onClose", async () => {
    await io.close();
  });
}

// Envia um evento pra quem acompanha aquele veículo + pra quem acompanha todos.
// Se o socket.io não foi iniciado (ex: em testes), simplesmente não faz nada.
export function emitToVehicle(vehicleId, event, payload) {
  io?.to(vehicleRoom(vehicleId)).to(ALL_VEHICLES_ROOM).emit(event, payload);
}