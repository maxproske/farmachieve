# FarmAchieve

Chrome extension (Manifest V3) that adds pettable farm animals to PharmAchieve mock quiz pages.

## Getting started

1. Run:
```bash
npm install
npm run build
```

2. Load in Chrome:
- Go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked" and select this folder

3. Start and finish a quiz to see animals! 🐔 🐄 🦆

## Development

```bash
npm run dev     # Uses watch mode
```

After changes, reload the extension in `chrome://extensions/` and refresh your test page.

## File Structure

```
├── manifest.json          # Extension config
├── src/contentScript.ts   # Main code
├── dist/contentScript.js  # Compiled output (required)
├── styles.css             # Styles
└── assets/                # Animal sprites
```
