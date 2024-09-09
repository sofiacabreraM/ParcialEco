const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.json());
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  path: "/real-time",
  cors: {
    origin: "*",
  },
});

const db = {
  players: [],
};

const roles = ["Marco", "Polo", "Polo Especial"];

io.on("connection", (socket) => {
  socket.on("joinGame", (user) => {
    if (!db.players.find(p => p.nickname === user.nickname)) {
      db.players.push({ ...user, role: null, socketId: socket.id });
    }
    io.emit("userJoined", db);
  });

  socket.on("startGame", () => {
    if (db.players.length >= 3) {
      const shuffledPlayers = db.players.sort(() => Math.random() - 0.5);
      db.players = shuffledPlayers.map((player, index) => ({
        ...player,
        role: roles[index] || "Polo Especial",
      }));
      io.emit("gameStarted", db.players);
    } else {
      socket.emit("error", "Se necesitan 3 jugadores.");
    }
  });

  socket.on("playerAction", (action) => {
    if (action.action === "MARCO") {
      const polos = db.players.filter(player => player.role !== "Marco");
      io.emit("marcoGritado", { player: action.player, polos });
    } else if (action.action === "POLO") {
      const marco = db.players.find(player => player.role === "Marco");
      if (marco) {
        io.to(marco.socketId).emit("poloGritado", action.player);
      }
    }
  });

  socket.on("selectPolo", (selectedPoloNickname) => {
    const marco = db.players.find(player => player.role === "Marco");
    const polo = db.players.find(player => player.nickname === selectedPoloNickname);

    if (marco && polo) {
      if (polo.role === "Polo Especial") {
        io.emit("gameEnded", "El juego ha terminado");
      } else {
        // Swap roles
        marco.role = "Polo";
        polo.role = "Marco";
        io.emit("rolesUpdated", db.players);
      }
    }
  });

  socket.on("disconnect", () => {
    db.players = db.players.filter(player => player.socketId !== socket.id);
    io.emit("userJoined", db);
    console.log("Cliente desconectado");
  });

  socket.on("resetGame", () => {
    db.players = [];
    io.emit("gameReset");
  });
});

httpServer.listen(5050, () => {
  console.log(`Server is running on http://localhost:${5050}`);
});
