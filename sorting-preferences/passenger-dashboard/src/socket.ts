import io, { Socket } from 'socket.io-client';

let socket: Socket;

export const initializeSocket = () => {
  socket = io('http://localhost:4000');

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

export const joinDriverRoom = (driverId: string) => {
  if (socket) {
    socket.emit('joinDriverRoom', driverId);
  }
};

export const joinPassengerRoom = (rideId: string) => {
  if (socket) {
    socket.emit('joinPassengerRoom', rideId);
  }
};

export const checkForCancelArea = (data: string) => {
  if(socket){
    socket.emit('pickup_changed', data);
  }
}