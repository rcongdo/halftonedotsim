# Halftone Dot Simulator

An interactive browser tool for exploring printed halftone screens. The app shows a split canvas: the left side renders simulated halftone dots, and the right side can show either the resulting solid tone or, in CMYK mode, a live USB microscope view for side-by-side comparison.

## Live demo

The current GitHub Pages demo is:

<https://rcongdo.github.io/halftonedotsim/>

The microscope feature requires browser camera access. Use the hosted HTTPS demo or a localhost server; some browsers block camera access when opening `index.html` directly from disk.

## Features

- **Single black mode** with ink coverage and screen angle controls.
- **CMYK mode** with independent coverage and screen angle sliders for C, M, Y, and K.
- **Standard offset angles by default:** C 15°, M 75°, Y 0°, K 45°.
- **LPI simulation** from 25 to 200 LPI, changing dot pitch and visual texture.
- **Dot gain controls** for Dot Gain, Min Dot, and Min Dot Printed.
- **GRACoL-style CMYK color preview** using Neugebauer mixing and channel TVI.
- **Microscope comparison mode** in CMYK: switch the right half from flat color to a live USB microscope feed.
- **Freeze and save controls** for microscope comparison. Save exports a PNG with the simulated halftone on the left and the microscope image on the right.

## Running locally

This is a static site with no build step.

Open it with a local server:

```sh
npx serve .
```

Or:

```sh
python3 -m http.server 4173
```

Then visit:

<http://localhost:4173/>

Opening `index.html` directly also works for the simulation, but camera access may be blocked by the browser.

## File layout

| File | Purpose |
| --- | --- |
| `index.html` | Canvas, controls, microscope toolbar, and static markup |
| `styles.css` | Layout, control styling, responsive behavior |
| `app.js` | Canvas rendering, color math, camera handling, export logic |

## How it works

The renderer draws each ink screen to its own offscreen canvas, then composites the ink layers with `multiply`. This keeps same-ink overlaps from darkening while preserving realistic overprint darkening between different inks.

The solid-tone side uses a 16-primary Neugebauer mix sampled from GRACoL-style CMYK values. Dot gain settings affect the simulated print side, while the right-side flat color remains a reference preview.

At high LPI values, the app crossfades the halftone side toward the predicted tone so very fine screens visually dissolve into solid color, matching how high-frequency screens appear at viewing distance.

In microscope mode, the app requests a browser video stream with `getUserMedia()`, draws the live or frozen frame into the right half of the canvas, and saves the composed canvas as a PNG.

## Deploying

The app can be deployed to any static host. For GitHub Pages, deploy from the `main` branch at the repository root.

`index.html` references `app.js` and `styles.css` with a version query string. Bump that value when shipping changes so browsers load fresh assets instead of cached copies.
