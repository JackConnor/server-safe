module.exports = {
  initIo: (server) => {
    const io = require('socket.io').listen(server);
    io.set('origins', [
      '*:*',
      'http://192.168.86.97:4200',
      '192.168.86.97:4200',
      'localhost:4200',
      'http://localhost:4200',
      'http://localhost:5555',
      'http://vqvoice.com',
      'https://trans-proto-frontend.appspot.com',
      'https://focus-groups-app.appspot.com/'
    ]);
    io.set( 'transports', ['polling', 'websocket'] );
    return io;
  }
}
