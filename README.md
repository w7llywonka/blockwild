# Blockwild

An original browser-based 2D survival sandbox inspired by Minecraft. Mine, craft, build a shelter, explore caves, and survive the night. All artwork is drawn procedurally. No external assets, trackers, runtime dependencies, or accounts are needed to play.

## Run locally

With Python 3 installed:

```sh
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173. Or use `npm start`. Use an HTTP server instead of opening `index.html` directly, because the game uses ES modules.

## Play

- **A/D or arrow keys:** walk. **Space/W/Up:** jump or swim. **Shift:** sprint.
- **Hold left mouse:** mine a nearby block. Click a creature to attack.
- **Right mouse:** place the selected block.
- **1–9 or mouse wheel:** select a hotbar slot.
- **E:** inventory and crafting. Select a backpack item to assign it to your active slot.
- **Q:** eat selected food. **Escape:** pause.
- On touch screens, use the movement buttons and the Mine/Build toggle, then hold on a nearby world tile.

Start by chopping wood. Craft planks, sticks, and a crafting table. Place the table nearby to make tools. A wooden pickaxe mines stone and coal; a stone pickaxe mines iron; an iron pickaxe mines diamond. Build a furnace to smelt iron and cook mutton. Leaves can drop apples. Torches help light the underground. Zombies appear at night. Creative mode provides all items, instant mining, and immunity.

## Save your world

Worlds autosave every 20 seconds of active play to this browser's local storage. The pause menu includes Save, Export, Import, and New adventure. Export a JSON backup before clearing browser data or moving devices. Worlds are not synchronized between devices. Respawning retains your inventory.

## Deploy to Vercel

Import this repository into Vercel. The included `vercel.json` serves the `dist` folder as a static site with no build or install step. No environment variables or paid services are required.

## Verify

`npm test` runs the deterministic engine tests with Node.js 20+.

`node tests/browser-smoke.mjs` runs browser checks with Playwright and Chromium installed. Optional overrides: `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, and `BASE_URL`. The browser test launches its own local server if `BASE_URL` is omitted. Test artifacts are excluded from Git.

## Project layout

- `dist/engine.js`: seeded terrain, physics, crafting, survival, and validated saves.
- `dist/renderer.js`: original pixel artwork, camera, animation, day/night, and lighting.
- `dist/app.js`: keyboard/touch controls, inventory, menus, sounds, and persistence.
- `dist/index.html` and `dist/styles.css`: responsive game interface.

This first version is single-player with a finite 320 × 100 block world. It has the core mining/building/survival loop; it is not a complete recreation of Minecraft. Multiplayer, farming, redstone, dimensions, and tool durability are not implemented. Blockwild is not affiliated with Mojang or Microsoft.
