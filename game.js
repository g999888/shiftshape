
/* 
	game.js

	Shifting Shapes. Written 100% in javascript.
	g12345, for LD 35
*/

window.onload = function()
{
	Game.launch("screen");
}

dataFiles = ["font2.png", "bugback3.png", "shapes.png"];
soundFiles = [ ];
// soundFiles = [ "ss-on-the-monuments-matrix.ogg" ];
// [ "ss-on-the-journeys-tubes.ogg"]; 

filesLeft = 10;  

Images = [];
Sounds = [];

musicPlaying = 0;

mx = 0;
my = 0;

TileSize = 32;

totalClicks = 0;

var score = 0;
var turns = 0;
var extrashifts = 10;
var clockticks = -1;
	
var camerax = 70;
var cameray = 20;

KEYS = { LEFT:37, UP:38, RIGHT:39, DOWN:40, SPACE:32, ENTER:13, BACKSPACE:8, R:82 };

var Keyboard = function()
{
	var keysPressed = {};
	var ctrl = false;
	
	window.onkeydown = function(e) 
					{ 
						ctrl = e.ctrlKey;
						keysPressed[e.keyCode] = true; 
					};
	window.onkeyup = function(e) { keysPressed[e.keyCode] = false;	};
	this.isDown = function(keyCode)	
				{ return keysPressed[keyCode] === true; };
	this.ctrlPressed = function() { return ctrl; }
};



function fileLoaded(filename)
{
	filesLeft --;
	console.log(filename + " loaded.");
}

function loadFile(filename, nr)
{
	var img = new Image();
	img.addEventListener('load', fileLoaded(filename));
	img.src = filename;
	Images.push(img);
}

function loadMusicFile(filename)
{
	var snd = new Audio();
	snd.addEventListener('load', fileLoaded(filename));
	snd.src = filename;
	Sounds.push(snd);
}

fontSize = 16;
function sprint(screen,x,y,s)
// prints a string at x,y, no wrapping
{
	var px = x;
	var py = y;
	for (var i=0; i<s.length; i++)
	{
		c = s.charCodeAt(i);
		if ( (c>=97) && (c<=122) ) c-=32;
		if ( (c>=32) && (c<=95) )
		screen.drawImage (Images[0], (c-32)*fontSize,0, fontSize,fontSize, px,py, fontSize,fontSize);
		px += fontSize;
	}
}

function sprintnum(screen,x,y,n)
// prints a number at x,y, no wrapping
{
	sprint(screen,x,y,n+'');
}

var mouseX = 0;
var mouseY = 0;

function getMousePos(canvas, event) 
{
	var rect = canvas.getBoundingClientRect();
	if ((event.pageX != undefined) && (event.pageY != undefined))
	{
		mouseX = event.pageX;
		mouseY = event.pageY;
	}
	else
	{
		mouseX = event.clientX;
		mouseY = event.clientY;
	}
	mouseX -= rect.left;
	mouseY -= rect.top;
}

function mouseClicked(canvas, event)
{
	totalClicks ++;
	getMousePos(canvas, event);
}

function shiftLeft(x, y)
// shifts a row
{
	t = map0[y][0];
	for (var xx = 0; xx < mx-1; xx++)
	{
		map0[y][xx] = map0[y][xx+1];
	}
	map0[y][mx-1] = t;
}

function shiftRight(x, y)
// shifts a row
{
	t = map0[y][mx-1];
	for (var xx = 0; xx < mx-1; xx++)
	{
		map0[y][mx-1-xx] = map0[y][mx-2-xx];
	}
	map0[y][0] = t;
}

function shiftUp(x, y)
// shifts a row
{
	t = map0[0][x];
	for (var yy = 0; yy < my-1; yy++)
	{
		map0[yy][x] = map0[yy+1][x];
	}
	map0[my-1][x] = t;
}

function shiftDown(x, y)
// shifts a row
{
	t = map0[my-1][x];
	for (var yy = 0; yy < my-1; yy++)
	{
		map0[my-1-yy][x] = map0[my-2-yy][x];
	}
	map0[0][x] = t;
}

function adjustshifts()
{
	extrashifts = 10 - Math.floor(score/500);
	if (extrashifts < 4) extrashifts = 4;
}

function scoring()
// returns scores, and a new map0
{
	var xx, yy, tot;
	
	turns --;
	
	// check all rows
	for (yy = 0; yy < my; yy++)
	{
		tot = 0;
		for (xx = 0; xx < mx; xx++)
		{
			if (map0[yy][xx] == map0[yy][0]) tot ++;
		}
		if (tot == mx)
		{
			score += 100;
			for (var i = 0; i < mx; i++)
			{
				map0[yy][i] = Math.floor((Math.random() * 5) + 1);
			}
			turns += extrashifts + 1;
			
			adjustshifts();
		}
	}
	
	// check all columns
	for (xx = 0; xx < mx; xx++)
	{
		tot = 0;
		for (yy = 0; yy < my; yy++)
		{
			if (map0[yy][xx] == map0[0][xx]) tot ++;
		}
		if (tot == my)
		{
			score += 100;
			for (var i = 0; i < my; i++)
			{
				map0[i][xx] = Math.floor((Math.random() * 5) + 1);
			}
			turns += extrashifts + 1;
			
			adjustshifts();
		}
	}
}

