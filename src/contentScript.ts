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

// Highlight long text content in quiz questions
function highlightLongText(): void {
  const qtextElements = document.querySelectorAll('div.qtext');
  
  qtextElements.forEach(qtextElement => {
    // Get all direct children (text nodes and elements)
    const children = Array.from(qtextElement.childNodes);
    
    children.forEach(child => {
      // Handle text nodes
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text && text.length > 20) {
          // Wrap text node in a span with highlight class
          const span = document.createElement('span');
          span.className = 'highlight';
          span.textContent = text;
          // Add click handler for toggle
          span.addEventListener('click', toggleHighlight);
          child.parentNode?.replaceChild(span, child);
        }
      }
      // Handle element nodes
      else if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element;
        // Skip if already highlighted
        if (element.classList.contains('highlight')) {
          return;
        }
        // Skip if element contains <u> tags
        if (element.querySelector('u')) {
          return;
        }
        // Skip if element is a <u> tag itself
        if (element.tagName.toLowerCase() === 'u') {
          return;
        }
        const text = element.textContent?.trim();
        if (text && text.length > 20) {
          element.classList.add('highlight');
          // Add click handler for toggle
          element.addEventListener('click', toggleHighlight);
        }
      }
    });
  });
}

// Toggle highlight class on click
function toggleHighlight(event: Event): void {
  event.stopPropagation(); // Prevent event bubbling
  const element = event.currentTarget as Element;
  element.classList.toggle('highlight');
}

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

// Animal configurations with proper scaling and unique behavior cycles
const ANIMALS = [
  { 
    name: "duck", 
    url: "assets/duck.png", 
    frameW: 16, frameH: 16, cols: 4, scale: 2,
    moveChance: 0.7, // Very active
    idleTime: [1000, 2000], // 1-2s idle
    moveSpeed: 1.5 // Fast movement
  },
  // Chickens - all color variants
  { 
    name: "chicken_brown", 
    url: "assets/chicken_brown.png", 
    frameW: 16, frameH: 16, cols: 4, scale: 2,
    moveChance: 0.8, // Most active
    idleTime: [800, 1500], // 0.8-1.5s idle
    moveSpeed: 1.2, // Quick movement
    hasLeftRow: true // Chicken has dedicated left row (row 3)
  },
  { 
    name: "chicken_white", 
    url: "assets/chicken_white.png", 
    frameW: 16, frameH: 16, cols: 4, scale: 2,
    moveChance: 0.8, // Most active
    idleTime: [800, 1500], // 0.8-1.5s idle
    moveSpeed: 1.2, // Quick movement
    hasLeftRow: true // Chicken has dedicated left row (row 3)
  },
  { 
    name: "chicken_blue", 
    url: "assets/chicken_blue.png", 
    frameW: 16, frameH: 16, cols: 4, scale: 2,
    moveChance: 0.8, // Most active
    idleTime: [800, 1500], // 0.8-1.5s idle
    moveSpeed: 1.2, // Quick movement
    hasLeftRow: true // Chicken has dedicated left row (row 3)
  },
  { 
    name: "chicken_void", 
    url: "assets/chicken_void.png", 
    frameW: 16, frameH: 16, cols: 4, scale: 2,
    moveChance: 0.8, // Most active
    idleTime: [800, 1500], // 0.8-1.5s idle
    moveSpeed: 1.2, // Quick movement
    hasLeftRow: true // Chicken has dedicated left row (row 3)
  },
  // Cows - all color variants
  { 
    name: "cow_brown", 
    url: "assets/cow_brown.png", 
    frameW: 16, frameH: 16, cols: 4, scale: 3,
    moveChance: 0.3, // Slow and steady
    idleTime: [3000, 5000], // 3-5s idle
    moveSpeed: 3.0 // Slow movement
  },
  { 
    name: "cow_white", 
    url: "assets/cow_white.png", 
    frameW: 16, frameH: 16, cols: 4, scale: 3,
    moveChance: 0.3, // Slow and steady
    idleTime: [3000, 5000], // 3-5s idle
    moveSpeed: 3.0 // Slow movement
  },
  { 
    name: "pig", 
    url: "assets/pig.png", 
    frameW: 16, frameH: 16, cols: 4, scale: 3,
    moveChance: 0.4, // Lazy
    idleTime: [2500, 4000], // 2.5-4s idle
    moveSpeed: 2.5 // Moderate movement
  },
  { 
    name: "sheep", 
    url: "assets/sheep.png", 
    frameW: 16, frameH: 16, cols: 4, scale: 3,
    moveChance: 0.5, // Balanced
    idleTime: [2000, 3000], // 2-3s idle
    moveSpeed: 2.0 // Normal movement
  },
  { 
    name: "goat", 
    url: "assets/goat.png", 
    frameW: 16, frameH: 16, cols: 4, scale: 3,
    moveChance: 0.6, // Active
    idleTime: [1500, 2500], // 1.5-2.5s idle
    moveSpeed: 1.8 // Fairly quick movement
  },
];

