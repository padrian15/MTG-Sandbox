// Built by Gemma — Gemma 4
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const path = require('path');

const app = express();
const cors = require('cors');
app.use(cors({ origin: 'http://100.99.57.88:8002' }));
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://100.99.57.88:8002', methods: ['GET','POST'] }
});

const rooms = {};

// Serve the frontend
app.use(express.static(path.join(__dirname, '..')));

function generateCode() {
  return crypto.randomBytes(2).toString("hex").toUpperCase().slice(0,4);
}

io.on('connection', socket => {
  console.log('Connected:', socket.id);

  socket.on('createRoom', ({ playerName, format }) => {
    let code;
    do { code = generateCode(); } while (rooms[code]);
    rooms[code] = {
      format: format || '2p',
      players: [{ id: socket.id, name: playerName, seat: 0 }],
      spectators: [],
      gameLog: [],
      publicStates: {}
    };
    socket.join(code);
    socket.data.room = code;
    socket.data.seat = 0;
    socket.data.name = playerName;
    socket.data.spectator = false;
    console.log('Room created:', code, 'by', playerName);
    socket.emit('roomCreated', {
      code, seat: 0, format: format || '2p',
      players: [{ name: playerName, seat: 0 }]
    });
  });

  socket.on('joinRoom', ({ playerName, code, spectator }) => {
    const room = rooms[code];
    if (!room) { socket.emit('joinError', { message: 'Room not found: ' + code }); return; }

    if (spectator) {
      room.spectators.push({ id: socket.id, name: playerName });
      socket.join(code);
      socket.data.room = code;
      socket.data.spectator = true;
      socket.data.name = playerName;
      socket.data.seat = -1;
      socket.emit('joinedRoom', {
        code, seat: -1, spectator: true,
        format: room.format,
        players: room.players.map(p => ({ name: p.name, seat: p.seat })),
        publicStates: room.publicStates
      });
      socket.emit('gameLogHistory', room.gameLog.slice(-100));
    } else {
      const maxPlayers = room.format === '4p' ? 4 : 2;
      if (room.players.length >= maxPlayers) { socket.emit('joinError', { message: 'Room is full' }); return; }
      const seat = room.players.length;
      room.players.push({ id: socket.id, name: playerName, seat });
      socket.join(code);
      socket.data.room = code;
      socket.data.seat = seat;
      socket.data.name = playerName;
      socket.data.spectator = false;
      console.log('Player joined:', playerName, 'seat', seat, 'room', code);
      socket.emit('joinedRoom', {
        code, seat, format: room.format,
        players: room.players.map(p => ({ name: p.name, seat: p.seat })),
        publicStates: room.publicStates
      });
      socket.emit('gameLogHistory', room.gameLog.slice(-100));
      // Notify others
      io.to(code).emit('playerJoined', { name: playerName, seat });
    }
  });

  // Public game action - visible to everyone
  socket.on('startGame', () => {
    const code = Object.keys(rooms).find(c => rooms[c].players.some(p => p.id === socket.id));
    if (!code) return;
    const room = rooms[code];
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.seat !== 0) return; // only host (seat 0) can start
    io.to(code).emit('gameStart', { format: room.format, players: room.players });
  });

  socket.on('gameAction', (data) => {
    const code = socket.data.room;
    const room = rooms[code];
    if (!room) return;
    const entry = {
      ...data,
      playerName: socket.data.name,
      seat: socket.data.seat,
      ts: Date.now()
    };
    room.gameLog.push(entry);
    if (room.gameLog.length > 500) room.gameLog = room.gameLog.slice(-500);
    io.to(code).emit('gameAction', entry);
  });

  // Private action - full details only to sender, anonymized to others
  socket.on('privateAction', (data) => {
    const code = socket.data.room;
    const room = rooms[code];
    if (!room) return;
    // Full details to this player
    socket.emit('privateAction', {
      ...data,
      playerName: socket.data.name,
      seat: socket.data.seat,
      ts: Date.now()
    });
    // Public/anonymized to others
    const publicEntry = {
      type: data.type,
      msg: data.publicMsg || (socket.data.name + ' performed a private action'),
      playerName: socket.data.name,
      seat: socket.data.seat,
      ts: Date.now()
    };
    room.gameLog.push(publicEntry);
    socket.to(code).emit('gameAction', publicEntry);
  });

  // Chat message
  socket.on('chat', ({ message }) => {
    const code = socket.data.room;
    const room = rooms[code];
    if (!room) return;
    if (!message || !message.trim()) return;
    io.to(code).emit('chat', {
      playerName: socket.data.name,
      seat: socket.data.seat,
      message: message.trim(),
      ts: Date.now()
    });
  });

  // Public state update (life, hand count, battlefield state - NOT hand card names)
  socket.on('stateUpdate', (state) => {
    const code = socket.data.room;
    const room = rooms[code];
    if (!room || socket.data.spectator) return;
    room.publicStates[socket.data.seat] = {
      seat: socket.data.seat,
      playerName: socket.data.name,
      ...state
    };
    socket.to(code).emit('stateUpdate', {
      seat: socket.data.seat,
      playerName: socket.data.name,
      ...state
    });
  });

  socket.on('disconnect', () => {
    const code = socket.data.room;
    if (!code || !rooms[code]) return;
    const room = rooms[code];
    const name = socket.data.name;
    const seat = socket.data.seat;
    room.players = room.players.filter(p => p.id !== socket.id);
    room.spectators = room.spectators.filter(s => s.id !== socket.id);
    delete room.publicStates[seat];
    io.to(code).emit('playerLeft', { name, seat });
    console.log('Disconnected:', name, 'from room', code);
    if (room.players.length === 0 && room.spectators.length === 0) {
      delete rooms[code];
      console.log('Room deleted:', code);
    }
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, '0.0.0.0', () => console.log('MTG Multiplayer Server running on port ' + PORT + ' (all interfaces)'));
