# MTG Sandbox - Completion Checklist

## 🟩 Phase 1: The Clean Swap (Core Stability)
- [ ] Overwrite `index.html` with clean modular version (Purge legacy script)
- [ ] Verify `mtg-core/` links are active
- [ ] Confirm `DOMContentLoaded` boot sequence initializes all modules
- [ ] Verify Room Entry UI persists (No "Ghost Loop" disconnects)

## 🟨 Phase 2: Feature Refinement (Gameplay)
- [ ] Inject test decklist into `localStorage` defaults
- [ ] Implement real-time Battlefield card movement sync
- [ ] Implement Tapping/Untapping state sync
- [ ] Implement Hand Privacy (Opponent sees count only)
- [ ] Implement Face-down play and reveal sync
- [ ] Verify "Retry Failed Imports" flow in modular architecture

## 🟦 Phase 3: Deployment (Production)
- [ ] Deploy Socket.io server to Railway/Render
- [ ] Deploy Frontend to Netlify
- [ ] Update `socket.js` to use Production URL
- [ ] Final end-to-end test across different devices

## 🏁 Final Delivery
- [ ] Final checklist report ✅ DONE
- [ ] Clean up any temporary debugging files
