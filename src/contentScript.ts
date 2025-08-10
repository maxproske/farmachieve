// Chrome Extension Content Script for FarmAchieve Quiz Pets
// Adds wandering, pettable Stardew Valley farm animals to quiz pages

type SpriteOpts = {
  url: string; 
  frameW: number; 
  frameH: number; 
  cols: number;
  row: number; 
  scale?: number; 
  fps?: number;
};

type SpriteInstance = {
  el: HTMLDivElement;
  play: () => void;
  stop: () => void;
  setRow: (r: number) => void;
  setFrame: (f: number) => void;
};

// Sprite creation utility
function createSprite(opts: SpriteOpts): SpriteInstance {
  const scale = opts.scale ?? 4;
  const fps = opts.fps ?? 6;
  let frame = 0;
  let row = opts.row;
  let timer: number | null = null;

  const el = document.createElement("div");
  el.style.width = `${opts.frameW * scale}px`;
  el.style.height = `${opts.frameH * scale}px`;
  el.style.backgroundImage = `url(${chrome.runtime.getURL(opts.url)})`;
  el.style.backgroundRepeat = "no-repeat";
  el.style.backgroundSize = `${opts.cols * opts.frameW * scale}px auto`;
  (el.style as any).imageRendering = "pixelated";

  const draw = () => {
    const x = -frame * opts.frameW * scale;
    const y = -row * opts.frameH * scale;
    el.style.backgroundPosition = `${x}px ${y}px`;
  };

  const play = () => {
    if (timer !== null) return;
    timer = window.setInterval(() => {
      frame = (frame + 1) % opts.cols;
      draw();
    }, 1000 / fps);
  };

  const stop = () => { 
    if (timer !== null) { 
      clearInterval(timer); 
      timer = null; 
    } 
  };

  const setRow = (r: number) => { 
    row = r; 
    draw(); 
  };

  const setFrame = (f: number) => { 
    frame = f % opts.cols; 
    draw(); 
  };

  draw();
  return { el, play, stop, setRow, setFrame };
}

// Animal configurations
const ANIMALS = [
  { name: "duck", url: "assets/duck.png", frameW: 16, frameH: 16, cols: 4 },
  { name: "chicken", url: "assets/chicken.png", frameW: 16, frameH: 16, cols: 4 },
  { name: "cow", url: "assets/cow.png", frameW: 16, frameH: 16, cols: 4 }
];

// Check if reduced motion is preferred
const prefersReducedMotion = () => 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Directional movement rows for Stardew Valley sprites
const DIRECTION_ROWS = {
  down: 0,
  right: 1, 
  up: 2,
  left: 3  // Will use flipped right if not available
};

// Get appropriate row for movement direction
function getRowForDirection(dx: number, dy: number): number {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? DIRECTION_ROWS.right : DIRECTION_ROWS.left;
  } else {
    return dy > 0 ? DIRECTION_ROWS.down : DIRECTION_ROWS.up;
  }
}

