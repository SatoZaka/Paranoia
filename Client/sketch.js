// Connections
let peer;
let myId;
let connection;
let players = {};

// Player setup
let myPlayer;

// Connection setup
(function connect() {
  // Create a Peer instance
  peer = new Peer();

  // Wait until the Peer is ready before allowing connections
  peer.on("open", (id) => {
    console.log("Client ID: " + id);
    myId = id;

    // Prompt for the Host's Peer ID to connect
    let hostId = prompt("Enter Host Peer ID:");
    if (hostId) {
      connection = peer.connect(hostId);

      connection.on("open", () => {
        console.log("Connected to host: " + hostId);
        connection.send("NEED DATA");
      });

      connection.on("data", (data) => {
        console.log(data);
        if (data === "FULL") {
          peer.destroy();
          return alert("Host server is full.\nRefresh the page to try again.");
        }
        if (data === "DIED") {
          peer.destroy();
          return alert("You died.\nRefresh the page to try again.\nHost ID: " + hostId);
        }
        if (players && myPlayer) {
          
          // Receive host's updates
          players = data.players;
          delete players[myId];
        } else {
          
          // No information (first gather)
          players = data.players;
          myPlayer = data.players[myId];
          delete players[myId];
        }
      });

      connection.on("close", () => {
        alert(`Disconnected from Host`);
        peer.destroy();
        players = {};
        myPlayer = undefined;
      });
    } else peer.destroy();
  });
})();

function setup() {
  createCanvas(480, 480);
}

function draw() {
  if (!connection) return;

  background(50);
}