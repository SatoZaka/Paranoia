// Game setup
let mapSize = 1000;

// Connections
let peer;
let myId;
let connections = {};
let players = {};
let active = false;

// Player setup
let myPlayer;
let radius = 15;

// Connection setup
(function connect() {
  // Create a Peer instance
  peer = new Peer();

  // Log the ID assigned to this peer
  peer.on("open", (id) => {
    alert("My Host Peer ID: " + id);
    console.log("Host ID: " + id);
    myId = id;
    myPlayer = {
      id: id,
      color: 0xff0000,
      x: random(mapSize),
      y: random(mapSize)
    };
    active = true;
  });

  // Handle incoming connections
  peer.on("connection", (connection) => {
    let connected = true;
    connections[connection.peer] = connection;
    console.log("New Client ID: " + connection.peer);
    players[connection.peer] = {
      id: connection.peer,
      color: assignColor(),
      x: random(mapSize),
      y: random(mapSize)
    };

    updateData();

    connection.on("open", () => {
      if (connected) {
        updateData();
      } else {
        console.log("Server is full. Disconnecting new client...");
        connection.send("FULL");
        delete connections[connection.peer];
        connection.close();
      }
    });

    connection.on("data", (data) => {
      if (data === "NEED DATA") {
        updateData();
      } else {
        players[connection.peer] = data.player;
        updateData();
      }
    });

    connection.on("close", () => {
      console.log(`Client ${connection.peer} disconnected`);
      delete connections[connection.peer]; // Remove from active connections
      delete players[connection.peer];
      updateData();
    });
  });
})();

function setup() {
  createCanvas(480, 480);
}

function draw() {
  if (!active) return;

  background(50);
  translate(width / 2, height / 2);

  drawWorldBorders();
  drawPlayers();
}

function drawPlayers() {
  for (let player in players) {
      let r = (players[player].color >> 16) & 0xff,
          g = (players[player].color >> 8) & 0xff,
          b = players[player].color & 0xff;
      noStroke();
      fill(r, g, b);
      circle(
          players[player].x - myPlayer.x,
          players[player].y - myPlayer.y,
          radius * 2
      );
  }

  let r = (myPlayer.color >> 16) & 0xff,
      g = (myPlayer.color >> 8) & 0xff,
      b = myPlayer.color & 0xff;
  noStroke();
  fill(r, g, b);
  circle(0, 0, radius * 2);
}

function drawWorldBorders() {
  if (myId && myPlayer) {
      let offset = createVector(myPlayer.x, myPlayer.y);
      fill(205);
      stroke(0);
      strokeWeight(10);
      rect(
          -offset.x - radius,
          -offset.y - radius,
          mapSize + radius * 2,
          mapSize + radius * 2
      );
  }
}

// Host Functions

function updateData() {
  for (const connection in connections) {
    if (connections[connection].open) {
      connections[connection].send({
        players: {
          ...players,
          [myId]: myPlayer,
        }
      });
    }
  }
}

function assignColor() {
  const preferredColors = [
    0x0000bf,
    0x00bf00,
    0xdfdf00,
    0x7f00ff,
    0xd76700,
    0x00dfdf,
    0xff00ff,
  ];

  // Get all currently used colors
  const usedColors = Object.values(players).map((player) => player.color);

  // Find the first unused color
  const availableColor = preferredColors.find(
    (color) => !usedColors.includes(color)
  );

  return availableColor !== undefined ? availableColor : random(0xffffff);
}