Game = {};

people = [];

Game.launch = function(canvasId)
{
	var canvas = document.getElementById(canvasId);
	var screen = canvas.getContext('2d');
	var gameSize = { x: canvas.width, y: canvas.height };
	
	// gameMode: 0 = start screen; 1 = game; 2 = game over;
	var gameMode = 0;
	
	people = [ new Player() ];
	
	filesLeft = dataFiles.length + soundFiles.length;
	
	for (var i=0; i<dataFiles.length; i++)
		loadFile(dataFiles[i], i);
	for (var i=0; i<soundFiles.length; i++)
		loadMusicFile(soundFiles[i], i);
	
	camerax = Math.floor ((canvas.width - mx*TileSize)/4);
	score = 0;
	var depth = 0;
	
	{
		totalClicks = 0;
	}

	var update = function()
	{
		if (gameMode === 1)
		{
			for (var i=people.length-1; i>=0; i--)
				people[i].update();
			
			if ( (people[0].keyb.isDown(KEYS.BACKSPACE)) || (people[0].keyb.isDown(KEYS.R)) )
			{				
				newGame();
			}
		}
		else
		{
			if (people[0].keyb.isDown(KEYS.ENTER))
			{
				if (gameMode === 0) gameMode = 1;
				if (gameMode === 3) gameMode = 1;
			}
		}
	}
	

	
	mx = 8;
	my = 8;
	
	map0 = new Array(my);
	for (var y=0; y<my; y++)
	{
		map0[y] = new Array(mx);
	}
	
	var newGame = function()
	{
		score = 0;
		turns = 20;
		extrashifts = 10;
		clockticks = 0;

		for (var y=0; y<my; y++)
		{
			for (var x=0; x<mx; x++)
				map0[y][x] = Math.floor((Math.random() * 5) + 1);
		}
	}
	
	newGame();
	
	var drawTile = function(x, y, nr)
	{
		screen.drawImage (Images[2], (nr+2)*TileSize, 0,
							TileSize, TileSize, 
							camerax + x * TileSize, cameray + y * TileSize, 
							TileSize, TileSize);

	}
	
	var drawGrid = function()
	{
		for (var y=0; y<my; y++)
		{
			for (var x=0; x<mx; x++)
				drawTile (x,y, map0[y][x]);
		}	
	}
	
	var draw = function(screen, gameSize, clockticks)
	{
		if (gameMode === 1)
		{
			screen.fillStyle="black";
			screen.fillRect(0, 0, gameSize.x, gameSize.y-2*TileSize-16);

			for (var i=0; i<people.length; i++)
				people[i].draw(screen, camerax, cameray);
			
			drawGrid();
			
			screen.fillStyle="goldenrod";
			screen.fillRect(0,gameSize.y-2*TileSize-16, gameSize.x, gameSize.y);

			// depth = Math.floor (people[0].center.y / TileSize);
			depth = people[0].depth;
//			sprint (screen, 16, 384-8-32, "Score: " + score + " Depth: " + depth + "  ");
			var scoretext = "  Score: " + score + "  ";
			sprint (screen, Math.floor((gameSize.x - 16 * scoretext.length)/2), 384-8-60, scoretext);
			scoretext = "  Shifts Left: " + turns + "  ";
			sprint (screen, Math.floor((gameSize.x - 16 * scoretext.length)/2), 384-8-40, scoretext);
			scoretext = "  Time: " + Math.floor(clockticks/60) + "  ";
			sprint (screen, Math.floor((gameSize.x - 16 * scoretext.length)/2), 384-8-20, scoretext);
	
			if (turns < 1)
			{
				gameMode = 3;
				
				sprint (screen, 80, 140, "Game over");
				// sprint (screen, 80, 180, "You have Escaped!");
				// score += 100;
				sprint (screen, 80, 200, "Score: "+score);
				sprint (screen, 80, 220, "Press Enter to restart");

				newGame();
			}
		}
		
		if (gameMode === 0)
		{
			screen.fillStyle="black";
			screen.fillRect(0,0, gameSize.x, gameSize.y);
			
			sprint (screen, 120, 30, "Shifting Shapes");
			sprint (screen, 16, 120, "  Make Lines of 8 of the");
			sprint (screen, 16, 140, "  same shape, with a limited");
			sprint (screen, 16, 160, "  number of shifts.");
			sprint (screen, 16, 210, "Keys: Cursor Keys + Ctrl");
			sprint (screen, 16, 250, "  R or Backspace to restart");
			sprint (screen, 16, 290, "Press ENTER to start.");
			sprint (screen, 16, 330, "  Made for Ludum Dare 35.");
//			sprint (screen, 16, 384-8-32, "Total Clicks: " + totalClicks );
		}
	}
	
	var tick = function()
	{
		if (filesLeft === 0)
		{
			// console.log ("All files loaded");
			update();
			clockticks ++;
			draw(screen, gameSize, clockticks);
			
			if (!musicPlaying)
			{
				musicPlaying = 1;
				if (Sounds.length > 0)
				{
					Sounds[0].loop = true;
					Sounds[0].play();
				}
			}
		}
		requestAnimationFrame(tick);
	}

	// This to start a game
	tick();
};


