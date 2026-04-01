# Build Resources

Place the following files here before packaging:

- `icon.icns` — macOS app icon (512x512 minimum, .icns format)
  - Generate with: https://cloudconvert.com/png-to-icns
  - Or use `iconutil` on macOS from a 1024x1024 PNG

Without an icon file, electron-builder will use the default Electron icon.
The app will still build and run correctly.

## Quick build commands

```bash
# Dev mode (hot reload)
npm run dev

# Package as macOS .dmg (universal: arm64 + x64)
npm run build:mac

# Quick dir build (no installer, faster)
npm run build:dir
```

Output is written to `release/` directory.
