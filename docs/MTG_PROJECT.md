# MTG Sandbox Project — State as of Apr 5, 2026

## Overview
A browser-based Magic: The Gathering multiplayer sandbox. No rules enforcement — pure drag-and-drop playmat. Built for 2-4 player Commander games.

## Files on DGX Spark (100.99.57.88)
- `/home/pedro/Desktop/index.html` — full frontend (2,894 lines)
- `/home/pedro/Desktop/index.html.backup` — backup before multiplayer was added
- `/home/pedro/Desktop/backend/server.js` — Node.js + Socket.io backend (186 lines)
- `/home/pedro/Desktop/backend/package.json` — dependencies: express, socket.io, cors
- `/home/pedro/Desktop/backend/node_modules/` — installed

## How to Start
```bash
# SSH in
ssh -i ~/.ssh/spark_key pedro@100.99.57.88

# Start backend (Socket.io on port 3001)
cd /home/pedro/Desktop/backend
nohup /home/pedro/.nvm/versions/node/v22.22.2/bin/node server.js > /tmp/server.log 2>&1 &

# Start HTTP server (port 8000)
cd /home/pedro/Desktop
nohup python3 -m http.server 8000 > /tmp/http.log 2>&1 &
```
Access at: `http://100.99.57.88:8000`

## Architecture
- **Frontend**: Vanilla HTML/CSS/JS, single file index.html
- **Backend**: Node.js + Socket.io, serves rooms/sync
- **Socket.io URL**: hardcoded `http://100.99.57.88:3001/socket.io/socket.io.js` in index.html line 1094
- **Card images**: Scryfall API (`https://api.scryfall.com/cards/named?exact=<name>`)
- **Card back**: `https://back.scryfall.io/small/back.jpg`
- **Node path on Spark**: `/home/pedro/.nvm/versions/node/v22.22.2/bin/node`

## Completed Features (Milestone 1 + 2)

### Board Layout
- Full-screen battlefield (free-form absolute positioning)
- Hand zone: strip at bottom, cards laid out horizontally
- Overlay zones on battlefield:
  - Library (bottom-left, face-down, shows count)
  - Commander zone (above library, gold border, 1 card)
  - Graveyard (bottom-right, collapsed stack with count badge)
  - Exile (above graveyard, collapsed stack)
- Footer toolbar with all controls

### Card Actions (right-click context menu)
- Tap/Untap (double-click on battlefield also taps)
- Move to Battlefield / Hand / Graveyard / Exile / Library (top/bottom/shuffle)
- Play Face Down
- Copy Card (creates token copy)
- Add Counter (XX/XX format, left side and right side independent)
- Search Library (tutor modal)
- Mill X / Draw X / Exile Top X (batch move from library)

### Zone Viewer
- Click Library, Graveyard, or Exile to open modal showing all cards
- Cards in modal have context menu: move to Hand/Battlefield/Graveyard/Exile

### Controls (footer)
- Life total (clickable → opens submenu with Commander Damage P1/P2/P3 + Poison)
- Draw Card, Mulligan (tracks count, draws 7/6/5...)
- Turn tracker: "Turn 1 · Untap" — End Turn advances turn, Untap All on Untap phase
- Scoop button (sends all cards except Commander back to library, shuffles, resets life)
- Dice roller dropdown (d4/d6/d8/d10/d12/d20/d100)
- Create Token (modal: name, P/T)
- Chat toggle

### Deck Loading
- Paste plain text decklist (format: `1 Card Name`)
- Strips quantity prefix AND trailing set codes like `(NEO) 331`
- 150ms delay between Scryfall fetches + 3 retries on 429
- After load: commander selection dropdown
- Deck confirmation summary showing loaded/failed cards

### Visual Design (dark modern theme)
- Background: #0f0f13
- Battlefield: dark green felt radial gradient
- Gold accent: #c9a84c
- Font: Inter via Google Fonts
- Card zoom on hover (bottom-right preview)
- Commander zone: gold border glow
- Counter badges: green/red/gold depending on value

### Game Log
- Status bar at top — click to expand full log history
- Logs: draws (private), moves (public), taps, life changes, dice rolls, shuffles, mulligan, counters, tokens

## Multiplayer (Milestone 3 — IN PROGRESS)

### What Works
- Join screen with Create Room / Join Room tabs
- 6-digit room codes
- 2-player and 4-player format selection
- Spectator mode
- Lobby with player list, Start Game button (host only, appears when ≥2 players)
- Both players can reach the board after host clicks Start Game
- Server broadcasts gameStart to ALL players via `io.to(code).emit`
- Chat (shared)
- Life totals visible in each player's zone header

### What's Broken / Incomplete
- **Opponent battlefield not syncing in real-time** — cards moved to battlefield not appearing on opponent's screen consistently
- **Log not fully synced** — partially fixed (io.to emit) but needs more testing
- **2-player layout** — opponent zone at top exists but opponent cards don't render there
- **4-player quadrant layout** — not implemented yet
- **Privacy**: hand cards send face-down backs to opponents (implemented in logic but needs testing)
- **Face-down card play** — right-click "Play Face Down" exists but sync not tested

### Backend Events (server.js)
- `createRoom` → `roomCreated`
- `joinRoom` → `joinedRoom` + `playerJoined` broadcast
- `startGame` → `gameStart` broadcast to all
- `gameAction` → broadcast to all (public log entry)
- `privateAction` → full details to sender, anonymized to room
- `stateUpdate` → broadcast to others (life, hand count, battlefield state)
- `chat` → broadcast to all
- `disconnect` → `playerLeft` broadcast

## Known Issues / Next Steps

### Immediate fixes needed
1. Opponent battlefield rendering — `stateUpdate` events need to render opponent cards in opponent zone
2. Full log sync verification across both players
3. Test face-down card privacy

### Future features (deprioritized)
4. 4-player quadrant layout
5. Deploy frontend to Netlify, backend to Railway
6. User accounts + deck saving (database)
7. AI player (simple bot)

## Token Cost Issue
- Claude Code (ACP) was burning massive tokens reading the full 2,894-line index.html every session
- **Going forward**: Use Delta (local Nemotron on Spark) for code edits, not Claude Code
- Use me (pedro-bot) for planning/decisions only
- For Claude Code: always give exact line numbers, never "read the whole file"

## How to Resume with Delta
Tell Delta:
> "Read /home/pedro/Desktop/index.html lines [X-Y] and /home/pedro/Desktop/backend/server.js. Fix: [specific issue]. Save and confirm."

Or use surgical sed commands via SSH for simple string replacements.

## Deck Used for Testing
Dark Leo & Shredder — WB Ninja Commander
Full list in previous chat history or rebuild from Moxfield.
