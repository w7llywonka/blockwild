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
- **Q:** eat selected food. **F/right mouse:** use a nearby crafting table, furnace, chest, door, or bed. **Escape:** pause.
- On touch screens, use the movement buttons and the Mine/Build-use toggle, then hold on a nearby world tile.

Survival starts with empty hands. Start by punching wood. Press E for a 2×2 crafting grid. Click ingredients then grid cells, or select a recipe to fill its pattern. Click the output to craft. Make planks, sticks, and a crafting table; place the table to unlock 3×3 crafting. Place the table nearby to make tools. A wooden pickaxe mines stone and coal; a stone pickaxe mines iron; an iron pickaxe mines diamond. Build a furnace to smelt iron, make glass, and cook mutton. Furnaces consume ingredients and coal, run for ten seconds, and retain the result until collected. Tools wear out; wooden, stone, iron, and diamond tools have 59, 131, 250, and 1,561 uses. Leaves can drop apples. Torches help light the underground. The day/night cycle is twenty minutes; zombies appear at night. Two-block oak doors open and close; red beds set your spawn and skip the night when monsters are far enough away. Chests store supplies. Sheep drop wool and mutton. Break grassy soil for seeds, till dirt with a hoe, plant wheat, and craft bread. Crops grow in three minutes, or ninety seconds near water. Creative mode provides all items, instant mining, and immunity.

## Save your world

Worlds autosave every 20 seconds of active play to this browser's local storage. The pause menu includes Save, Export, Import, and New adventure. Export a JSON backup before clearing browser data or moving devices. Worlds are not synchronized between devices. On death, inventory drops where you fell. Return after respawning to recover it before five active minutes pass. Worn tools keep their durability. Earlier Blockwild saves remain compatible.

## Deploy to Vercel

Import this repository into Vercel. The included `vercel.json` serves the `dist` folder as a static site with no build or install step. No environment variables or paid services are required.

## Verify

`npm test` runs the deterministic engine and shaped-crafting tests with Node.js 20+.

`node tests/browser-smoke.mjs` runs browser checks with Playwright and Chromium installed. Optional overrides: `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, and `BASE_URL`. The browser test launches its own local server if `BASE_URL` is omitted. Test artifacts are excluded from Git.

## Project layout

- `dist/engine.js`: seeded terrain, physics, crafting, survival, and validated saves.
- `dist/crafting.js`: translated and mirrored 2×2/3×3 shaped recipes.
- `dist/renderer.js`: original pixel artwork, camera, animation, day/night, and lighting.
- `dist/app.js`: keyboard/touch controls, inventory, menus, sounds, and persistence.
- `dist/index.html` and `dist/styles.css`: responsive game interface.

This version is single-player with a finite 320 × 100 block world and original pixel artwork. It implements the core Minecraft-style survival progression in side view; it is not the complete Minecraft game. Multiplayer, redstone, dimensions, armor, enchanting, and the full mob roster are not implemented. Inventory quantities are aggregated by item type; tools of the same type share the active tool durability counter until that tool breaks. Minecraft-style recipes and interactions are implemented independently, without copied game code or assets. Blockwild is not affiliated with Mojang or Microsoft.
