/**
 * main.js
 * Entry point for DracRun - Gothic 3D Endless Runner Game.
 */
import { Game } from './engine/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Game canvas element not found!');
    return;
  }

  const game = new Game(canvas);
  game.startLoop();

  // Expose for debugging if needed
  window.dracRunGame = game;
});
