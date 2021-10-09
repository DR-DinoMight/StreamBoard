import http from 'http';
import app, {config} from './app.js';
import { Server } from "socket.io";
import OBSWebSocket from 'obs-websocket-js';
import 'colors';
import ip from 'ip'

const localIp = ip.address()

var obs = new OBSWebSocket();

var data = [];


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
    console.log('---------------------'.blue.bold);
    console.log('StreamBoard Connected!'.rainbow.bold);
    console.log('Connect an OBS browser source to: '.blue + `http://${localIp}:${port}/obs`.green.bold);
    console.log('Draw at: '.blue + `http://${localIp}:${port}`.green.bold);
    console.log('---------------------'.blue.bold);

    console.log('');
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


    socket.on('obs_connection', () => {
        socket.emit('snapshot', {...data} );
    });

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
        console.log('Clearing');
        socket.broadcast.emit('clear');
        data = [];
    })

    socket.on('disconnect', () => console.log('Client has disconnected'));

    socket.on('snapshot', clientData => {
        data[socket.id] = clientData.data;
    })

    // on undo event broadcast the data to all clients except the one who sent the undo event
    socket.on('undo', (snapshotData) => {
        data[socket.id] = snapshotData.data;
        socket.broadcast.emit('undo', {...data})
    })
});

// //every 30 seconds emit background to all connected  clients
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
    })
}


server.listen(port);
