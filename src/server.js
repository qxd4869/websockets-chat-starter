const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listeningon 127.0.0.1: ${port}`);

// pass in the http server into socketio and grab socketio webserver as io
const io = socketio(app);

// object to hold all of our connected users
const users = {};

const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
    // messsage back to new user
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online`,
    };

    users[data.name] = data.name;
    socket.name = data.name;
    socket.emit('msg', joinMsg);

    socket.join('room1');

    // announcement to everyone in the room
    const response = {
      name: 'server',
      msg: `${data.name} has joined the room.`,
    };
    socket.broadcast.to('room1').emit('msg', response);

    console.log(`${data.name} joined`);
    // success message back to new user
    socket.emit('msg', { name: 'server', msg: 'you joined the room' });
  });
};

const onMsg = (sock) => {
  const socket = sock;

  socket.on('msgToServer', (data) => {
    io.sockets.in('room1').emit('msg', { name: socket.name, msg: data.msg });
  });

  socket.on('diceroll', () => {
    const roll = Math.floor(Math.random() * 6);
    io.sockets.in('room1').emit('msg', { name: socket.name, msg: `${socket.name} rolled a ${roll} on a six sided die` });
  });

  socket.on('datetime', () => {
    const date = new Date();
    socket.emit('msg', { name: 'server', msg: `Current date time: ${date}` });
  });
  socket.on('dance', () => {
    io.sockets.in('room1').emit('msg', { name: 'server', msg: `${socket.name} dances like a boss` });
  });
};

const onDisconnect = (sock) => {
  const socket = sock;

  // remove user
  socket.on('disconnect', () => {
    // announcement to everyone in the room
    const response = {
      name: 'server',
      msg: `${socket.name} has left the room.`,
    };

    socket.broadcast.to('room1').emit('msg', response);
    console.log(`${socket.name} left`);
    socket.leave('room1');

    delete users[socket.name];
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
});


console.log('Websocket server started');

