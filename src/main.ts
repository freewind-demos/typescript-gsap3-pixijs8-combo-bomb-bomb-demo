import { Application, Graphics, Text, Container } from 'pixi.js';
import gsap from 'gsap';

// Game constants
const GRID_SIZE = 5;
const CELL_SIZE = 80;
const BOMB_RADIUS = 30;

// Bomb colors
const BOMB_COLOR = 0x4a4a6a;
const BOMB_HIGHLIGHT = 0x8888ff;

// Game state
interface Bomb {
  container: Container;
  graphics: Graphics;
  row: number;
  col: number;
}

const bombs: Bomb[] = [];
let selectedBomb: Bomb | null = null;
let isSwapping = false;

let app: Application;
let comboText: Text;

async function init() {
  // Create Pixi.js Application
  app = new Application();

  await app.init({
    width: GRID_SIZE * CELL_SIZE,
    height: GRID_SIZE * CELL_SIZE + 60,
    backgroundColor: 0x1a1a2e,
    antialias: true,
  });

  document.getElementById('game')!.appendChild(app.canvas);

  // Create combo text
  comboText = new Text({
    text: 'COMBO: 0',
    style: {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xff6b6b,
      fontWeight: 'bold',
    }
  });
  comboText.x = GRID_SIZE * CELL_SIZE / 2;
  comboText.y = GRID_SIZE * CELL_SIZE + 15;
  comboText.anchor.set(0.5);
  app.stage.addChild(comboText);

  // Create grid of bombs
  createBombGrid();

  // Setup event listeners
  app.canvas.addEventListener('click', onCanvasClick);
}

function createBombGrid() {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const bomb = createBomb(row, col);
      bombs.push(bomb);
      app.stage.addChild(bomb.container);
    }
  }
}

function createBomb(row: number, col: number): Bomb {
  const container = new Container();
  container.x = col * CELL_SIZE + CELL_SIZE / 2;
  container.y = row * CELL_SIZE + CELL_SIZE / 2;

  const graphics = new Graphics();
  // Bomb body
  graphics.circle(0, 0, BOMB_RADIUS);
  graphics.fill({ color: BOMB_COLOR });
  // Highlight
  graphics.circle(-10, -10, 8);
  graphics.fill({ color: BOMB_HIGHLIGHT });
  // Fuse
  graphics.moveTo(0, -BOMB_RADIUS);
  graphics.lineTo(0, -BOMB_RADIUS - 15);
  graphics.stroke({ color: 0x8b4513, width: 3 });

  container.addChild(graphics);

  return { container, graphics, row, col };
}

function getBombAt(x: number, y: number): Bomb | null {
  const col = Math.floor(x / CELL_SIZE);
  const row = Math.floor(y / CELL_SIZE);

  return bombs.find(b => b.row === row && b.col === col) || null;
}

async function onCanvasClick(event: MouseEvent) {
  if (isSwapping) return;

  const rect = app.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const clickedBomb = getBombAt(x, y);
  if (!clickedBomb) return;

  if (!selectedBomb) {
    // Select first bomb
    selectedBomb = clickedBomb;
    gsap.to(selectedBomb.container, {
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 0.2
    });
  } else if (selectedBomb === clickedBomb) {
    // Deselect
    gsap.to(selectedBomb.container, {
      scaleX: 1,
      scaleY: 1,
      duration: 0.2
    });
    selectedBomb = null;
  } else {
    // Check if adjacent
    const rowDiff = Math.abs(selectedBomb.row - clickedBomb.row);
    const colDiff = Math.abs(selectedBomb.col - clickedBomb.col);

    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      // Swap bombs
      await swapBombs(selectedBomb, clickedBomb);
    } else {
      // Select new bomb
      gsap.to(selectedBomb.container, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.2
      });
      selectedBomb = clickedBomb;
      gsap.to(selectedBomb.container, {
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 0.2
      });
    }
  }
}

