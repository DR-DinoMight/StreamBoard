let socket;
let color = '#000';
let strokeWidth = 4;
let cv;
let previousState;
let db;
let interactions = 0;
let canvasElm;

function setup() {
    // db = new PouchDB('sketch');
    // Creating canvas
    cv = createCanvas(1920 / 2, 1080 / 2);
    cv.parent('canvas');
    cv.background('rgba(255, 255, 255,0)');

    canvasElm = document.getElementById('canvas');
    // Set canvasElem width and height to the same as the child content
    canvasElm.style.width = cv.width + 'px';
    canvasElm.style.height = cv.height + 'px';
    canvasElm.style.backgroundColor = 'rgba(255, 255, 255,1)';
    canvasElm.style.border = '1px solid black';

    cv.elt.addEventListener('touchstart', (data) => {
        let touches = data.touches;
        strokeWeight(touches[0].force);
    });

    // Get ip from data-ip attribute on the body canvas
    const ip = document.body.dataset.ip;

    // Start the socket connection
    socket = io.connect(`http://${ip}:3000`);

    // Callback function
    socket.on('mouse', (data) => {
        stroke(data.color);
        strokeWeight(data.strokeWidth);
        line(data.x, data.y, data.px, data.py);
    });

    socket.on('clear', (data) => {
        console.log('received clear');
        cv.clear();
    });

    const stream_preview = select('#stream-preview');
    stream_preview.mousePressed(() => {
        // send socket request to the server wait for a response then set the body background to the base64 data
        socket.emit('request-image');
        socket.on('image', (data) => {
            canvasElm.style.backgroundImage = `url(${data})`;
            canvasElm.style.backgroundSize = 'cover';
        });
    });

    const clear_btn = select('#clear-btn');
    clear_btn.mousePressed(() => {
        cv.clear();
        socket.emit('clear');
    });
}

function centerCanvas() {
    const x = (windowWidth - width) / 2;
    const y = (windowHeight - height) / 2;
    cv.position(x, y);
}

function mouseDragged() {
    const stroke_width_picker = select('#stroke-width-picker');
    const width = parseInt(stroke_width_picker.value());
    strokeWidth = width > 0 ? width : 1;
    const color_picker = select('#pickcolor');
    color = color_picker.value();
    // Draw
    stroke(color);
    strokeWeight(strokeWidth / 2);
    line(mouseX, mouseY, pmouseX, pmouseY);

    // Send the mouse coordinates
    sendmouse(mouseX * 2, mouseY * 2, pmouseX * 2, pmouseY * 2);
}

// Sending data to the socket
function sendmouse(x, y, pX, pY) {
    const data = {
        x: x,
        y: y,
        px: pX,
        py: pY,
        color: color,
        strokeWidth: strokeWidth,
    };

    socket.emit('mouse', data);
}
