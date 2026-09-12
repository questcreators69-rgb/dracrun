export class InputManager {
  constructor(game) {
    this.game = game;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.minSwipeDistance = 30;

    this.bindKeyboard();
    this.bindTouch();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Prevent browser scrolling on movement keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW'].includes(e.code)) {
        if (this.game.state === 'PLAYING') {
          e.preventDefault();
        }
      }

      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.game.togglePause();
        return;
      }

      if (this.game.state === 'START' && (e.code === 'Space' || e.code === 'Enter')) {
        this.game.startGame();
        return;
      }

      if (this.game.state === 'GAMEOVER' && (e.code === 'Space' || e.code === 'Enter')) {
        this.game.restartGame();
        return;
      }

      if (this.game.state !== 'PLAYING') return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.game.player.moveLeft();
          break;

        case 'ArrowRight':
        case 'KeyD':
          this.game.player.moveRight();
          break;

        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          this.game.player.jump();
          break;
      }
    });
  }

  bindTouch() {
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.game.state !== 'PLAYING') return;
      if (!e.changedTouches || e.changedTouches.length === 0) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const dx = touchEndX - this.touchStartX;
      const dy = touchEndY - this.touchStartY;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > this.minSwipeDistance) {
          if (dx > 0) {
            this.game.player.moveRight();
          } else {
            this.game.player.moveLeft();
          }
        }
      } else {
        if (Math.abs(dy) > this.minSwipeDistance && dy < 0) {
          this.game.player.jump();
        }
      }
    }, { passive: true });

    // On-screen touch buttons for mobile/accessibility
    const btnLeft = document.getElementById('touch-left');
    const btnJump = document.getElementById('touch-jump');
    const btnRight = document.getElementById('touch-right');

    btnLeft?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.game.state === 'PLAYING') this.game.player.moveLeft();
    });

    btnRight?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.game.state === 'PLAYING') this.game.player.moveRight();
    });

    btnJump?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.game.state === 'PLAYING') this.game.player.jump();
    });
  }
}
