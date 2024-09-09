const socket = io("http://localhost:5050", {
  path: "/real-time",
});

document.getElementById("join-button").addEventListener("click", () => {
  const name = document.getElementById("name").value;
  if (name) {
    socket.emit("joinGame", { nickname: name });
  } else {
    alert("Ingresa el nombre.");
  }
});

socket.on("userJoined", (data) => {
  const container = document.getElementById("data-container");
  const userList = data.players.map(player => `<p>${player.nickname}</p>`).join("");
  container.innerHTML = userList + `<button id="start-button">Iniciar juego</button>`;
  document.getElementById("name").style.display = "none";
  document.getElementById("join-button").style.display = "none";
  
  if (data.players.length >= 3) {
    document.getElementById("start-button").addEventListener("click", () => {
      socket.emit("startGame");
    });
  } else {
    document.getElementById("start-button").style.display = "none";
  }
});

socket.on("gameStarted", (players) => {
  const player = players.find(p => p.nickname === document.getElementById("name").value);
  
  if (player) {
    const container = document.getElementById("data-container");
    container.innerHTML = `<p>Tu rol es: ${player.role}</p>
                           <button id="marco-button">Gritar MARCO</button>
                           <button id="polo-button">Gritar POLO</button>`;
    
    document.getElementById("marco-button").addEventListener("click", () => {
      socket.emit("playerAction", { action: "MARCO", player: player.nickname });
    });

    document.getElementById("polo-button").addEventListener("click", () => {
      socket.emit("playerAction", { action: "POLO", player: player.nickname });
    });
  }
});

socket.on("marcoGritado", (data) => {
  if (data.polos.length > 0) {
    const container = document.getElementById("data-container");
    const polosList = data.polos.map(polo => `<p>${polo.nickname} ha gritado</p>`).join("");
    container.innerHTML = `<p>${data.player} ha gritado MARCO</p>
                           ${polosList}
                           <button id="gritar-polo">Gritar POLO</button>`;
    
    document.getElementById("gritar-polo").addEventListener("click", () => {
      socket.emit("playerAction", { action: "POLO", player: data.player });
    });
  }
});

socket.on("poloGritado", (player) => {
  const container = document.getElementById("data-container");
  container.innerHTML += `<p>${player} ha gritado POLO</p>`;
});

socket.on("rolesUpdated", (players) => {
  const player = players.find(p => p.nickname === document.getElementById("name").value);
  if (player) {
    const container = document.getElementById("data-container");
    const poloButtons = players.filter(p => p.role === "Polo")
                               .map(p => `<button class="polo-button">${p.nickname}</button>`)
                               .join("");
    container.innerHTML = `<p>Tu rol es: ${player.role}</p>
                           <p>Selecciona un POLO:</p>
                           ${poloButtons}`;
    
    document.querySelectorAll(".polo-button").forEach(button => {
      button.addEventListener("click", () => {
        socket.emit("selectPolo", button.textContent);
      });
    });
  }
});

socket.on("gameEnded", (message) => {
  alert(message);
  document.getElementById("data-container").innerHTML = "";
  document.getElementById("name").style.display = "block";
  document.getElementById("join-button").style.display = "block";
  document.getElementById("name").value = "";
});

socket.on("error", (message) => {
  alert(message);
});

socket.on("gameReset", () => {
  document.getElementById("name").style.display = "block";
  document.getElementById("join-button").style.display = "block";
  document.getElementById("data-container").innerHTML = "";
});

