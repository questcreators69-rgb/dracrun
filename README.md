# Drac Run

A 3D gothic-themed endless runner web game where you control Count Dracula running across Transylvanian rooftops while avoiding obstacles and searchlights.

## Description

Drac Run is an action-packed 3D browser game built with HTML5 Canvas and the native Web Audio API. As Count Dracula, players navigate three lanes across cathedral rooftops under a midnight sky. The objective is to survive as long as possible while avoiding low ground flashlights and tall vertical searchlight beams. Jumping allows Dracula to morph into a vampire bat to clear obstacles, and collecting ruby blood droplets restores health while boosting your score. The visual elements, animations, and sound effects are generated procedurally in code without external asset files.

## Screenshots

![Drac Run Gameplay](./assets/gameplay.png)

![Drac Run Start Screen](./assets/start_screen.png)

## Getting Started

### Dependencies

Before running Drac Run, ensure you have the following installed:

- Node.js (version 16.0 or higher)
- npm (Node Package Manager, included with Node.js)
- A modern web browser with HTML5 Canvas and Web Audio API support (Chrome, Firefox, Edge, or Safari)
- Windows 10/11, macOS, or Linux operating system

### Installing

1. Clone the repository to your local computer:

```bash
git clone https://github.com/questcreators69-rgb/dracrun_v.git
```

2. Navigate to the project directory:

```bash
cd dracrun_v
```

3. Install the required dependencies:

```bash
npm install
```

### Executing program

1. Run the local development server:

```bash
npm run dev
```

2. Open your web browser and go to the URL output in your terminal (default is `http://localhost:5173`).

3. Click on the canvas to start the game.

**Game Controls:**

- **Move Left / Right**: `A` / `D` or `Left Arrow` / `Right Arrow` (or swipe left/right on mobile screens)
- **Jump (Bat Morph)**: `W` / `Space` / `Up Arrow` (or swipe up on mobile screens)
- **Pause / Resume**: `P` or `Esc`

## Help

- **No Audio**: Browsers block automatic audio playback until the user interacts with the page. Click anywhere inside the game window after loading to enable Web Audio output.
- **Port Conflict**: If port 5173 is already in use by another application, specify a different port when running the dev server:

```bash
npm run dev -- --port 3000
```
