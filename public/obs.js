let socket
let color = '#000'
let strokeWidth = 4
let cv
let data = []

function setup() {
	// Creating canvas
	cv = createCanvas(1920, 1080)
	centerCanvas()
	cv.background('rgba(255, 255, 255, 0)')
	document.getElementsByTagName('canvas')[0].style.border = '1px solid black';
	// Get ip from data-ip attribute on the body canvas
	const ip = document.body.dataset.ip
    const port = document.body.dataset.port


	// Start the socket connection
	socket = io.connect(`http://${ip}:${port}`)
	socket.emit('obs_connection');
	// Callback function
	socket.on('mouse', data => {
		stroke(data.color)
		strokeWeight(data.strokeWidth)
		line(data.x *2, data.y *2, data.px *2, data.py *2)
	})

	socket.on('clear', data => {
		cv.clear()
		data = [];
	})

	// on snapshot event update data
	socket.on('snapshot', snapshotData => {
		data = snapshotData;
		redrawCanvas()
	})

	// when undo event is sent update the data and redraw the data on the canvas
	socket.on('undo', undoData => {
		data = undoData
		cv.clear()
		redrawCanvas()
	})

}

function redrawCanvas() {
	for (let id in data) {
		for (let i = 0; i < data[id].length; i++) {
			for (let j = 0; j < data[id][i].length; j++) {
				stroke(data[id][i][j].color)
				strokeWeight(data[id][i][j].strokeWidth)
				line(data[id][i][j].x *2, data[id][i][j].y *2, data[id][i][j].px *2, data[id][i][j].py *2)
			}
		}
	}
}

function windowResized() {
	centerCanvas()
	cv.resizeCanvas(windowWidth / 2, windowHeight / 2, false)
}


function centerCanvas() {
	const x = (windowWidth - width) / 2
	const y = (windowHeight - height) / 2
	cv.position(x, y)
	cv.border
}