var Player = function()
{
	this.size = { x: 32, y: 32 };
	this.center = { x: 3, y: 3 };
	this.keyb = new Keyboard();
	this.counter = 0;
	this.hold = 0; // how long has the player holding a key?
	
	this.depth = 0;
}

Player.prototype =
{
	update: function()
	{
		var nx = this.center.x;
		var ny = this.center.y;

		if (this.hold == 0)
		{
			if ( this.keyb.isDown(KEYS.LEFT) )
				{
					if (this.keyb.ctrlPressed())
					{
						shiftLeft(nx, ny);
						scoring();
					}
					else
					{
						if ( nx > 0 ) nx --;
					}
					this.hold = 5;
				}
			else	
			if (this.keyb.isDown(KEYS.RIGHT)) 
				{ 
					if (this.keyb.ctrlPressed())
					{
						shiftRight(nx, ny);
						scoring();
					}
					else
					{
						if ( nx < mx-1 ) nx ++;
					}
					this.hold = 5;
				}
			else
			if ( this.keyb.isDown(KEYS.UP) )
				{
					if (this.keyb.ctrlPressed())
					{
						shiftUp(nx, ny);
						scoring();
					}
					else
					{
						if ( ny > 0 ) ny --;
					}
					this.hold = 5;
				}
			else
			if (this.keyb.isDown(KEYS.DOWN)) 
			{
				{ 
					if (this.keyb.ctrlPressed())
					{
						shiftDown(nx, ny);
						scoring();
					}
					else
					{
						if ( ny < my-1 ) ny ++;
					}
					this.hold = 5;
				}
			}
/*				
			if (this.keyb.ctrlPressed())
				{
					if ( (nx != this.center.x) || (ny != this.center.y) )
					{
						var t = map0[ny][nx];
						map0[ny][nx] = map0[this.center.y][this.center.x];
						map0[this.center.y][this.center.x] = t;
					}
				}
*/
//			score = this.keyb.ctrlPressed();
		}
			
		this.center.x = nx;
		this.center.y = ny;
		
		if (this.hold > 0) this.hold--;
		
		this.counter++;
		this.counter %= 40;

	},
	
	draw: function(screen, camerax, cameray)
	{
//		sprint (screen, 16, 384-8-16, "Hold: " + this.hold + " State: " + this.onfloor + ' ');
		screen.drawImage (Images[2], 32, 0,
							this.size.x,this.size.y, 
							camerax + this.center.x * 32, cameray + this.center.y * 32, 
							this.size.x,this.size.y);
	}
}

var Fly = function(player)
{
	this.size = { x: 16, y: 8 };
	this.center = { x: Math.floor(Math.random()*(50-2)*TileSize), y: Math.floor(Math.random()*(50-2)*TileSize) };
	this.player = player;
	this.counter = 0;
}

Fly.prototype =
{
	update: function()
	{

		if (this.center.x < this.player.center.x+8) this.center.x += 1;
		if (this.center.y < this.player.center.y+10) this.center.y += 1;
		if (this.center.x > this.player.center.x+8) this.center.x -= 1;
		if (this.center.y > this.player.center.y+10) this.center.y -= 1;
		
		if ( (this.center.x === this.player.center.x+8) && (this.center.y === this.player.center.y+10) )
			this.center = { x: Math.floor(Math.random()*(mx-2)*TileSize), y: Math.floor(Math.random()*(my-2)*TileSize) };
			//this.center = { x: Math.floor(Math.random()*300)*2, y: Math.floor(Math.random()*200)*2 };
		
		this.counter ++;
		this.counter %= 40;
	},
	
	draw: function(screen, camerax, cameray)
	{
		screen.drawImage (Images[1], 16+(this.counter >= 20?16:0), 0, this.size.x,this.size.y, 
							this.center.x-(camerax*TileSize),this.center.y-(cameray*TileSize), 
							this.size.x,this.size.y);
	}
}

