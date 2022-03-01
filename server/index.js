const socketio = require('socket.io');
const express = require('express');
require('dotenv').config();
const app = express();
const server = app.listen(process.env.PORT || 3000);
const io = socketio(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  }
});
const handleMessage = require('./chat/handleMessage');

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  socket.on('chat message', ({msg, room}) => {
    handleMessage(io, msg, room);
  });
});
