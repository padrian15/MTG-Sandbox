/**
 * importer.js - Deck Import & API System
 * Built by Gemma — Gemma 4
 * 
 * Handles Scryfall API fetching, deck parsing, and commander selection.
 */

const API_THROTTLE_MS = 150;

async function fetchCardData(name) {
  try {
    const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
    if (response.status === 404) {
      const fuzzyResponse = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(name)}`);
      const fuzzyData = await fuzzyResponse.json();
      if (fuzzyData.data && fuzzyData.data.length > 0) return fuzzyData.data[0];
      return null;
    }
    if (response.status === 429) {
      await new Promise(r => setTimeout(r, 1000));
      return fetchCardData(name);
    }
    return await response.json();
  } catch (e) {
    console.error(`Error fetching ${name}:`, e);
    return null;
  }
}

async function processDecklist(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const deck = [];
  const failed = [];

  for (const line of lines) {
    const match = line.trim().match(/^(\d+)\s+(.+)$/);
    if (match) {
      const qty = parseInt(match[1]);
      const name = match[2].trim();
      deck.push({ qty, name });
    } else {
      deck.push({ qty: 1, name: line.trim() });
    }
  }

  const finalCards = [];
  const results = { success: [], fail: [] };

  for (const item of deck) {
    const data = await fetchCardData(item.name);
    if (data) {
      for (let i = 0; i < item.qty; i++) finalCards.push(data);
      results.success.push(item.name);
    } else {
      results.fail.push(item.name);
    }
    await new Promise(r => setTimeout(r, API_THROTTLE_MS));
  }

  return { cards: finalCards, results };
}

function showSummary(results) {
  const overlay = document.getElementById('summary-overlay');
  const content = document.getElementById('summary-content');
  if (!overlay || !content) return;

  content.innerHTML = `
    <p class="ok">✅ Successfully loaded: ${results.success.length} unique cards</p>
    ${results.fail.length > 0 ? `<p class="fail">❌ Failed to find: ${results.fail.length} cards</p><ul>${results.fail.map(n => `<li>${n}</li>`).join('')}</ul>` : ''}
  `;
  overlay.classList.add('open');
}

function openCommanderPicker(cards) {
  const overlay = document.getElementById('commander-overlay');
  const list = document.getElementById('commander-list');
  if (!overlay || !list) return;

  list.innerHTML = '';
  const uniqueNames = [...new Set(cards.map(c => c.name))];

  uniqueNames.forEach(name => {
    const card = cards.find(c => c.name === name);
    const li = document.createElement('li');
    li.textContent = name;
    li.onclick = () => {
      selectCommander(card);
      overlay.classList.remove('open');
    };
    list.appendChild(li);
  });

  overlay.classList.add('open');
}

function selectCommander(card) {
  const commanderDiv = document.getElementById('commander');
  if (!commanderDiv) return;
  
  commanderDiv.innerHTML = '<div class="zone-label">Commander</div>';
  const el = createCardElement(card);
  commanderDiv.appendChild(el);
  addLog(`Commander selected: ${card.name}`);
}

// Connect to buttons when DOM is ready
function initImporter() {
  const importBtn = document.getElementById('import-btn');
  const clearBtn = document.getElementById('clear-btn');
  const deckInput = document.getElementById('deck-input');

  if (importBtn) {
    importBtn.onclick = async () => {
      const text = deckInput.value.trim();
      if (!text) return alert('Please enter a decklist');
      
      setStatus('Importing cards...');
      const { cards, results } = await processDecklist(text);
      
      showSummary(results);
      
      document.getElementById('summary-close').onclick = () => {
        document.getElementById('summary-overlay').classList.remove('open');
        if (cards.length > 0) openCommanderPicker(cards);
        
        // Add remaining to library (minus commander selection if we had one)
        // For simplicity, we just add all to library and user moves commander
        const libraryDiv = document.getElementById('library');
        libraryDiv.innerHTML = '<div class="zone-label">Library</div>';
        cards.forEach(c => libraryDiv.appendChild(createCardElement(c)));
        updateZoneCounts();
      };
    };
  }

  if (clearBtn) {
    clearBtn.onclick = () => {
      deckInput.value = '';
      document.querySelectorAll('.card').forEach(c => c.remove());
      updateZoneCounts();
      addLog('Board cleared');
      setStatus('Board cleared');
    };
  }
}
