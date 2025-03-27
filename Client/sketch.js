// Game setup
let mapSize = 1000;
let bullets = [];

// Connections
let peer;
let myId;
let connection;
let players = {};

// Player setup
let myPlayer;
let radius = 15;
let angle;
let vision = 1;
const visionRecoveryPerSecond = 2;
const fovealAmplitude = 45;
const peripheralAmplitude = 180;

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
          if (myPlayer.health !== data.players[myId].health) myPlayer.health = data.players[myId].health;
          bullets = data.bullets;
          delete players[myId];
        } else {

          // No information (first gather)
          players = data.players;
          myPlayer = data.players[myId];
          bullets = data.bullets;
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
  translate(width / 2, height / 2);

  handleMovement();

  drawWorldBorders();
  drawPlayers();
}

function mousePressed() {
  addBullet(10, 680, 40, 8);
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

// Client Functions

function addBullet(speed = 10, range = 480, damage = 10, amplitude = 10) {
  amplitude /= 2;
  let bulletAngle = atan2(mouseY - height / 2, mouseX - width / 2) + random(-radians(amplitude), radians(amplitude));
  if (bulletAngle < -PI) bulletAngle += TWO_PI;
  if (bulletAngle > PI) bulletAngle -= TWO_PI;
  updateData(
    {
      color: myPlayer.color,
      damage: damage,
      range: range,
      angle: bulletAngle,
      speed: speed,
      startX: myPlayer.x,
      startY: myPlayer.y,
      x: myPlayer.x,
      y: myPlayer.y
    }
  )
}

function updateData(bulletsShot = undefined) {
  if (!connection) return;
  connection.send({ player: myPlayer, bullets: bulletsShot });
}