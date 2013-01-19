/*
 * I wanted to break up the magnet board layer into
 * its own package, but this isn't used yet
 */

$(document).ready(function(){
	board = document.getElementById("board");
	boardctx = board.getContext("2d");
	
	$("#board").bind("mousedown", function(e){
		e.preventDefault();
		mouseDown = true;
		redrawBoard();
		if (dragging) redraw = setInterval("redrawBoard()", 30);
		else passThrough(e);
	});
	
	$("#board").bind("mouseenter", function(e){
		e.preventDefault();
		if (dragging) redraw = setInterval("redrawBoard()", 30);
		else passThrough(e);
	});
	
	$("#board").bind("mousemove", function(e){
		e.preventDefault();
		mouseX = e.pageX - this.offsetLeft;
		mouseY = e.pageY - this.offsetTop;
		if (newImage != null && mouseX < 780 && mouseY < 780) {
			magnets.push( new Magnet( newImage, mouseX, mouseY ) );
			redrawBoard();
			saveMagnets();
		}
		newImage = null;
		if (!paint) { // cross-reference!!!
			$(this).css("cursor", "crosshair");
			for (var i=0; i < magnets.length; i++){
				if ( magnets[i].detect() ) $(this).css("cursor", "move");
			}
		}
		if (!dragging) passThrough(e);
	});
	
	$("#board").bind("mouseup", function(e){
		e.preventDefault();
		if (dragging) {
			clearInterval(redraw);
			mouseDown = false;
			dragging = false;
			redrawBoard();
			saveMagnets();
		} else passThrough(e);
	});
	
	$("#board").bind("mouseleave", function(e){
		e.preventDefault();
		if (dragging) {
			for (var i=0; i < magnets.length; i++) {
				if ( magnets[i].detect() ) {
					magnets.splice(i, 1);
				}
			}
			clearInterval(redraw);
			mouseDown = false;
			dragging = false;
			redrawBoard();
			saveMagnets();
		}
	});
	
	$(document).mousedown(function(e){
		mouseDown = true;
	});
	
	$(document).mouseup(function(e){
		mouseDown = false;
		dragging = false;
		newImage = null;
	});
	
	$("img.magnet").mousedown(function(e){
		newImage = this.src;
	});

	boardctx.strokeStyle  = '#000000';
	boardctx.fillStyle    = '#000000';
	boardctx.font         = '12px Tahoma';
});

var board, boardctx;
var magnets = new Array();
var magnetStamp = 0;
var magnetTimeout = 1000;
var magnetWaiting = false;
var magnetSaving = false;

var mouseX = 0;
var mouseY = 0;
var mouseDown = false;
var dragging = false;
var redraw;
var newImage = null;

var showNumbers = true;
var snapTo = true;

function passThrough(e){
	e.preventDefault();
	$("#map").trigger(e); // cross-reference
}

function clearBoard(){
	var perm = confirm("Are you sure you want to clear all magnets?");
	if (perm) {
		magnets = new Array();
		boardctx.save();
		boardctx.setTransform(1, 0, 0, 1, 0, 0);
		boardctx.clearRect(0, 0, board.width, board.height);
		boardctx.restore();
		saveMagnets();
	}
}

function redrawBoard() {
	boardctx.save();
	boardctx.setTransform(1, 0, 0, 1, 0, 0);
	boardctx.clearRect(0, 0, board.width, board.height);
	boardctx.restore();
	for (var i=0; i < magnets.length; i++)
		magnets[i].update();
}

function saveMagnets(){
	socket.json.emit('saveMagnets', JSON.stringify(magnets) );
}

function Magnet(src, x, y, num) {
	var that = this;
	var startX = 0;
	var startY = 0;
	var drag = false;
	
	this.x = x;
	this.y = y;
	this.src = src;
	var img = new Image();
	img.src = src;

	if (num == undefined) {
		magnets.sort(function(a,b){ 
			return a.num - b.num;
		});
		var num = 1;
		for (var i=0; i < magnets.length; i++) {
			if (magnets[i].src == this.src) {
				if (magnets[i].num == num) num++;
			}
		}
		this.num = num;
	} else this.num = num;
	
	this.detect = function() {
		var left = that.x;
		var right = that.x + img.width;
		var top = that.y;
		var bottom = that.y + img.height;
		
		if (mouseX < right && mouseX > left && mouseY < bottom && mouseY > top) return true;
		else return false;
	}
	
	this.update = function() {
		if (mouseDown) {
			if (!drag) {
				startX = mouseX - that.x;
				startY = mouseY - that.y;
			}
			if ( that.detect() ) {
				if (!dragging) {
					dragging = true;
					drag = true;
				}
			}
		} else {
			drag = false;
		}
		if (drag) {
			that.x = mouseX - startX;
			that.y = mouseY - startY;
		} else {
			if (snapTo) {
				that.x = 40 * Math.floor((that.x+20)/40);
				that.x += ((40-img.width)%40)/2;
				that.y = 40 * Math.floor((that.y+20)/40);
				that.y += ((40-img.height)%40)/2;
			}
		}
			
		boardctx.drawImage(img, that.x, that.y);
		if (showNumbers) {
			boardctx.fillStyle = '#FFFFFF';
			boardctx.fillRect(that.x+1, that.y-12, 15, 12);
			boardctx.fillStyle = '#000000';
			boardctx.strokeRect(that.x+1, that.y-12, 15, 12);
			boardctx.fillText(that.num, that.x+2, that.y-2);
		}
	}
}
