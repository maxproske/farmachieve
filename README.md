# FarmAchieve

Chrome extension (Manifest V3) that adds pettable farm animals to PharmAchieve mock quiz pages.

## Features

- **Farm Animals**: Wandering, pettable Stardew Valley farm animals appear on quiz pages
- **Junimo**: Special junimo creatures appear on attempt.php pages with 99% probability
- **Text Highlighting**: Long text in quiz questions can be highlighted for better readability

## Getting started

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this folder
3. Finish a quiz to see animals! 🐔 🐄 🦆

## Animal Behavior

### Regular Farm Animals
- Appear on quiz start, login, and completion pages
- Wander around the page with unique movement patterns
- Can be clicked to show heart animations
- Each animal type has different movement speeds and idle times

### Junimo (Special)
- **Spawn Rate**: 99% chance on attempt.php pages
- **Animation**: Custom walk cycle using row 1, columns 0→1→2→3→2→1
- **Movement**: Spawns at top of page, walks south (down) only 2rem (32px)
- **Fade Effect**: Linear fade to invisible over 2 seconds (during last 2 seconds of movement)
- **Duration**: Total animation lasts 3 seconds
- **Sprite Sheet**: Uses 4x4 grid sprite sheet with 16x16 pixel sprites (16 sprites total)
- **Spawn Limit**: Only spawns once per page load

## Development

```bash
npm install
npm run dev     # Uses watch mode
```

After changes, reload the extension in `chrome://extensions/` and refresh your test page.

## Testing

Use `test-junimo.html` to test the junimo functionality locally.

## Publish

```bash
npm run build
```