async function swapBombs(bomb1: Bomb, bomb2: Bomb) {
  isSwapping = true;

  // Reset scale
  gsap.to(bomb1.container, { scaleX: 1, scaleY: 1, duration: 0.2 });
  gsap.to(bomb2.container, { scaleX: 1, scaleY: 1, duration: 0.2 });

  // Animate swap positions
  const pos1 = { x: bomb1.container.x, y: bomb1.container.y };
  const pos2 = { x: bomb2.container.x, y: bomb2.container.y };

  const swapTimeline = gsap.timeline({
    onComplete: () => {
      // After swap, explode both bombs
      triggerComboExplosion(bomb1, bomb2);
    }
  });

  swapTimeline
    .to(bomb1.container, {
      x: pos2.x,
      y: pos2.y,
      duration: 0.4,
      ease: 'power2.inOut'
    })
    .to(bomb2.container, {
      x: pos1.x,
      y: pos1.y,
      duration: 0.4,
      ease: 'power2.inOut'
    }, '<');

  // Update bomb positions in array
  const tempRow = bomb1.row;
  const tempCol = bomb1.col;
  bomb1.row = bomb2.row;
  bomb1.col = bomb2.col;
  bomb2.row = tempRow;
  bomb2.col = tempCol;

  selectedBomb = null;
}

function triggerComboExplosion(bomb1: Bomb, bomb2: Bomb) {
  // Create explosion effect at both bomb positions
  const explosion1 = createExplosion(bomb1.container.x, bomb1.container.y);
  const explosion2 = createExplosion(bomb2.container.x, bomb2.container.y);

  app.stage.addChild(explosion1);
  app.stage.addChild(explosion2);

  // Update combo counter
  const currentCombo = parseInt(comboText.text.replace('COMBO: ', '')) + 1;
  comboText.text = `COMBO: ${currentCombo}`;

  // Animate combo text
  gsap.fromTo(comboText, {
    scaleX: 1.5,
    scaleY: 1.5,
    alpha: 0.5
  }, {
    scaleX: 1,
    scaleY: 1,
    alpha: 1,
    duration: 0.3
  });

  // Animate explosions with GSAP
  const timeline = gsap.timeline({
    onComplete: () => {
      app.stage.removeChild(explosion1);
      app.stage.removeChild(explosion2);
      resetBombs(bomb1, bomb2);
      isSwapping = false;
    }
  });

  timeline
    .to(explosion1, {
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 0.6,
      ease: 'power2.out'
    }, 0)
    .to(explosion2, {
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 0.6,
      ease: 'power2.out'
    }, 0.05);
}

function createExplosion(x: number, y: number): Container {
  const container = new Container();
  container.x = x;
  container.y = y;

  const graphics = new Graphics();
  // Multiple explosion rings
  graphics.circle(0, 0, 20);
  graphics.fill({ color: 0xffaa00 });
  graphics.circle(0, 0, 35);
  graphics.stroke({ color: 0xff6600, width: 4 });
  graphics.circle(0, 0, 50);
  graphics.stroke({ color: 0xff3300, width: 2 });

  container.addChild(graphics);
  container.scale.set(0.1);

  return container;
}

function resetBombs(bomb1: Bomb, bomb2: Bomb) {
  // Reset bomb positions and create new ones in grid
  const timeline = gsap.timeline();

  [bomb1, bomb2].forEach((bomb, index) => {
    // Fade out old bomb
    timeline.to(bomb.container, {
      alpha: 0,
      duration: 0.2,
      onComplete: () => {
        // Move bomb to a new random position
        const newRow = Math.floor(Math.random() * GRID_SIZE);
        const newCol = Math.floor(Math.random() * GRID_SIZE);

        bomb.row = newRow;
        bomb.col = newCol;
        bomb.container.x = newCol * CELL_SIZE + CELL_SIZE / 2;
        bomb.container.y = newRow * CELL_SIZE + CELL_SIZE / 2;
        bomb.container.alpha = 1;
        bomb.container.scale.set(0.1);

        gsap.to(bomb.container, {
          scaleX: 1,
          scaleY: 1,
          duration: 0.3,
          ease: 'back.out(1.7)'
        });
      }
    }, index * 0.1);
  });
}

// Start the game
init().catch(console.error);
