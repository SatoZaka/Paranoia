# Paranoia

**Paranoia** is a top-down, 2D shooter game developed in **p5.js**, where the main mechanic revolves around the player's "paranoia", or **limited vision**. Players can only see with full clarity in the direction their mouse is aiming, while their peripheral vision is very limited, enough to react to either movement or presences. This creates a gameplay experience where awareness is crucial.

## Features
- **Unique Vision System**: Full clarity where the player aims, with restricted peripheral vision. Vision is good for tracking enemies on sight, but not to frantically look around.
- **Multiplayer Support**: Uses **peer.js** for online connectivity and multiplayer. The game runs on two separate webpages, depending on whether a player is hosting or joining.

## What's To Come
- **AI Enemies**: We look forward to adding enemies controlled automatically, armed with varied weapons.
- **Item Drops**: Item drops will make the gameplay more varied, by not only including weapons, but objects to help you in combat.
- **...and more!**: These are the two main upcoming planned features, and we look forward to adding more as the game evolves.

## How to Play
All players are on their own, but feel free to cooperate with each other:
- **Host (Player One)**: The first player to start the game acts as the host. You will be given a code to share to others in case you wish to play multiplayer.
- **Clients (Joining Players)**: Other players can connect to the host and join the game via the code the host is given.

### Play the Game
- **[Click here to play as Host](https://editor.p5js.org/SatoZaka/full/PVBVgPXnf)**
- **[Click here to play as a Client](https://editor.p5js.org/SatoZaka/full/6hfS8_Dmr)**

Both links open the game in **full-screen mode**. The game's code is sourced from this GitHub repository.

## Project Structure
This GitHub repository is divided into two main folders:
- **Host/** - Contains the files for the player acting as the game's host.
- **Client/** - Contains the files for players joining the host's game.