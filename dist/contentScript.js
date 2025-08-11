"use strict";
// Chrome Extension Content Script for FarmAchieve Quiz Pets
// Adds wandering, pettable Stardew Valley farm animals to quiz pages
// Sprite creation utility
function createSprite(opts) {
    const scale = opts.scale ?? 4;
    const fps = opts.fps ?? 6;
    let frame = 0;
    let row = opts.row;
    let timer = null;
    const el = document.createElement("div");
    el.style.width = `${opts.frameW * scale}px`;
    el.style.height = `${opts.frameH * scale}px`;
    el.style.backgroundImage = `url(${chrome.runtime.getURL(opts.url)})`;
    el.style.backgroundRepeat = "no-repeat";
    el.style.backgroundSize = `${opts.cols * opts.frameW * scale}px auto`;
    el.style.imageRendering = "pixelated";
    const draw = () => {
        const x = -frame * opts.frameW * scale;
        const y = -row * opts.frameH * scale;
        el.style.backgroundPosition = `${x}px ${y}px`;
    };
    const play = () => {
        if (timer !== null)
            return;
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
    const setRow = (r) => {
        row = r;
        draw();
    };
    const setFrame = (f) => {
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
    {
        name: "chicken",
        url: "assets/chicken.png",
        frameW: 16, frameH: 16, cols: 4, scale: 2,
        moveChance: 0.8, // Most active
        idleTime: [800, 1500], // 0.8-1.5s idle
        moveSpeed: 1.2 // Quick movement
    },
    {
        name: "cow",
        url: "assets/cow.png",
        frameW: 16, frameH: 16, cols: 4, scale: 4,
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
    }
];
// Check if reduced motion is preferred
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Directional movement rows for Stardew Valley sprites
const DIRECTION_ROWS = {
    down: 0,
    right: 1,
    up: 2,
    left: 3 // Will use flipped right if not available
};
// Get appropriate row for movement direction
function getRowForDirection(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? DIRECTION_ROWS.right : DIRECTION_ROWS.left;
    }
    else {
        return dy > 0 ? DIRECTION_ROWS.down : DIRECTION_ROWS.up;
    }
}
// Create a wandering pet container
function createPetContainer(animalConfig, isStart) {
    const container = document.createElement("div");
    container.className = "qp-pet-container";
    container.setAttribute("data-pet-key", isStart ? "start" : "end");
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
    let wanderTimer = null;
    const animalSize = animalConfig.frameW * animalConfig.scale; // Actual size based on scale
    const margin = 32; // 2rem margin (2 * 16px)
    let currentX = margin + Math.random() * (window.innerWidth - animalSize - margin * 2); // Random start position with margin
    let currentY = margin + Math.random() * (window.innerHeight - animalSize - margin * 2);
    let isMoving = false;
    // Start in idle state - no animation, frame 0 (standing pose)
    sprite.stop();
    sprite.setRow(0); // Down-facing idle
    sprite.setFrame(0); // Standing still pose
    // Wandering behavior with idle states
    const startWandering = () => {
        if (prefersReducedMotion() || wanderTimer !== null)
            return;
        const scheduleNextAction = () => {
            // Use animal-specific movement chance
            const shouldMove = Math.random() < animalConfig.moveChance;
            if (shouldMove) {
                moveToNearbyLocation();
            }
            else {
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
            // Calculate new position based on direction with 2rem margin
            switch (direction) {
                case 'up':
                    newY = Math.max(margin, currentY - moveDistance);
                    break;
                case 'down':
                    newY = Math.min(window.innerHeight - animalSize - margin, currentY + moveDistance);
                    break;
                case 'left':
                    newX = Math.max(margin, currentX - moveDistance);
                    break;
                case 'right':
                    newX = Math.min(window.innerWidth - animalSize - margin, currentX + moveDistance);
                    break;
            }
            // Only move if there's actually a change
            if (newX !== currentX || newY !== currentY) {
                // Set appropriate sprite row and start walking animation
                let spriteRow = DIRECTION_ROWS[direction];
                // Handle left movement with flipping if sprite doesn't have left row
                if (direction === 'left' && spriteRow === DIRECTION_ROWS.right) {
                    animal.classList.add("qp-flip");
                }
                else {
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
            }
            else {
                // No movement needed, just idle
                idle();
            }
        };
        // Start with either idle or movement
        scheduleNextAction();
    };
    // Heart effect on first click
    const showHearts = () => {
        if (isClicked)
            return;
        isClicked = true;
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
        // Center horizontally on animal with more vertical offset
        const heartSize = 16 * 2.25; // 36px
        heartWrapper.style.left = `${currentX + (animalSize - heartSize) / 2}px`; // Center horizontally
        heartWrapper.style.top = `${currentY - 48}px`; // More vertical offset (increased from 16px to 48px)
        container.appendChild(heartWrapper);
        // Custom heart animation sequence: row 1 → row 6 → row 1 reverse
        let step = 0;
        const animationSteps = [
            // Row 1 forward: frames 1,2,3,4
            { row: 0, frame: 0 },
            { row: 0, frame: 1 },
            { row: 0, frame: 2 },
            { row: 0, frame: 3 },
            // Row 6 forward: frames 1,2,3,4 (row 5 in 0-based)
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
                // Update heart position to follow animal if it's moving
                const heartSize = 16 * 2.25; // 36px
                heartWrapper.style.left = `${currentX + (animalSize - heartSize) / 2}px`; // Center horizontally
                heartWrapper.style.top = `${currentY - 48}px`; // Maintain vertical offset
                step++;
                setTimeout(playCustomAnimation, 90); // ~11fps (1.5x slower than doubled)
            }
            else {
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
function scanAndInjectPets() {
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
let scanTimeout = null;
function debouncedScan() {
    if (scanTimeout !== null) {
        clearTimeout(scanTimeout);
    }
    scanTimeout = window.setTimeout(scanAndInjectPets, 100);
}
// Initialize
function init() {
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
}
else {
    init();
}