// Check if reduced motion is preferred
const prefersReducedMotion = () => 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Directional movement rows for Stardew Valley sprites
const DIRECTION_ROWS = {
  down: 0,
  right: 1, 
  up: 2,
  left: 1  // Use right row with flip for most animals (except chicken which has dedicated left)
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
function createPetContainer(animalConfig: typeof ANIMALS[0], trigger: boolean | string, index: number = 0): HTMLElement {
  const container = document.createElement("div");
  container.className = "qp-pet-container";
  
  // Handle different trigger types
  let keyPrefix: string;
  if (trigger === true) {
    keyPrefix = "start";
  } else if (trigger === false) {
    keyPrefix = "end";
  } else {
    keyPrefix = trigger; // "login" or other string values
  }
  
  container.setAttribute("data-pet-key", `${keyPrefix}-${index}`);

  // Create sprite with proper scaling and walk timing
  const sprite = createSprite({
    url: animalConfig.url,
    frameW: animalConfig.frameW,
    frameH: animalConfig.frameH,
    cols: animalConfig.cols,
    row: 0,
    scale: animalConfig.scale,
    fps: 7 // 7fps for walk animation (143ms per frame)
  });

  // Create animal wrapper
  const animal = document.createElement("div");
  animal.className = "qp-animal";
  animal.setAttribute("role", "button");
  animal.setAttribute("aria-label", `Pet the ${animalConfig.name}`);
  animal.appendChild(sprite.el);

  let isClicked = false;
  let wanderTimer: number | null = null;
  const animalSize = animalConfig.frameW * animalConfig.scale; // Actual size based on scale
  const margin = 32; // 2rem margin (2 * 16px)
  
  // Use document dimensions instead of window dimensions for absolute positioning
  const docWidth = Math.max(document.documentElement.scrollWidth, window.innerWidth);
  const docHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);
  
  // Spread animals out by using index-based offset to reduce overlap
  const baseX = margin + Math.random() * (docWidth - animalSize - margin * 2);
  const baseY = margin + Math.random() * (docHeight - animalSize - margin * 2);
  
  // Add some offset based on index to spread them out
  const spreadDistance = 150; // Minimum distance between animals
  const offsetX = (index % 2) * spreadDistance + (Math.random() - 0.5) * 100;
  const offsetY = Math.floor(index / 2) * spreadDistance + (Math.random() - 0.5) * 100;
  
  let currentX = Math.max(margin, Math.min(docWidth - animalSize - margin, baseX + offsetX));
  let currentY = Math.max(margin, Math.min(docHeight - animalSize - margin, baseY + offsetY));
  let isMoving = false;

  // Start in idle state - no animation, frame 0 (standing pose)
  sprite.stop();
  sprite.setRow(0); // Down-facing idle
  sprite.setFrame(0); // Standing still pose

  // Wandering behavior with idle states
  const startWandering = () => {
    if (prefersReducedMotion() || wanderTimer !== null) return;

    const scheduleNextAction = () => {
      // Use animal-specific movement chance
      const shouldMove = Math.random() < animalConfig.moveChance;
      
      if (shouldMove) {
        moveToNearbyLocation();
      } else {
        idle();
      }
    };

    const idle = () => {
      if (isMoving) {
        // Stop walking animation and set to idle (always frame 0 - standing pose)
        sprite.stop();
        sprite.setRow(0); // Default down-facing idle
        sprite.setFrame(0); // Always frame 0 - standing still pose
        animal.classList.remove("qp-flip");
        isMoving = false;
      }
      
      // Use animal-specific idle time
      const [minIdle, maxIdle] = animalConfig.idleTime;
      const idleTime = minIdle + Math.random() * (maxIdle - minIdle);
      
      wanderTimer = window.setTimeout(scheduleNextAction, idleTime);
    };

    const moveToNearbyLocation = () => {
      const tileSize = 16; // One tile = 16px
      const minTiles = 2; // Minimum 2 tiles
      const maxTiles = 5; // Maximum 5 tiles (outside behavior)
      const tiles = minTiles + Math.floor(Math.random() * (maxTiles - minTiles + 1)); // 2-5 tiles
      const moveDistance = tiles * tileSize; // 32-80px movement
      
      // Pick a random cardinal direction
      const directions = ['up', 'down', 'left', 'right'];
      const direction = directions[Math.floor(Math.random() * directions.length)];
      
      let newX = currentX;
      let newY = currentY;
      
      // Calculate new position based on direction with 2rem margin (using document bounds)
      switch (direction) {
        case 'up':
          newY = Math.max(margin, currentY - moveDistance);
          break;
        case 'down':
          newY = Math.min(docHeight - animalSize - margin, currentY + moveDistance);
          break;
        case 'left':
          newX = Math.max(margin, currentX - moveDistance);
          break;
        case 'right':
          newX = Math.min(docWidth - animalSize - margin, currentX + moveDistance);
          break;
      }
      
      // Only move if there's actually a change
      if (newX !== currentX || newY !== currentY) {
        // Set appropriate sprite row and start walking animation
        let spriteRow;
        
        if (direction === 'left') {
          if (animalConfig.hasLeftRow) {
            // Animal has dedicated left row (like chicken)
            spriteRow = 3;
            animal.classList.remove("qp-flip");
          } else {
            // Use flipped right row for left movement
            spriteRow = DIRECTION_ROWS.right;
            animal.classList.add("qp-flip");
          }
        } else {
          // Normal directional movement
          spriteRow = DIRECTION_ROWS[direction as keyof typeof DIRECTION_ROWS];
          animal.classList.remove("qp-flip");
        }
        
        sprite.setRow(spriteRow);
        sprite.play(); // Start walking animation
        isMoving = true;
        
        // Calculate movement duration using animal-specific speed
        // 4 frames per walk cycle at 7fps = 571ms per cycle (143ms per frame)
        // Duration should be proportional to number of tiles moved and animal speed
        const actualDistance = Math.abs(newX - currentX) + Math.abs(newY - currentY);
        const walkCycleDuration = 571; // ms for one 4-frame cycle at 7fps
        const moveDuration = (actualDistance / tileSize) * (walkCycleDuration / 4) * animalConfig.moveSpeed;
        
        // Set CSS transition duration to match movement duration
        animal.style.transition = `left ${moveDuration}ms linear, top ${moveDuration}ms linear`;
        
        // Update position
        currentX = newX;
        currentY = newY;
        animal.style.left = `${currentX}px`;
        animal.style.top = `${currentY}px`;
        
        // After movement completes, return to idle state
        wanderTimer = window.setTimeout(() => {
          // Stop on frame 0 (standing pose) when movement completes
          sprite.stop();
          sprite.setFrame(0);
          isMoving = false;
          // Idle for 0.8-1.6 seconds after movement (wander burst spec)
          const postMoveIdleTime = 800 + Math.random() * 800; // 0.8-1.6s
          wanderTimer = window.setTimeout(scheduleNextAction, postMoveIdleTime);
        }, moveDuration);
      } else {
        // No movement needed, just idle
        idle();
      }
    };

    // Start with either idle or movement
    scheduleNextAction();
  };

  // Heart effect on first click
  const showHearts = () => {
    if (isClicked) return;
    isClicked = true;
    
    // Remove click cursor and disable further interactions
    animal.classList.add("qp-loved");

    // Create single animated heart sprite (50% larger)
    const heartSprite = createSprite({
      url: "assets/heart.png",
      frameW: 16,
      frameH: 16,
      cols: 4,
      row: 0, // Start with first row
      scale: 2.25, // 50% larger than previous (1.5 * 1.5 = 2.25)
      fps: 8 // Will be manually controlled
    });

    const heartWrapper = document.createElement("div");
    heartWrapper.className = "qp-heart";
    heartWrapper.appendChild(heartSprite.el);
    
    // Add smooth transition for heart movement
    heartWrapper.style.transition = "left 90ms linear, top 90ms linear";
    
    // Center horizontally on animal with scale-adjusted vertical offset
    const heartSize = 16 * 2.25; // 36px
    // Use original offset for small animals (scale 2), larger offset for big animals (scale 3+)
    const heartOffset = animalConfig.scale <= 2 ? 44 : 36; // 44px for small animals, 36px for large animals
    heartWrapper.style.left = `${currentX + (animalSize - heartSize) / 2}px`; // Center horizontally
    heartWrapper.style.top = `${currentY - heartOffset}px`; // Scale-appropriate offset
    
    container.appendChild(heartWrapper);
    
    // Custom heart animation sequence: row 1 → row 6 → row 6 → row 1 reverse
    let step = 0;
    const animationSteps = [
      // Row 1 forward: frames 1,2,3,4
      { row: 0, frame: 0 },
      { row: 0, frame: 1 },
      { row: 0, frame: 2 },
      { row: 0, frame: 3 },
      // Row 6 forward: frames 1,2,3,4 (row 5 in 0-based) - FIRST TIME
      { row: 5, frame: 0 },
      { row: 5, frame: 1 },
      { row: 5, frame: 2 },
      { row: 5, frame: 3 },
      // Row 6 forward: frames 1,2,3,4 (row 5 in 0-based) - SECOND TIME
      { row: 5, frame: 0 },
      { row: 5, frame: 1 },
      { row: 5, frame: 2 },
      { row: 5, frame: 3 },
      // Row 1 reverse: frames 4,3,2,1
      { row: 0, frame: 3 },
      { row: 0, frame: 2 },
      { row: 0, frame: 1 },
      { row: 0, frame: 0 }
    ];
    
    const playCustomAnimation = () => {
      if (step < animationSteps.length) {
        const { row, frame } = animationSteps[step];
        heartSprite.setRow(row);
        heartSprite.setFrame(frame);
        
        // Update heart position to follow animal's real-time position
        const heartSize = 16 * 2.25; // 36px
        
        // Get the animal's current position from CSS (which changes during transitions)
        const computedStyle = window.getComputedStyle(animal);
        const currentAnimalX = parseFloat(computedStyle.left) || currentX;
        const currentAnimalY = parseFloat(computedStyle.top) || currentY;
        
        heartWrapper.style.left = `${currentAnimalX + (animalSize - heartSize) / 2}px`; // Center horizontally
        heartWrapper.style.top = `${currentAnimalY - heartOffset}px`; // Maintain scale-appropriate vertical offset
        
        step++;
        setTimeout(playCustomAnimation, 90); // ~11fps (1.5x slower than doubled)
      } else {
        // Animation complete - remove heart
        if (heartWrapper.parentNode) {
          heartWrapper.parentNode.removeChild(heartWrapper);
        }
      }
    };
    
    // Start the custom animation
    playCustomAnimation();
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
  // TEMPORARY: 100 animals for testing/benchmarking
  const TESTING_MODE = false;
  const TEST_ANIMAL_COUNT = 100;
  
  if (TESTING_MODE) {
    // Check if we haven't already spawned test animals
    if (!document.querySelector('[data-pet-key^="test"]')) {
      console.log(`🧪 TESTING MODE: Spawning ${TEST_ANIMAL_COUNT} animals for performance testing`);
      console.time('Animal Creation');
      
      for (let i = 0; i < TEST_ANIMAL_COUNT; i++) {
        const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
        const petContainer = createPetContainer(randomAnimal, "test", i);
        document.body.appendChild(petContainer);
      }
      
      console.timeEnd('Animal Creation');
      console.log(`✅ Created ${TEST_ANIMAL_COUNT} test animals`);
      
      // Log performance stats after a few seconds
      setTimeout(() => {
        const animalElements = document.querySelectorAll('.qp-animal');
        console.log(`📊 Performance Stats:`);
        console.log(`- Active animals: ${animalElements.length}`);
        console.log(`- Document dimensions: ${document.documentElement.scrollWidth}x${document.documentElement.scrollHeight}`);
        console.log(`- Viewport dimensions: ${window.innerWidth}x${window.innerHeight}`);
      }, 3000);
    }
    return; // Skip normal logic in testing mode
  }

  // NORMAL MODE: Look for "Start Attempt" button
  const startElements = Array.from(document.querySelectorAll("button, input[type='submit'], a"));
  for (const el of startElements) {
    const text = el.textContent?.trim() || "";
    if (text.includes("Start Attempt") && !document.querySelector('[data-pet-key^="start"]')) {
      // Create 1-2 random animals for start
      const animalCount = 1 + Math.floor(Math.random() * 2); // 1 or 2 animals
      for (let i = 0; i < animalCount; i++) {
        const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
        const petContainer = createPetContainer(randomAnimal, true, i);
        document.body.appendChild(petContainer);
      }
      break;
    }
  }

  // Check if we're on login page by URI
  if (window.location.pathname.includes('/login/index.php') && !document.querySelector('[data-pet-key^="login"]')) {
    // Create 1-2 random animals for login page
    const animalCount = 1 + Math.floor(Math.random() * 2); // 1 or 2 animals
    for (let i = 0; i < animalCount; i++) {
      const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
      const petContainer = createPetContainer(randomAnimal, "login", i);
      document.body.appendChild(petContainer);
    }
  }

  // Look for completion message
  const paragraphs = Array.from(document.querySelectorAll("p, div"));
  for (const p of paragraphs) {
    const text = p.textContent?.trim() || "";
    if (text.includes("You've finished the attempt, thank you for taking the quiz!") && 
        !document.querySelector('[data-pet-key^="end"]')) {
      // Create 3-5 random animals for end
      const animalCount = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5 animals
      for (let i = 0; i < animalCount; i++) {
        const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
        const petContainer = createPetContainer(randomAnimal, false, i);
        document.body.appendChild(petContainer);
      }
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
  // One-time text highlighting when page loads
  highlightLongText();
  
  // Initial pet scan
  scanAndInjectPets();

  // Watch for dynamic changes (pets only)
  const observer = new MutationObserver(debouncedScan);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Also scan on page visibility change (pets only)
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
