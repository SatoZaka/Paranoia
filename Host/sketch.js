// Game setup
const gameWindow = {
  width: 480,
  height: 480
};
const inventoryHeight = 60;
let mapSize = 1000;
let itemList = [];
let bullets = [];

// Connections
let peer;
let myId;
let connections = {};
let players = {};
let active = false;

// Player setup
let myPlayer;
let radius = 15;
let angle;
let vision = 1;
const visionRecoveryPerSecond = 2;
const fovealAmplitude = 45;
const peripheralAmplitude = 180;
let inventory = [];
let selectedItem = -1;

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
      y: random(mapSize),
      health: 100
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
      y: random(mapSize),
      health: 100
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
        if (data.bullets) {
          bullets.push(data.bullets);
        }
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
  createCanvas(gameWindow.width, gameWindow.height + inventoryHeight);
}

function draw() {
  if (!active) return;

  background(50);
  translate(gameWindow.width / 2, gameWindow.height / 2);

  handleMovement();
  updateBullets();

  drawWorldBorders();
  drawPlayers();
  drawInventory();
}

function keyPressed() {
  if (["1", "2", "3", "4"].includes(key)) {
    let newSlot = parseInt(key) - 1;
    if (newSlot === selectedItem) newSlot = -1;
    selectedItem = newSlot;
  }
}

function drawInventory() {
  const offset = 1;
  strokeWeight(offset * 2);
  fill(50);
  textAlign(CENTER, CENTER);

  // Draw inventory slots
  for (let i = 0; i < 4; i++) {
    stroke(255);
    if (selectedItem === i) stroke(0, 255, 0);
    rect(
      gameWindow.width / 4 * i,
      gameWindow.height + offset,
      gameWindow.width / 4,
      inventoryHeight - offset * 2
    );
    let itemName = inventory[i].name || undefined;
    if (itemName) text(inventory[i].name, gameWindow.width / 8 * (i * 2 + 1), gameWindow.height + inventoryHeight / 2);
  }
}

function drawPlayers() {
  for (let player in players) {
    // Draw player circle
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

    // Draw player's health
    strokeWeight(5);
    let health = players[player].health;
    if (health <= 50) {
      r = 255;
      g = Math.round((255 * health) / 50);
      b = 0;
    } else if (health <= 100) {
      r = Math.round(255 - (255 * (health - 50)) / 50);
      g = 255;
      b = 0;
    } else {
      r = 0;
      b = 255;
      g = Math.round(255 - (255 * (health - 100)) / 100);
      stroke(0, 255, 0);
      circle(
        players[player].x - myPlayer.x,
        players[player].y - myPlayer.y,
        radius * 2 + 5
      );
    }
    stroke(r, g, b);
    arc(
      players[player].x - myPlayer.x,
      players[player].y - myPlayer.y,
      radius * 2 + 5,
      radius * 2 + 5,
      -HALF_PI,
      radians(health * 3.6) - HALF_PI
    );
  }

  // Draw Paranoia
  noStroke();

  const peripheralVision = peripheralAmplitude * vision;
  fill(0);
  if (peripheralVision <= 0) {
    circle(
      0,
      0,
      700
    )
  } else {
    arc(
      0,
      0,
      700,
      700,
      angle + radians(peripheralVision) / 2,
      angle - radians(peripheralVision) / 2
    );
  }

  const fovealVision = fovealAmplitude * (vision - 0.5) * 2;
  fill(0, 0, 0, 224);
  if (fovealVision <= 0) {
    circle(
      0,
      0,
      700
    )
  } else {
    arc(
      0,
      0,
      700,
      700,
      angle + radians(fovealVision) / 2,
      angle - radians(fovealVision) / 2
    );
  }

  // Draw my player circle
  let r = (myPlayer.color >> 16) & 0xff,
    g = (myPlayer.color >> 8) & 0xff,
    b = myPlayer.color & 0xff;
  noStroke();
  fill(r, g, b);
  circle(0, 0, radius * 2);

  // Draw my player's health
  strokeWeight(5);
  let health = myPlayer.health;
  if (health <= 50) {
    r = 255;
    g = Math.round((255 * health) / 50);
    b = 0;
  } else if (health <= 100) {
    r = Math.round(255 - (255 * (health - 50)) / 50);
    g = 255;
    b = 0;
  } else {
    r = 0;
    b = 255;
    g = Math.round(255 - (255 * (health - 100)) / 100);
    stroke(0, 255, 0);
    circle(0, 0, radius * 2 + 5);
  }
  stroke(r, g, b);
  arc(
    0,
    0,
    radius * 2 + 5,
    radius * 2 + 5,
    -HALF_PI,
    radians(health * 3.6) - HALF_PI
  );
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

function handleMovement() {
  if (myPlayer) {
    let sendUpdate = false;

    if (keyIsDown(LEFT_ARROW) || keyIsDown(65) || keyIsDown(97)) {
      // LEFT_ARROW, 'A', 'a'
      myPlayer.x -= 1;
      if (myPlayer.x <= 0) myPlayer.x = 0;
      sendUpdate = true;
    }
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68) || keyIsDown(100)) {
      // RIGHT_ARROW, 'D', 'd'
      myPlayer.x += 1;
      if (myPlayer.x >= 1000) myPlayer.x = 1000;
      sendUpdate = true;
    }

    if (keyIsDown(UP_ARROW) || keyIsDown(87) || keyIsDown(119)) {
      myPlayer.y -= 1;
      if (myPlayer.y <= 0) myPlayer.y = 0;
      sendUpdate = true;
    }
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83) || keyIsDown(115)) {
      myPlayer.y += 1;
      if (myPlayer.y >= 1000) myPlayer.y = 1000;
      sendUpdate = true;
    }

    vision += visionRecoveryPerSecond * deltaTime / 1000;

    var newAngle = atan2(mouseY - height / 2, mouseX - width / 2);
    if (angle !== undefined && newAngle !== undefined && newAngle != angle) {
      var deltaAngle = Math.abs(newAngle - angle);
      if (deltaAngle > PI) deltaAngle = Math.abs(deltaAngle - TWO_PI);
      var newVision = vision - (deltaAngle * deltaTime) / 50;
      if (vision >= 0.375 && newVision < 0.375) newVision = 0.375;
      vision = newVision;
      sendUpdate = true;
    }
    if (vision > 1) vision = 1;
    angle = newAngle;

    if (sendUpdate) updateData();
  }
}

