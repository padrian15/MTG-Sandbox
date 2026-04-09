/**
 * core.js - The Foundation
 * Built by Gemma — Gemma 4
 * 
 * This file contains the essential utilities and base setup.
 * Once stabilized, this is considered "FINAL".
 */

const CARD_BACK = 'https://cards.scryfall.io/card-back';
const CARD_NOT_FOUND = 'https://cards.scryfall.io/unknown.jpg';

let life = 40;
let currentMenu = null;
let draggedCard = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let mulliganCount = 0;
let pendingCommander = false;
let poison = 0;

const setStatus = msg => { 
  const el = document.getElementById('status-text');
  if (el) el.textContent = msg; 
};

// --- Game Log ---
const gameLog  = [];
function addLog(msg) {
  const logBadge = document.getElementById('log-badge');
  const logInner = document.getElementById('log-panel-inner');
  const logEmptyEl = document.getElementById('log-empty');
  
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2, '0');
  const mm  = String(now.getMinutes()).padStart(2, '0');
  
  gameLog.push({ time: hh + ':' + mm, msg });
  if (logEmptyEl) logEmptyEl.style.display = 'none';
  
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  
  const timeSpan = document.createElement('span');
  timeSpan.className = 'log-time';
  timeSpan.textContent = hh + ':' + mm;
  
  const msgSpan = document.createElement('span');
  msgSpan.textContent = msg;
  
  entry.appendChild(timeSpan);
  entry.appendChild(msgSpan);
  logInner.insertBefore(entry, logInner.firstChild);
  
  if (logBadge) {
    logBadge.style.display = '';
    logBadge.textContent = '● ' + gameLog.length + ' action' + (gameLog.length !== 1 ? 's' : '');
  }
}

function updateZoneCounts() {
  const libraryDiv = document.getElementById('library');
  const graveyardDiv = document.getElementById('graveyard');
  const exileDiv = document.getElementById('exile');
  const gyCount = document.getElementById('gy-count');
  const exCount = document.getElementById('ex-count');

  if (gyCount) gyCount.textContent = graveyardDiv.querySelectorAll('.card').length;
  if (exCount) exCount.textContent = exileDiv.querySelectorAll('.card').length;
  
  if (libraryDiv) {
    const count = libraryDiv.querySelectorAll('.card').length;
    const label = libraryDiv.querySelector('.zone-label');
    if (label) label.innerHTML = 'Library<br><span style="font-size:20px;font-weight:700;color:#fff;">' + count + '</span>';
  }
}

function setCardFace(cardEl, faceUp) {
  if (cardEl.classList.contains('token')) return;
  const img = cardEl.querySelector('img');
  if (!img) return;
  img.src = faceUp ? (cardEl.dataset.front || img.src) : CARD_BACK;
}

function moveCard(cardEl, zoneId) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;
  
  if (zoneId === 'battlefield') {
    const rect = zone.getBoundingClientRect();
    // This is a simplified move; actual placement happens on drop
    cardEl.style.cssText += ';position:absolute;margin:0;left:0px;top:0px';
  } else {
    cardEl.style.position = '';
    cardEl.style.left = '';
    cardEl.style.top = '';
    cardEl.style.margin = '';
  }
  
  zone.appendChild(cardEl);
  setCardFace(cardEl, zoneId !== 'library');
  
  setStatus('Moved ' + cardEl.dataset.name + ' → ' + zoneId);
  addLog('Moved ' + cardEl.dataset.name + ' → ' + zoneId);
  updateZoneCounts();
}
