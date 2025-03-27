// Connections
let peer;
let myId;
let connections = {};
let players = {};
let active = false;

// Player setup
let myPlayer;

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
      id: id
    };
    active = true;
  });

  // Handle incoming connections
  peer.on("connection", (connection) => {
    let connected = true;
    connections[connection.peer] = connection;
    console.log("New Client ID: " + connection.peer);
    players[connection.peer] = {
      id: connection.peer
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