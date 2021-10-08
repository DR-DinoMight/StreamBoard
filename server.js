import http from 'http';
import app, {config} from './app.js';
import { Server } from "socket.io";
import OBSWebSocket from 'obs-websocket-js';

var obs = new OBSWebSocket();

// Try to connect to the obs websocket server, if not  retry the connection every 5 seconds until connected.
const connectToOBS = () => {

    obs.connect({ address: config.obsHost, username: config.obsUsername, password: config.obsPassword })
        .then(() => {
            console.log('Connected to OBS');
        })
        .catch(err => {
            setTimeout(connectToOBS, 3000);
        });

    // get a snapshot image from OBS using TakeSourceScreenshot every 5 seconds and save the base64 string it to Preview.png
}


const normalizePort = (val) => {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
};

const port = normalizePort(config.port || '3000');
app.set('port', port);

const errorHandler = (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const address = server.address();
    const bind =
        typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges.');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use.');
            process.exit(1);
            break;
        default:
            throw error;
    }
};

const server = http.createServer(app);
server.on('error', errorHandler);
server.on('listening', () => {
    const address = server.address();
    const bind =
        typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
    console.log('Listening on ' + bind);
    if (!obs || !obs.connected) {
        connectToOBS();
    }
});

// Web sockets
const io = new Server(server, {
    cors: {
        origin: '*',
        method: 'GET',
    },
});




io.sockets.on('connection', (socket) => {
    console.log('Client connected: ' + socket.id);

    socket.on('mouse', (data) => {
        //get epoch time
        const time = new Date().getTime();

        socket.broadcast.emit('mouse', {...data, sender: socket.id, timestamp: time});
    });

    socket.on('request-image', (data) => {
        // if obs is connected send a request to take a screenshot then send the base64 string to the client who requested it
        getStreamPreview(socket);
    });

    socket.on('clear', () => {
        console.log('Clearning');
        socket.broadcast.emit('clear');
    })

    socket.on('disconnect', () => console.log('Client has disconnected'));
});

// //every 30 seconds emit background to all connected clients
// setInterval(() => {
//     getStreamPreview();
// }, 3000);


const getStreamPreview = (socket) => {
    //if socket is empty then send it globally
    if (!socket) {
        socket = io.sockets;
    }
    obs.send('TakeSourceScreenshot', { embedPictureFormat: 'jpg', compressionQuality: 80 })
    .then(({img}) => {
        socket.emit('image', img);
    })
    .catch(err => {
        console.log('Failed to take screenshot');
        console.log(err);
    })
}


server.listen(port);
