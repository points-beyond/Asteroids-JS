const FPS = 60; // frames per second
const FRICTION = 0.7; // friction coefficient of space :) (0 = no friction, 1 = lots of friction)
const GAME_LIVES = 3; // starting number of lives
const LASER_DIST = 0.6; // max distance laser can travel as fraction of screen width
const LASER_EXPLODE_DUR = 0.1; // duration of the lasers' explosions
const LASER_MAX = 10; // maximum number of lasers on screet at once
const LASER_SPD = 500; // speed of lasers in pixels per second
const ROIDS_JAG = 0.4; // jaggedness of the asteroids (0 = 1, 1 = lots)
const ROID_PTS_LGE = 20; // points scored for a large asteroid
const ROID_PTS_MED = 50; // points scored for a medium asteroid
const ROID_PTS_SML = 100; // points scored for a small asteroid
const ROIDS_NUM = 1; // starting number of asteroids
const ROIDS_SIZE = 100; // starting size of asteroids in pixels
const ROIDS_SPD = 50; // max starting speed of asteroids in pixels per second
const ROIDS_VERT = 10; // average number of vertices on each asteroid
const SAVE_KEY_SCORE = 'highscore'; // save key for local storage of highscore 
const SHIP_EXPLODE_DUR = 0.3; // duration of the ship's explosions
const SHIP_BLINK_DUR = 0.1; // duration of the ship's blink during invisibility in seconds
const SHIP_INV_DUR = 3; // duration of ship's invisibility in seconds
const SHIP_SIZE = 20; // ship height in pixels
const SHIP_THRUST = 5; // acceleration of the ship in pixels per second per second
const TURN_SPEED = 360; // turn speed in degrees per second
const SHOW_BOUNDING = false; // show or hide collision bounding
const SHOW_CENTRE_DOT = false; // show or hide ship's centre dot
const SOUND_ON = false; //
const MUSIN_ON = false;
const TEXT_FADE_TIME = 2.5; // text fade time in seconds
const TEXT_SIZE = 40; // text font height in pixels

var cvs = document.getElementById('gameCanvas');
var ctx = cvs.getContext('2d');

// set up sound effects
// var fxExplode = new Sound('sounds/explode.mp3');
// var fxHit = new Sound('sounds/hit.mp3', 5);
// var fxLaser = new Sound('sounds/laser.mp3', 5, 0.5);
// var fxThrust = new Sound('sounds/thrust.mp3', 5, 0.5);

// set up the music
// var music = new Music('sounds/music-low', 'sounds/music-high');
// var roidsLeft, roidsTotal;

// set up the game parameters
var level, lives, roids, score, scoreHigh, ship, text, textAlpha;
newGame();

// set up event handlers
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);


// set up the game loop
setInterval(update, 1000 / FPS);

function createAsteroidBelt() {
	roids = [];
	// roidsTotal = ROID_NUM  + level * 7;
	// roidsLeft = roidsTotal;
	var x, y;
	for (var i = 0; i < ROIDS_NUM + level; i++) {
		// random asteroid location (not touching spaceship)
		do {
			x = Math.floor(Math.random() * cvs.width);
			y = Math.floor(Math.random() * cvs.height);
		} while (distBetweenPoints(ship.x, ship.y, x, y) < ROIDS_SIZE * 2 + ship.r);
		roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2)));
	}
}

function destroyAsteroid(index) {
	var x = roids[index].x;
	var y = roids[index].y;
	var r = roids[index].r;

	// split the asteroid in two if necessary
	if (r == Math.ceil(ROIDS_SIZE / 2)) {
		roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
		roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
		score += ROID_PTS_LGE;
	} else if (r == Math.ceil(ROIDS_SIZE / 4)) {
		roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
		roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
		score += ROID_PTS_MED;
	} else {
		score += ROID_PTS_SML;
	}

	// check high score
	if (score > scoreHigh) {
		scoreHigh = score;
		localStorage.setItem(SAVE_KEY_SCORE, scoreHigh);
	}

	// destroy the asteroid
	roids.splice(index, 1);
	// fxHit.play();

	// calculate the ratio of remaining asteroids to determine music tempo
	// roidsLeft--;
	// music.setAsteroidRatio(roidsLeft == 0 ? 1 : roidsLeft / roidsTotal);

	// new level when no more asteroids
	if (roids.length == 0) {
		level++;
		newLevel();
	}
}

function distBetweenPoints(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x2 - x1, 2) +Math.pow(y2 - y1, 2));
}

