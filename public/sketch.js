let socket;
let color = '#000';
let strokeWidth = 4;
let cv;
let previousState;
let db;
let interactions = 0;
let canvasElm;
let autoFetching = false;
let autoFetchingOnInterval;

let data = [];
let mousePressedData = [];

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
    const port = document.body.dataset.port;

    // Start the socket connection
    socket = io.connect(`http://${ip}:${port}`);

    // Callback function
    socket.on('mouse', (data) => {
        stroke(data.color);
        strokeWeight(data.strokeWidth);
        line(data.x, data.y, data.px, data.py);
    });

    socket.on('clear', (data) => {
        cv.clear();
    });

    const stream_preview = select('#stream-preview');
    stream_preview.mousePressed(() => {
        fetchStreamPreview();
    });

    const clear_btn = select('#clear-btn');
    clear_btn.mousePressed(() => {
        socket.emit('clear');
        cv.clear();
    });

    const undo_btn = select('#undo-btn');
    undo_btn.mousePressed(() => {
        undo();
    });

    //on keyboard event ctrl+z call undo function
    document.addEventListener('keydown', (e) => {
        if (e.keyCode === 90 && e.ctrlKey) {
            undo();
        }
    });

    const save_btn = select('#save-btn');
    save_btn.mousePressed(() => {
        fetchStreamPreview();
        //get the background image style from canvasElm and save as a png
        const data = canvasElm.style.backgroundImage;
        const dataUrl = data.slice(4, -1).replace(/"/g, '');
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL();
            const a = document.createElement('a');
            a.href = dataURL;
            //set file name as the current date
            const date = new Date();
            const dateString = date.toISOString();
            a.download = `drawing-${dateString}.png`;
            a.click();
        };
    });

    // Toggle auto fetching the streampreview image
    const auto_fetch_stream_preview = select('#autofetch-preview');
    auto_fetch_stream_preview.mousePressed(() => {
        if (autoFetching) {
            autoFetching = false;
            auto_fetch_stream_preview.html('Off');
            auto_fetch_stream_preview.style('background-color', '#ff0000');
            clearInterval(autoFetchingOnInterval);
        } else {
            //get data-screenShotTime from body
            const screenShotTime = document.body.dataset.time;
            autoFetching = true;
            auto_fetch_stream_preview.html('On');
            auto_fetch_stream_preview.style('background-color', '#00ff00');
            fetchStreamPreview();
            autoFetchingOnInterval = setInterval(() => {
                fetchStreamPreview();
            }, screenShotTime);
        }
    });
}

function centerCanvas() {
    const x = (windowWidth - width) / 2;
    const y = (windowHeight - height) / 2;
    cv.position(x, y);
}

function mouseDragged() {
    // only action if mouse is on the canvas
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        const stroke_width_picker = select('#stroke-width-picker');
        const width = parseInt(stroke_width_picker.value());
        strokeWidth = width > 0 ? width : 1;
        const color_picker = select('#pickcolor');
        color = color_picker.value();
        // Draw
        stroke(color);
        strokeWeight(strokeWidth);
        line(mouseX, mouseY, pmouseX, pmouseY);

        // Send the mouse coordinates
        sendmouse(mouseX, mouseY, pmouseX, pmouseY);

        // store the mouse movements to data arrays
        mousePressedData.push({
            x: mouseX,
            y: mouseY,
            px: pmouseX,
            py: pmouseY,
            color: color,
            strokeWidth: strokeWidth,
        });
    }
}

//on mouseReleased send the mousePressedData as a single snapshot to the data array
function mouseReleased() {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        data.push(mousePressedData);
        //empty the mousePressedData array
        mousePressedData = [];

        //send snapshot to everyone
        socket.emit('snapshot', {
            data: data,
        });
    }
}

//create a undo system for canvas that undo everything taken place from mouse click to released mouse
// and emit a undo event with the data as well as show the result on the canvas
function undo() {
    if (data.length > 0) {
        //remove the last data from the data array
        data.pop();
        socket.emit('undo', {
            data: data,
        });
        //clear the canvas
        cv.clear();
        //loop through the data array and draw the data
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].length; j++) {
                stroke(data[i][j].color);
                strokeWeight(data[i][j].strokeWidth);
                line(data[i][j].x, data[i][j].y, data[i][j].px, data[i][j].py);
            }
        }
    }
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

function fetchStreamPreview() {
    // send socket request to the server wait for a response then set the body background to the base64 data
    socket.emit('request-image');
    socket.on('image', (data) => {
        canvasElm.style.backgroundImage = `url(${data})`;
        canvasElm.style.backgroundSize = 'contain';
        canvasElm.style.backgroundRepeat = 'no-repeat';
    });
}

function delay(delay) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(2);
        }, delay);
    });
}
