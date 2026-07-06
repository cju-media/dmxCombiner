# DMX Combiner (macOS System Tray App)

DMX Combiner is a utility application that runs seamlessly in your macOS system tray. It merges Art-Net and sACN streams with built-in feedback loop detection.

## Prerequisites

- [Node.js](https://nodejs.org/) installed (v16+ recommended).
- Designed for macOS (but can be adapted for Windows/Linux).

## Installation

```bash
# Clone the repository
git clone https://github.com/cju-media/dmxCombiner.git
cd dmxCombiner

# Install dependencies
npm install
```

## Running Locally

To start the application locally in development mode:

```bash
npm start
```

This will launch a system tray icon (invisible dock). Click the tray icon and select **Open Dashboard** to configure your DMX inputs and outputs.

## Building for macOS

To package the application into a standalone `.app` or `.dmg` for macOS, run:

```bash
npm run build:mac
```

The resulting build artifact will be located in the `dist/` directory.

### Customizing the App Icon

To include a custom application icon, create an Apple Icon Image file named `icon.icns` and place it in the `build/` directory before running the build command. Ensure your `build/` directory looks like:
- `build/icon.icns`
- `build/iconTemplate.png` (Used for the system tray icon, e.g. 16x16 pixels)
