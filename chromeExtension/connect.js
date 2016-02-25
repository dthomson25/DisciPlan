    var socket = io.connect('http://localhost:3000');

    socket.on('connect', function() {
        console.log('socket connected');
        socket.emit('set username', 'danthom');
    });
    socket.on('ready', function() {
        socket.emit('msg', "This is a message from danthom.");
    });
