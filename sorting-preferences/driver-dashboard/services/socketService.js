import io from 'socket.io-client';

let socket;

export const initializeSocket = () => {
  socket = io('http://localhost:5000');

  socket.on('connect', () => {
    console.log('Connected to socket server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const joinDriverRoom = (driverId) => {
  if (socket) {
    socket.emit('joinDriverRoom', driverId);
  }
};

export const joinPassengerRoom = (rideId) => {
  if (socket) {
    socket.emit('joinPassengerRoom', rideId);
  }
};
