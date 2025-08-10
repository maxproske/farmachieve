# FarmAchieve Quiz Pet Chrome Extension

A minimal Chrome Extension that adds wandering, pettable Stardew Valley farm animals to pharmacy quiz pages to help with motivation during recertification studies.

## Features

- 🐔 Randomly spawns cute farm animals (duck, chicken, cow) that appear anywhere on screen when quiz pages load
- 💖 First click triggers animated heart sprites from Stardew Valley - subsequent clicks won't re-trigger
- 🚶‍♂️ Animals wander freely across the entire screen using proper directional animations (down/right/up/left movement)
- 🌟 Full-screen transparent overlay - animals don't interfere with page layout or functionality
- ♿ Respects `prefers-reduced-motion` accessibility settings
- 🎮 Uses authentic Stardew Valley pixel art sprites with proper 4-frame walk cycles

## Installation

1. **Build the extension** (if not already built):

   ```bash
   npm install
   npm run build
   ```

2. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `farmachieve` directory

3. **Visit a quiz page**:
   - Go to `https://qbank.pharmachieve.com/*`
   - Look for cute animals before "Start Attempt" buttons and after completion messages!

## Development

### Quick Setup
1. **Install dependencies**: `npm install`
2. **Development mode**: `npm run dev` - watches TypeScript + monitors for changes
3. **Manual reload**: Go to `chrome://extensions/` and click the reload button on your extension

### Individual Commands
- **Watch mode**: `npm run watch` - automatically recompiles TypeScript on changes
- **Build**: `npm run build` - compiles TypeScript to JavaScript
- **File watcher**: `npm run reload-watch` - monitors files and prompts for manual reload

### Hot Reload Workflow
1. Run `npm run dev` (starts TypeScript watch + file monitor)
2. Make changes to `src/contentScript.ts` or `styles.css`
3. TypeScript auto-compiles → file watcher detects changes
4. Manually hit reload button in `chrome://extensions/`
5. Refresh your test page to see changes

**Note**: Chrome extensions require manual reload - there's no true "hot reload" like web apps, but this workflow minimizes the steps!

## File Structure

```text
farmachieve/
├── manifest.json          # Chrome extension manifest (V3)
├── src/contentScript.ts   # Main logic (TypeScript)
├── dist/contentScript.js  # Compiled JavaScript
├── styles.css             # Pet container and animation styles
├── assets/                # Stardew Valley sprites
│   ├── duck.png
│   ├── chicken.png
│   ├── cow.png
│   └── heart.png
└── spritesheets/          # Original sprite files
```

## How It Works

1. **Content Script**: Monitors the page for quiz elements using MutationObserver
2. **Target Detection**: Finds buttons containing "Start Attempt" and paragraphs containing completion messages
3. **Pet Injection**: Creates full-screen transparent overlays with wandering animated sprites
4. **Sprite Animation**: 16×16 pixel sprites scaled 4× with proper directional movement cycles
5. **Heart Effect**: First click spawns multiple animated heart sprites using Stardew Valley emote frames
6. **Movement Logic**: Animals use row-based directional sprites (down=0, right=1, up=2, left=3)

## Browser Support

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium browsers with extension support

Tested on: `https://qbank.pharmachieve.com/*`