function drawShip(x, y, a, colour = 'white') {
	ctx.strokeStyle = colour;
	ctx.lineWidth = SHIP_SIZE / 20;
	ctx.beginPath();
	ctx.moveTo( // nose of the ship
		x + 4 / 3 * ship.r * Math.cos(a),
		y - 4 / 3 * ship.r * Math.sin(a),
	);
	ctx.lineTo( // rear left
		x - ship.r * (2 / 3 * Math.cos(a) + Math.sin(a)),
		y + ship.r * (2 / 3 * Math.sin(a) - Math.cos(a)),
	);
	ctx.lineTo( // rear right
		x - ship.r * (2 / 3 * Math.cos(a) - Math.sin(a)),
		y + ship.r * (2 / 3 * Math.sin(a) + Math.cos(a)),
	);
	ctx.closePath();
	ctx.stroke();
}

function explodeShip() {
	ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
	// fxExplode.play();
}

function gameOver() {
	ship.dead = true;
	text = 'Game Over';
	textAlpha = 1.0;
}

function keyDown(ev) {

	if (ship.dead) {
		return;
	}

	switch(ev.keyCode) {
		case 32: // space bar (shoot laser)
			shootLaser();
			break;
		case 37: // left arrow (rotating left)
			ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
			break;
		case 38: // up arrow (thrust the ship forward)
		ship.thrusting = true;
			break;
		case 39: // right arrow
			ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;
			break;

	}
}

function keyUp(ev) {

	if (ship.dead) {
		return;
	}

	switch(ev.keyCode) {
		case 32: // space bar (allow shooting again)
			ship.canShoot = true;
			break;
		case 37: // left arrow (stop retating left)
			ship.rot = 0;
			break;
		case 38: // up arrow (stop thrusting)
		ship.thrusting = false;
			break;
		case 39: // right arrow (stop retating right)
			ship.rot = 0
			break;

	}
}

function newAsteroid(x, y, r) {
	var lvlMult = 1 + 0.1 * level;
	var roid = {
		x: x,
		y: y,
		xv: Math.random() * ROIDS_SPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
		yv: Math.random() * ROIDS_SPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
		r: r,
		a: Math.random() * Math.PI * 2, // in radians
		vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),
		offs: []
	};

	// create the vertex offets array
	for (var i = 0; i < roid.vert; i++) {
		roid.offs.push(Math.random() * ROIDS_JAG *  2 + 1 - ROIDS_JAG);
	}

	return roid;
}

function newGame() {
	level = 0;
	lives = GAME_LIVES;
	score = 0;
	ship = newShip();

	// get the high score from local storage
	var scoreStr = localStorage.getItem(SAVE_KEY_SCORE);
	if (scoreStr == null) {
		scoreHigh = 0;
	} else {
		scoreHigh = parseInt(scoreStr);
	}

	newLevel();
}

function newLevel() {
	text = 'Level ' + (level + 1);
	textAlpha = 1.0;
	createAsteroidBelt();
}

function newShip() {
	return {
		x: cvs.width / 2,
		y: cvs.height / 2,
		r: SHIP_SIZE,
		a: 90 / 180 * Math.PI, // convert to radians
		blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
		blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
		canShoot: true,
		dead: false,
		explodeTime: 0,
		lasers: [],
		rot: 0,
		thrusting: false,
		thrust: {
			x: 0,
			y: 0,
		}
	}
}

function shootLaser() {
	// create the laser object
	if (ship.canShoot && ship.lasers.length < LASER_MAX) {
		ship.lasers.push({ // from the nose of the ship
			x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
			y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
			xv: LASER_SPD * Math.cos(ship.a) / FPS,
			yv: -LASER_SPD * Math.sin(ship.a) / FPS,
			dist: 0,
			explodeTime: 0
		});
		// fxLaser.play();
	}

	// prevent further shooting
	ship.canShoot = false;
}

function Music(srcLow, srcHigh) {
	this.soundLow = new Audio(srcLow);
	this.soundHigh = new Audio(srcHigh);
	this.low = true;
	this.high = false;
	this.tempo = 1.0; // seconds per beat
	this.beatTime = 0; // frames left until next beat

	this.play = function() {
		if (MUSIN_ON) {
			if (this.low) {
				this.soundLow.play();
			} else {
				this.soundHigh.play();
			}
			this.low = !this.low;
		}
	}

	this.setAsteroidRatio = function(ratio) {
		this.tempo = 1.0 - 0.75 * (1.0 - ratio);
	}

	this.tick = function() {
		if (this.beatTime == 0) {
			this.play();
			this.beatTime = Math.ceil(this.tempo * FPS);
		} else {
			this.beatTime--;
		}
	}
}

function Sound(src, maxStreams = 1, vol = 1.0) {
	this.streamNum = 0;
	this.streams = [];
	for (var i = 0; i < maxStreams; i++) {
		this.streams.push(newAudio(src));
		this.streams[i].volume = vol;
	} // rewrite with forEach()

	this.play = function() {
		if (SOUND_ON) {
			this.streamNum = (this.streamNum + 1) % maxStreams;
			this.streams[this.streamNum].play();
		}
	}

	this.stop = function() {
		this.streams[this.streamNum].pause();
		this.streams[this.streamNum].currentTime = 0;
	}
}

