/**
 * socket.js - Multiplayer Synchronization
 * Built by Gemma — Gemma 4
 */

// Use environment variable or fallback to same host
const SERVER_URL = window.__MTG_SERVER_URL__ || '';
const socket = io(SERVER_URL);

async function joinRoom() {
  const codeInput = document.getElementById('room-code');
  const code = codeInput.value.trim();
  if (!code) return alert('Please enter a room code');

  // We use a Promise wrapper because socket.io emits are typically asynchronous events, 
  // but for the "Hard Gate" flow we need a synchronous-feeling response.
  const joinPromise = new Promise((resolve) => {
    socket.emit('joinRoom', { playerName: 'Guest', code: code }, (response) => {
      resolve(response);
    });
    
    // Fallback for the 'joinedRoom' event if the server uses a separate event instead of an ack
    socket.once('joinedRoom', (data) => {
      resolve({ success: true, ...data });
    });

    socket.once('joinError', (error) => {
      resolve({ success: false, message: error.message });
    });
  });

  try {
    const response = await joinPromise;
    if (response.success) {
      document.getElementById('room-overlay').style.display = 'none';
      document.getElementById('game-container').style.visibility = 'visible';
      addLog(`Joined room ${code}`);
    } else {
      alert('Failed to join room: ' + (response.message || 'Unknown error'));
    }
  } catch (e) {
    console.error('Join room error:', e);
    alert('Connection error. Is the server running?');
  }
}

async function createRoom() {
  const createPromise = new Promise((resolve) => {
    socket.emit('createRoom', { playerName: 'Host', format: '2p' }, (response) => {
      resolve(response);
    });

    socket.once('roomCreated', (data) => {
      resolve({ success: true, ...data });
    });
  });

  try {
    const response = await createPromise;
    if (response.success) {
      const code = response.code;
      document.getElementById('room-code').value = code;
      document.getElementById('room-overlay').style.display = 'none';
      document.getElementById('game-container').style.visibility = 'visible';
      addLog(`Created room ${code}. Share this code with others!`);
      alert(`Room created! Code: ${code}`);
    } else {
      alert('Failed to create room: ' + (response.message || 'Unknown error'));
    }
  } catch (e) {
    console.error('Create room error:', e);
    alert('Connection error. Is the server running?');
  }
}

function initSocket() {
  const joinBtn = document.getElementById('join-btn');
  const createBtn = document.getElementById('create-btn');
  
  if (joinBtn) joinBtn.onclick = joinRoom;
  if (createBtn) createBtn.onclick = createRoom;
}