// Create a wandering pet container
function createPetContainer(animalConfig: typeof ANIMALS[0], isStart: boolean): HTMLElement {
  const container = document.createElement("div");
  container.className = "qp-pet-container";
  container.setAttribute("data-pet-key", isStart ? "start" : "end");

  // Create sprite
  const sprite = createSprite({
    url: animalConfig.url,
    frameW: animalConfig.frameW,
    frameH: animalConfig.frameH,
    cols: animalConfig.cols,
    row: 0,
    scale: 4,
    fps: 6
  });

  // Create animal wrapper
  const animal = document.createElement("div");
  animal.className = "qp-animal";
  animal.setAttribute("role", "button");
  animal.setAttribute("aria-label", `Pet the ${animalConfig.name}`);
  animal.appendChild(sprite.el);

  let isClicked = false;
  let wanderTimer: number | null = null;
  let currentX = Math.random() * (window.innerWidth - 64); // Random start position
  let currentY = Math.random() * (window.innerHeight - 64);
  let lastX = currentX;
  let lastY = currentY;

  // Start sprite animation
  sprite.play();

  // Wandering behavior
  const startWandering = () => {
    if (prefersReducedMotion() || wanderTimer !== null) return;

    const wander = () => {
      const animalSize = animalConfig.frameW * 4; // 64px
      const maxX = window.innerWidth - animalSize;
      const maxY = window.innerHeight - animalSize;
      
      // Choose new random position
      const newX = Math.random() * maxX;
      const newY = Math.random() * maxY;
      
      // Calculate movement direction
      const dx = newX - currentX;
      const dy = newY - currentY;
      
      // Set appropriate sprite row based on movement direction
      const newRow = getRowForDirection(dx, dy);
      sprite.setRow(newRow);
      
      // Handle left movement with flipping if needed
      if (dx < 0 && newRow === DIRECTION_ROWS.right) {
        // Use flipped right sprite for left movement
        animal.classList.add("qp-flip");
      } else {
        animal.classList.remove("qp-flip");
      }
      
      currentX = newX;
      currentY = newY;
      lastX = currentX;
      lastY = currentY;
      
      animal.style.left = `${currentX}px`;
      animal.style.top = `${currentY}px`;
      
      // Schedule next wander
      const nextWander = 1600 + Math.random() * 1600; // 1.6-3.2 seconds
      wanderTimer = window.setTimeout(wander, nextWander);
    };

    wander();
  };

  // Heart effect on first click
  const showHearts = () => {
    if (isClicked) return;
    isClicked = true;

    // Create single animated heart sprite
    const heartSprite = createSprite({
      url: "assets/heart.png",
      frameW: 16,
      frameH: 16,
      cols: 4,
      row: 0, // First row contains heart animation
      scale: 3, // Slightly smaller than animals
      fps: 8 // Moderate animation speed for heart
    });

    const heartWrapper = document.createElement("div");
    heartWrapper.className = "qp-heart";
    heartWrapper.appendChild(heartSprite.el);
    
    // Position directly above the animal
    heartWrapper.style.left = `${currentX + 16}px`; // Center above animal
    heartWrapper.style.top = `${currentY - 20}px`; // Above animal
    
    container.appendChild(heartWrapper);
    
    // Start heart animation
    heartSprite.play();
    
    // Remove after animation
    setTimeout(() => {
      heartSprite.stop();
      if (heartWrapper.parentNode) {
        heartWrapper.parentNode.removeChild(heartWrapper);
      }
    }, 1500);
  };

  // Event listeners
  animal.addEventListener("click", showHearts);
  animal.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      showHearts();
    }
  });

  // Initialize position and start wandering
  animal.style.left = `${currentX}px`;
  animal.style.top = `${currentY}px`;
  setTimeout(startWandering, 500); // Start wandering after a brief delay

  container.appendChild(animal);
  return container;
}

// Find target elements and inject pets
function scanAndInjectPets(): void {
  // Look for "Start Attempt" button
  const startElements = Array.from(document.querySelectorAll("button, input[type='submit'], a"));
  for (const el of startElements) {
    const text = el.textContent?.trim() || "";
    if (text.includes("Start Attempt") && !document.querySelector('[data-pet-key="start"]')) {
      const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
      const petContainer = createPetContainer(randomAnimal, true);
      document.body.appendChild(petContainer);
      break;
    }
  }

  // Look for completion message
  const paragraphs = Array.from(document.querySelectorAll("p, div"));
  for (const p of paragraphs) {
    const text = p.textContent?.trim() || "";
    if (text.includes("You've finished the attempt, thank you for taking the quiz!") && 
        !document.querySelector('[data-pet-key="end"]')) {
      const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
      const petContainer = createPetContainer(randomAnimal, false);
      document.body.appendChild(petContainer);
      break;
    }
  }
}

// Debounced scanning to handle dynamic content
let scanTimeout: number | null = null;
function debouncedScan(): void {
  if (scanTimeout !== null) {
    clearTimeout(scanTimeout);
  }
  scanTimeout = window.setTimeout(scanAndInjectPets, 100);
}

// Initialize
function init(): void {
  // Initial scan
  scanAndInjectPets();

  // Watch for dynamic changes
  const observer = new MutationObserver(debouncedScan);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Also scan on page visibility change (back button, etc.)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      setTimeout(scanAndInjectPets, 200);
    }
  });
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