function update() {
	var blinkOn = ship.blinkNum % 2 == 0;
	var exploding = ship.explodeTime > 0;

	// play the music
	// music.tick();

	// draw space
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, cvs.width, cvs.height);

	// thrust the ship
	if (ship.thrusting && !ship.dead) {
		ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS;
		ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;
		// fxThrust.play();

		// draw the thruster
		if (!exploding && blinkOn) {
			ctx.strokeStyle = '#fff'; // flame color
			ctx.fillStyle = '#000'; // flame color
			ctx.lineWidth = SHIP_SIZE / 15;
			ctx.beginPath();
			ctx.moveTo( // rear left
				ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
				ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
			);
			ctx.lineWidth = 1;
			ctx.lineTo( // rear centre behind the ship
				ship.x - ship.r * (6 / 3 * Math.cos(ship.a)),
				ship.y + ship.r * (6 / 3 * Math.sin(ship.a))
			);
			ctx.lineTo( // rear right
				ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
				ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
			);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
		}
	} else {
		// apply friction (slow the ship down when not thrusting)
		ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
		ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
		// fxThrust.stop();
	}

	// draw the triangular ship
	if (!exploding) {
		if (blinkOn && !ship.dead) {
			drawShip(ship.x, ship.y, ship.a);
		}

		// handle blinking
		if (ship.blinkNum > 0) {

			// reduce the blink time
			ship.blinkTime--;

			// reduce the blink num
			if (ship.blinkTime == 0) {
				ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
				ship.blinkNum--;
			}
		}

	} else {
		// draw the explosion
		ctx.fillStyle = 'darkred';
		ctx.beginPath();
		ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
		ctx.fill();

		ctx.fillStyle = 'red';
		ctx.beginPath();
		ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
		ctx.fill();

		ctx.fillStyle = 'orange';
		ctx.beginPath();
		ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
		ctx.fill();

		ctx.fillStyle = 'yellow';
		ctx.beginPath();
		ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
		ctx.fill();

		ctx.fillStyle = 'white';
		ctx.beginPath();
		ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
		ctx.fill();
	}

	if (SHOW_BOUNDING) {
		ctx.strokeStyle = 'lime';
		ctx.beginPath();
		ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
		ctx.stroke();
	}

	// draw the asteroids
	var x, y, r, a, vert, offs;
	for (var i = 0; i < roids.length; i ++) {
		ctx.strokeStyle = 'white';
		ctx.lineWidth = SHIP_SIZE / 20;
		// get the asteroid properties
		x = roids[i].x;
		y = roids[i].y;
		r = roids[i].r;
		a = roids[i].a;
		vert = roids[i].vert;
		offs = roids[i].offs;
		// draw a path
		ctx.beginPath();
		ctx.moveTo(
			x + r * offs[0] * Math.cos(a),
			y + r * offs[0] * Math.sin(a),
		);

		// draw the polygon
		for (var j = 1; j < vert; j++) {
			ctx.lineTo(
				x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert),
				y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert)
			);
		}
		ctx.closePath();
		ctx.stroke();

			if (SHOW_BOUNDING) {
				ctx.strokeStyle = 'lime';
				ctx.beginPath();
				ctx.arc(x, y, r, 0, Math.PI * 2, false);
				ctx.stroke();
			}


	}

	// show ship's centre dot
	if (SHOW_CENTRE_DOT) {
		ctx.fillStyle = 'red';
		ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2);
	}

	// draw the lasers
	for (var i = 0; i < ship.lasers.length; i++) {
		if (ship.lasers[i].explodeTime == 0) {
			ctx.fillStyle = '#fff';
			ctx.beginPath();
			ctx.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 10, 0, Math.PI * 2, false);
			ctx.fill();
		} else {
			// draw the explesion
			ctx.fillStyle = 'orangered';
			ctx.beginPath();
			ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.75, 0, Math.PI * 2, false);
			ctx.fill();
			ctx.fillStyle = 'salmon';
			ctx.beginPath();
			ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.5, 0, Math.PI * 2, false);
			ctx.fill();
			ctx.fillStyle = 'pink';
			ctx.beginPath();
			ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.25, 0, Math.PI * 2, false);
			ctx.fill();
		}
	}

	// draw the game text
	if (textAlpha >= 0) {
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = 'rgba(255, 255, 255, ' + textAlpha + ')';
		ctx.font = 'small-caps ' + TEXT_SIZE + 'px dejavu sans mono';
		ctx.fillText(text, cvs.width / 2, cvs.height * 0.75);
		textAlpha -= (1.0 / TEXT_FADE_TIME / FPS);
	}

	// draw the lives
	var lifeColour;
	for (var i = 0; i < lives; i++) {
		lifeColour = exploding && i == lives - 1 ? 'red' : 'white';
		drawShip(15 + SHIP_SIZE + i * SHIP_SIZE * 2.3, SHIP_SIZE + 15, 0.5 * Math.PI, lifeColour);
	}

	// draw the score
	ctx.textAlign = 'right';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = '#fff';
	ctx.font =  TEXT_SIZE + 'px dejavu sans mono';
	ctx.fillText(score, cvs.width - SHIP_SIZE / 2, SHIP_SIZE + 10);

	// draw the high score
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = '#fff';
	ctx.font =  (TEXT_SIZE * 0.75) + 'px dejavu sans mono';
	ctx.fillText('Best ' + scoreHigh, cvs.width / 2, SHIP_SIZE + 10);

	// detect laser hits on asteroids

	var ax, ay, ar, lx, ly;
	for (var i = roids.length - 1; i >= 0; i--) {

		// grab the asteroid properties
		ax = roids[i].x;
		ay = roids[i].y;
		ar = roids[i].r;

		// loop over the lasers
		for (var j = ship.lasers.length - 1; j >= 0; j--) {

			// grab the laser properties
			lx = ship.lasers[j].x;
			ly = ship.lasers[j].y;
			
			// detect hits
			if (ship.lasers[j].explodeTime == 0 && distBetweenPoints(ax, ay, lx, ly) < ar) {

				// remove the asteroid and active the laser explosion
				destroyAsteroid(i);
				ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS);
				break;
			}
		}
	}

	// check for asteroid collisions (when not exploding)
	if (!exploding) {

		// only check when not blinking
		if (ship.blinkNum == 0 && !ship.dead) {
			for (var i = 0; i < roids.length; i++) {
				if (distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) < ship.r + roids[i].r) {
					explodeShip();
					destroyAsteroid(i);
					break;
				}
			}
		}

		// rotate the ship
		ship.a += ship.rot;

		// move the ship
		ship.x += ship.thrust.x;
		ship.y += ship.thrust.y;
	} else {
		// reduce the explode time
		ship.explodeTime--;

		// reset the ship after the explosion has finished
		if (ship.explodeTime == 0) {
			lives--;
			if (lives == 0) {
				gameOver();
			} else {
				ship = newShip();
			}
		}
	}

	// handle edge of screen
	if (ship.x < 0 - ship.r) {
		ship.x = cvs.width + ship.r;
	} else if (ship.x > cvs.width + ship.r) {
		ship.x = 0 - ship.r;
	}
	if (ship.y < 0 - ship.r) {
		ship.y = cvs.height + ship.r;
	} else if (ship.y > cvs.height + ship.r) {
		ship.y = 0 - ship.r;
	}

	// move the lasers
	for (var i = ship.lasers.length - 1; i >= 0; i--) {
		// check distance travelled
		if (ship.lasers[i].dist > LASER_DIST * cvs.width) {
			ship.lasers.splice(i, 1);
			continue;
		}

		// handle the explosion
		if (ship.lasers[i].explodeTime > 0) {
			ship.lasers[i].explodeTime--;

			// destroy the laser after the duration is up
			if(ship.lasers[i].explodeTime == 0) {
				ship.lasers.splice(i, 1);
				continue;
			}
		} else {
			// move the laser
			ship.lasers[i].x += ship.lasers[i].xv;
			ship.lasers[i].y += ship.lasers[i].yv;

			// calculate the distance travelled
			ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2));
		}
		// handle edge of screen
		if (ship.lasers[i].x < 0) {
			ship.lasers[i].x = cvs.width;
		} else if (ship.lasers[i].x > cvs.width) {
			ship.lasers[i].x = 0;
		}
		if (ship.lasers[i].y < 0) {
			ship.lasers[i].y = cvs.height;
		} else if (ship.lasers[i].y > cvs.height) {
			ship.lasers[i].y = 0;
		}
	}

	// move the asteroid
	for (var i = 0; i < roids.length; i++) {
		roids[i].x += roids[i].xv;
		roids[i].y += roids[i].yv;

	// handel asteroid edge of screen
	if (roids[i].x < 0 - roids[i].r) {
		roids[i].x = cvs.width + roids[i].r;
	} else if (roids[i].x > cvs.width + roids[i].r) {
		roids[i].x = 0 - roids[i].r
	}
	if (roids[i].y < 0 - roids[i].r) {
		roids[i].y = cvs.width + roids[i].r;
	} else if (roids[i].y > cvs.width + roids[i].r) {
		roids[i].y = 0 - roids[i].r
	}
	}
}

