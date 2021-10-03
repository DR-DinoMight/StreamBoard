let socket
let color = '#000'
let strokeWidth = 4
let cv

function setup() {
	// Creating canvas
	cv = createCanvas(1920, 1080)
	centerCanvas()
	cv.background('rgba(255, 255, 255, 0)')
	document.getElementsByTagName('canvas')[0].style.border = '1px solid black';
	// Get ip from data-ip attribute on the body canvas
	const ip = document.body.dataset.ip


	// Start the socket connection
	socket = io.connect(`http://${ip}:3000`)

	// Callback function
	socket.on('mouse', data => {
		stroke(data.color)
		strokeWeight(data.strokeWidth)
		line(data.x, data.y, data.px, data.py)
	})

	socket.on('clear', data => {
		console.log('received clear');
		cv.clear()
	})

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