// Host Functions

function checkIfDead(playerId) {
  if (playerId === myId) {
    if (myPlayer.health <= 0) {
      myPlayer.x = random(mapSize);
      myPlayer.y = random(mapSize);
      myPlayer.health = 100;
      myItems = [];
    }
  } else if (players[playerId].health <= 0) {
    connections[playerId].send("DIED");
    delete players[playerId];
  }
}

function updateBullets() {
  for (var i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    bullet.x += bullet.speed * Math.cos(bullet.angle);
    bullet.y += bullet.speed * Math.sin(bullet.angle);
    let bulletDelete = false;

    for (let index in players) {
      var player = players[index];
      if (bullet.color !== player.color) {
        const distanceToPlayer = Math.sqrt(
          Math.pow(bullet.x - player.x, 2) + Math.pow(bullet.y - player.y, 2)
        );
        if (distanceToPlayer <= radius) {
          player.health -= bullet.damage;
          checkIfDead(index);
          bulletDelete = true;
        }
      }
    }

    if (bullet.color !== myPlayer.color) {
      const distanceToPlayer = Math.sqrt(
        Math.pow(bullet.x - myPlayer.x, 2) + Math.pow(bullet.y - myPlayer.y, 2)
      );
      if (distanceToPlayer <= radius) {
        myPlayer.health -= bullet.damage;
        checkIfDead(myId);
        bulletDelete = true;
      }
    }
    const distance = Math.sqrt(
      Math.pow(bullet.x - bullet.startX, 2) +
      Math.pow(bullet.y - bullet.startY, 2)
    );

    if (distance >= bullet.range) bulletDelete = true;
    if (bulletDelete) bullets.splice(i, 1);
  }
  updateData();
}

function addBullet(speed = 10, range = 480, damage = 10, amplitude = 10) {
  amplitude /= 2;
  let bulletAngle = atan2(mouseY - height / 2, mouseX - width / 2) + random(-radians(amplitude), radians(amplitude));
  if (bulletAngle < -PI) bulletAngle += TWO_PI;
  if (bulletAngle > PI) bulletAngle -= TWO_PI;
  bullets.push({
    color: myPlayer.color,
    damage: damage,
    range: range,
    angle: bulletAngle,
    speed: speed,
    startX: myPlayer.x,
    startY: myPlayer.y,
    x: myPlayer.x,
    y: myPlayer.y,
  });
  updateData();
}

function updateData() {
  for (const connection in connections) {
    if (connections[connection].open) {
      connections[connection].send({
        players: {
          ...players,
          [myId]: myPlayer,
        },
        bullets: bullets
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