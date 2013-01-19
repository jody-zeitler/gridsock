/*
 * Gridsock
 * A canvas whiteboard with magnets
 * Written by Jody Zeitler
 */

var grid, socket;
$(document).ready(function() {
	if (window.io != undefined) {
		socket = io.connect('http://localhost:8080'); // your gridserver here
		socket.on('connect', function(server) {

			var initHandler = function(data){
				var messages = JSON.parse(data);
				for (var i=0; i<messages.length; i++)
					$("#output").append( formatMessage(messages[i]) );
				$("#output").scrollTop( $("#output").prop("scrollHeight") );
				socket.removeListener('init', initHandler);
			}
			socket.on('init', initHandler);

			socket.on('message', function(data) {
				var json = JSON.parse(data);
				$("#output").append( formatMessage(json) );
				$("#output").scrollTop( $("#output").prop("scrollHeight") );
			});

			socket.on('online', function(data) {
				var online = JSON.parse(data);
				if (online.length < 1) {
					$("#users").html("No users online now.");
				} else {
					var list = "Users Online: <span class='username'>";
					list += online[0];
					for (var i=1; i < online.length; i++)
						list += ", " + online[i];
					list += "</span>";
					$("#users").html(list);
				}
			});

			socket.on('newGrid', function(data) {
				var json = JSON.parse(data);
				if (grid != null) grid.remove();
				grid = new Grid(220, 40, json.width, json.height, json.squareWidth, json.squareHeight, socket);
				getMagnets();
				$("#chat").css("left", json.width+240+"px");
			});

			socket.on('uploadedMagnet', function(data) { getMagnets(); });
		});

	} else { 
		$("body").css( { "position" : "absolute", "top" : ($(window).height()/2)+"px", "width" : $(window).width()+"px", "text-align" : "center", "font-size" : "20px", "font-weight" : "bold" } );
		$("body").html("The socket server is not running at the moment. Try again later.");
	}
});

function getMagnets() {
	$.get("getMagnets.php", function(data) {
		$("#magnets").html(data);
		grid.setMagnetListener();
	});
}

function uploadMagnet(event) {
	if (event) {
		var uploadWindow = window.open( "upload.php", "uploadWindow", "resizable=no, scrollbars=no, status=no, toolbar=no, width=450, height=200, top="+event.pageY+"+, left="+(event.pageX-200) );
	} else {
		getMagnets();
		socket.emit('uploadedMagnet', null);
	}
}

function loadBackground(event, path) {
	if (event) {
		var backgroundWindow = window.open( "background.php", "backgroundWindow", "resizable=no, scrollbars=no, status=no, toolbar=no, width=450, height=200, top="+event.pageY+"+, left="+(event.pageX-200) );
	} else if (path) {
		socket.emit('newBackground', path);
	}
}

function newGrid(event) {
	if (event) {
		$(".popup").remove();
		event.stopPropagation();
		var html = "<div class='popup'><table>";
		html += "<tr><td>Width:</td><td colspan='2'><input id='newWidth' /></td></tr>";
		html += "<tr><td>Height:</td><td colspan='2'><input id='newHeight' /></td></tr>";
		html += "<tr><td>Squares Wide:</td><td colspan='2'><input id='squareWidth' /></td></tr>";
		html += "<tr><td>Squares High:</td><td colspan='2'><input id='squareHeight' /></td></tr>";
		html += "<tr><td></td><td><button onclick='newGrid()'>Create</button></td><td id='newFeed'></td></tr>";
		html += "</table></div>";
		$("body").append(html);
		$(".popup").css({ "top" : event.pageY+"px", "left" : event.pageX+"px" });
		$(document).click(function(){ $(".popup").remove(); });
		$(".popup").click(function(event){ event.stopPropagation(); });
	} else {
		var newWidth = parseInt( $("#newWidth").val() ),
			newHeight = parseInt( $("#newHeight").val() ),
			squareWidth = parseInt( $("#squareWidth").val() ),
			squareHeight = parseInt( $("#squareHeight").val() );
		if (isNaN(newWidth) || newWidth < 0) return $("#newFeed").html("Width invalid.");
		if (isNaN(newHeight) || newHeight < 0) return $("#newFeed").html("Height invalid.");
		if (isNaN(squareWidth) || squareWidth < 0) return $("#newFeed").html("Squares Wide invalid.");
		if (isNaN(squareHeight) || squareHeight < 0) return $("#newFeed").html("Squares High invalid.");
		$("#newFeed").html("OK");
		$(".popup").remove();
		socket.json.emit('newGrid', JSON.stringify({ "width" : newWidth, "height" : newHeight, "squareWidth" : squareWidth, "squareHeight" : squareHeight }) );
		//grid.remove();
		//grid = new Grid(220, 40, newWidth, newHeight, squareWidth, squareHeight, socket);
	}
}

function saveGrid(event) {
	if (event) {
		$(".popup").remove();
		event.stopPropagation();
		var html = "<div class='popup'><table>";
		html += "<tr><td>Save Name:</td><td colspan='2'><input id='saveName' /></td></tr>";
		html += "<tr><td></td><td><button onclick='saveGrid()'>Save</button></td><td id='saveFeed'></td></tr>";
		html += "</table></div>";
		$("body").append(html);
		$(".popup").css({ "top" : event.pageY+"px", "left" : event.pageX+"px" });
		$(document).click(function(){ $(".popup").remove(); });
		$(".popup").click(function(event){ event.stopPropagation(); });
	} else {
		var saveName = $("#saveName").val();
		if (saveName == "") return $("#saveFeed").html("Supply a name.");
		socket.emit('saveGrid', saveName);
		var saveHandler = function(data) {
			$("#saveFeed").html(data);
			$(".popup").remove();
			socket.removeListener('saveGrid', saveHandler);
		}
		socket.on('saveGrid', saveHandler);
	}
}

function loadGrid(event) {
	if (event) {
		$(".popup").remove();
		event.stopPropagation();
		var html = "<div class='popup'><table>";
		html += "<tr><td>Load Name:</td><td colspan='2'><input id='loadName' /></td></tr>";;
		html += "<tr><td></td><td><button onclick='loadGrid()'>Load</button></td><td id='loadFeed'></td></tr>";
		html += "</table></div>";
		$("body").append(html);
		$(".popup").css({ "top" : event.pageY+"px", "left" : event.pageX+"px" });
		$(document).click(function(){ $(".popup").remove(); });
		$(".popup").click(function(event){ event.stopPropagation(); });
	} else {
		var loadName = $("#loadName").val();
		if (loadName == "") return $("#loadFeed").html("Supply a name.");
		socket.emit('loadGrid', loadName);
		var loadHandler = function(data) {
			$("#loadFeed").html(data);
			$(".popup").remove();
			socket.removeListener('loadGrid', loadHandler);
		}
		socket.on('loadGrid', loadHandler);
	}
}


function Grid(x, y, width, height, squaresWide, squaresHigh, socket, backimg) {

	/*** PUBLIC MEMBERS ***/

	this.showGrid = $("#showGrid").attr("checked") ? true : false;
	this.showNumbers = $("#showNumbers").attr("checked") ? true : false;
	this.snapTo = $("#snapTo").attr("checked") ? true : false;

	/*** PRIVATE MEMBERS ***/

	var that = this;
	var otherThat = this; // for Magnet class

	var mouseX = 0, mouseY = 0;
	var paint = false;

	var tool = "marker";
	var color = "#000000";
	var size = 5;
	var style = "round";

	var strokeX = new Array();
	var strokeY = new Array();
	var background;
	var redrawStroke;

	var magnets = new Array();

	var mouseDown = false;
	var dragging = false;
	var newImage = null;
	var redraw;
	var magnetTimer;

	/*** CREATE and APPEND to BODY ***/

	//if (backimg != undefined) {
		backimg = "backgrounds/forest.jpg";
		var background = document.createElement("img");
		background.src = backimg;
		background.width = width;
		background.height = height;
		document.body.appendChild(background);
		$(background).css( { "position" : "absolute", "top" : y+"px", "left" : x+"px", "margin" : "2px", "border" : "1px solid #000000" } );
	//}

	var grid = document.createElement("canvas");
	grid.width = width;
	grid.height = height;
	document.body.appendChild(grid);
	$(grid).css( { "position" : "absolute", "top" : y+"px", "left" : x+"px", "margin" : "2px" } );
	var gridWidth = Math.floor(width/squaresWide);
	var gridHeight = Math.floor(height/squaresHigh);
	drawGrid();

	var canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	document.body.appendChild(canvas);
	$(canvas).css( { "position" : "absolute", "top" : y+"px", "left" : x+"px", "margin" : "2px", "border" : "1px solid #000000" } );
	var context = canvas.getContext("2d");

	context.globalCompositeOperation = "source-over";
	context.strokeStyle = "#000000";
	context.lineWidth = 5;
	context.lineJoin = "round";

	var board = document.createElement("canvas");
	board.width = width;
	board.height = height;
	document.body.appendChild(board);
	$(board).css( { "position" : "absolute", "top" : y+"px", "left" : x+"px", "margin" : "2px" } );
	var boardctx = board.getContext("2d");
	this.magnetWidth = gridWidth;
	$("#magWidth").val(this.magnetWidth);

	boardctx.strokeStyle  = '#000000';
	boardctx.fillStyle    = '#000000';
	boardctx.font         = '12px Tahoma';

	/*** LISTENERS ***/

	$(canvas).mousedown(function(e){
		//e.preventDefault();
		$("input:focus").blur();
		background = canvas.toDataURL();
		paint = true;
		addStroke(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
		redrawStroke = setInterval(function(){drawStroke()}, 30);
	});

	$(canvas).mousemove(function(e){
		//e.preventDefault();
		mouseX = e.pageX - this.offsetLeft;
		mouseY = e.pageY - this.offsetTop;
		if (paint) addStroke(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
	});
	
	$(canvas).mouseleave(function(e){
		//e.preventDefault();
		if (paint) addStroke(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
	});
	
	$(canvas).mouseenter(function(e){
		//e.preventDefault();
		if (paint) addStroke(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
	});

	$(board).mousedown(function(e){
		//e.preventDefault();
		mouseDown = true;
		that.redrawBoard(); // to set dragging
		if (dragging) redraw = setInterval(function(){that.redrawBoard()}, 30);
		else passThrough(e);
	});
	
	$(board).mouseenter(function(e){
		//e.preventDefault();
		if (dragging) redraw = setInterval(function(){that.redrawBoard()}, 30);
		else passThrough(e);
	});
	
	$(board).mousemove(function(e){
		//e.preventDefault();
		mouseX = e.pageX - this.offsetLeft;
		mouseY = e.pageY - this.offsetTop;
		if (newImage != null && mouseX < (width - gridWidth/2) && mouseY < (height - gridHeight/2) ) {
			magnets.push( new Magnet( newImage, mouseX, mouseY, null, true ) );
			that.redrawBoard();
			saveMagnets();
		}
		newImage = null;
		if (!paint) {
			$(this).css("cursor", "crosshair");
			for (var i=0; i < magnets.length; i++) {
				if ( magnets[i].detect() ) {
					$(this).css("cursor", "move");
					if ( magnets[i].getDrag() && i < magnets.length-1 ) {
						var selected = magnets.splice(i,1);
						magnets.push(selected[0]);
					}
					break;
				}
			}
		}
		if (!dragging) passThrough(e);
	});
	
	$(board).mouseup(function(e){
		//e.preventDefault();
		if (dragging) {
			clearInterval(redraw);
			mouseDown = false;
			dragging = false;
			that.redrawBoard();
			saveMagnets();
		} else passThrough(e);
	});
	
	$(board).mouseleave(function(e){
		//e.preventDefault();
		if (dragging) {
			for (var i=0; i < magnets.length; i++) {
				if ( magnets[i].detect() ) {
					magnets.splice(i, 1);
				}
			}
			clearInterval(redraw);
			mouseDown = false;
			dragging = false;
			that.redrawBoard();
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
		if (paint) {
			paint = false;
			clearInterval(redrawStroke);
			smoothStroke();
		}
	});
	
		
	this.setMagnetListener = function() {
		$("img.magnet").mousedown(function(e){
			newImage = this.src;
		});
	}
	this.setMagnetListener();

	if (socket != undefined) {
		socket.on('newImage', function(data) {
			var img = new Image();
			img.onload = function() {
				context.save();
				context.globalCompositeOperation = "copy";
				context.drawImage(img, 0, 0);
				context.restore();
			}
			img.src = data;
		});

		socket.on('newStroke', function(data) { newStroke(data); });

		function newStroke(data) {
			if (paint) setTimeout(function(data){newStroke(data);}, 100);
			else {
				json = JSON.parse(data);

				context.save();
				context.strokeStyle = json.color;
				context.lineWidth = json.size;
				context.globalCompositeOperation = json.composition;

				context.beginPath();
				context.moveTo(json.strokeX[0], json.strokeY[0]);
				for (var i=1; i < json.strokeX.length; i++)
					context.lineTo(json.strokeX[i], json.strokeY[i]);
				context.stroke();
				context.closePath();

				context.restore();
				context.moveTo(mouseX, mouseY);
			}
		}

		socket.on('newMagnets', function(data) { newMagnets(data); });

		function newMagnets(data) {
			if (dragging) {
				//clearTimeout(magnetTimer);
				//magnetTimer = setTimeout(function(data){newMagnets(data);}, 100);
			} else {
				magnets = new Array();
				var newMagnets = jQuery.parseJSON(data);
				if (newMagnets != null) {
					for (var i=0; i < newMagnets.length; i++){
						var x = newMagnets[i].x;
						var y = newMagnets[i].y;
						var src = newMagnets[i].src.replace("\\","");
						var number = newMagnets[i].num;
						var scale = newMagnets[i].scale;
						magnets.push( new Magnet(src,x,y,number,false,scale) );
					}
					setTimeout(function(){that.redrawBoard()}, 100);
				}
			}
		}
	}

	/*** CANVAS FUNCTIONS ***/

	this.remove = function() { // remove canvas elements from dom
		$(grid).remove();
		$(canvas).remove();
		$(board).remove();
	}

	this.selectTool = function(name) {
		tool = name;
		if (name == "marker") {
			context.globalCompositeOperation = "source-over";
			context.strokeStyle = color;
		} else if (name == "eraser") {
			context.globalCompositeOperation = "destination-out";
			context.strokeStyle = "rgba(255,255,255,1.0)";
		}
	}

	this.selectColor = function(value) {
		if ( value.match(/^[0-9A-F]{6}$/i) ) {
			color = "#"+value;
			if (tool != "eraser")
				context.strokeStyle = value;
		}
		$("#colorValue").val( color.replace("#", "") );
	}

	this.selectSize = function(value) {
		value = parseInt(value);
		if (!isNaN(value) && value <= 50) {
			size = value;
			context.lineWidth = value;
			$("#toolSize").html(value);
		}
	}

	this.clearCanvas = function() {
		var perm = confirm("Are you sure you want to clear the canvas?");
		if (perm){
			context.save();
			context.setTransform(1, 0, 0, 1, 0, 0);
			context.clearRect(0, 0, width, height);
			context.restore();
			if (socket != undefined) socket.emit('clearImage', 'null');
		}
	}

	this.toggleGrid = function() {
		that.showGrid = that.showGrid ? false : true;
		drawGrid();
	}

	function drawGrid(){
		gridContext = grid.getContext("2d");
		if (that.showGrid) {
			gridContext.lineJoin = "round";
			gridContext.lineWidth = 2;
			gridContext.strokeStyle = "#555555";
		
			for (var i=1; i<squaresHigh; i++) {
				gridContext.moveTo(0, i*gridHeight);
				gridContext.lineTo(width, i*gridHeight);
			}
			gridContext.stroke();

			for (var i=1; i<squaresWide; i++) {
				gridContext.moveTo(i*gridWidth, 0);
				gridContext.lineTo(i*gridWidth, height);
			}
			gridContext.stroke();
		} else {
			gridContext.save();
			gridContext.setTransform(1, 0, 0, 1, 0, 0);
			gridContext.clearRect(0, 0, width, height);
			gridContext.restore();
		}
	}

	function addStroke(x,y) {
		strokeX.push(x);
		strokeY.push(y);
	}

	function drawStroke() {
		for (var i=0; i < strokeX.length; i++) {
			context.beginPath();
			context.moveTo(strokeX[0], strokeY[0]);
			for (var i=1; i < strokeX.length; i++)
				context.lineTo(strokeX[i], strokeY[i]);
			context.stroke();
			context.closePath();
		}
	}

	function smoothStroke() {
		var img = new Image();
		img.onload = function() {
			context.save();
			context.globalCompositeOperation = "copy";
			context.drawImage(img, 0, 0);
			context.restore();
			drawStroke();
			saveStroke();
		}
		img.src = background;
	}

	function saveStroke() {
		var packet = {};
		packet.strokeX = strokeX;
		packet.strokeY = strokeY;
		packet.color = color;
		packet.size = size;
		packet.composition = context.globalCompositeOperation;
		if (socket != undefined) socket.json.emit('saveStroke', JSON.stringify(packet) );
		strokeX = new Array();
		strokeY = new Array();
	}

	/*** BOARD FUNCTIONS ***/

	this.getMagnets = function() {
		return magnets;
	}

	this.setWidth = function(newWidth) {
		if (newWidth == 'S') newWidth = Math.floor(0.8*gridWidth);
		else if (newWidth == 'M') newWidth = gridWidth;
		else if (newWidth == 'L') newWidth = 2*gridWidth;
		else if (newWidth == 'H') newWidth = 3*gridWidth;
		else if (newWidth == 'G') newWidth = 4*gridWidth;

		if (newWidth <= board.width) {
			that.magnetWidth = newWidth;
			$("#magWidth").val(that.magnetWidth);
		} else $("#magWidth").val(that.magnetWidth);
	}

	this.redrawBoard = function() {
		boardctx.save();
		boardctx.setTransform(1, 0, 0, 1, 0, 0);
		boardctx.clearRect(0, 0, board.width, board.height);
		boardctx.restore();
		for (var i=magnets.length-1; i >= 0; i--) // detect back to front
			magnets[i].update();
		for (var i=0; i < magnets.length; i++) // draw front to back
			magnets[i].draw();
	}

	this.clearBoard = function() {
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

	function passThrough(e){
		e.preventDefault();
		$(canvas).trigger(e); // cross-reference
	}

	function saveMagnets(){
		if (socket != undefined) socket.json.emit('saveMagnets', JSON.stringify(magnets) );
	}

	function Magnet(src, x, y, num, snap, scale) {
		var that = this;
		var startX = 0;
		var startY = 0;
		var drag = false;

		this.x = x;
		this.y = y;
		this.src = src;
		var img = new Image();
		//img.onload = function() { that.update; }
		img.src = src;

		this.scale = scale > 0 ? scale : otherThat.magnetWidth/img.width;

		if (snap && otherThat.snapTo) { // allow snap-to when placed
			this.x = gridWidth * Math.floor((this.x+gridWidth/2)/gridWidth);
			this.x += ((gridWidth-img.width*this.scale)%gridWidth)/2;
			this.y = gridWidth * Math.floor((this.y+gridWidth/2)/gridWidth);
			this.y += ((gridWidth-img.height*this.scale)%gridWidth)/2;
		}

		if (num == undefined || num == null) {
			var mags = magnets;
			mags.sort(function(a,b){ 
				return a.num - b.num;
			});
			var num = 1;
			for (var i=0; i < mags.length; i++) {
				if (mags[i].src == this.src) {
					if (mags[i].num == num) num++;
				}
			}
			this.num = num;
		} else this.num = num;
	
		this.detect = function() {
			var left = that.x;
			var right = that.x + img.width*that.scale;
			var top = that.y;
			var bottom = that.y + img.height*that.scale;
		
			if (mouseX < right && mouseX > left && mouseY < bottom && mouseY > top) return true;
			else return false;
		}

		this.getDrag = function() { return drag; }
	
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
				if (drag && otherThat.snapTo) {
					that.x = gridWidth * Math.floor((that.x+gridWidth/2)/gridWidth);
					that.x += ((gridWidth-img.width*that.scale)%gridWidth)/2;
					that.y = gridWidth * Math.floor((that.y+gridWidth/2)/gridWidth);
					that.y += ((gridWidth-img.height*that.scale)%gridWidth)/2;
				}
				drag = false;
			}
			if (drag) {
				that.x = mouseX - startX;
				that.y = mouseY - startY;
			}
		}

		this.draw = function() {
			boardctx.drawImage(img, that.x, that.y, img.width*that.scale, img.width*that.scale);
			if (otherThat.showNumbers) {
				var tagWidth = this.num > 9 ? 19 : 10;
				boardctx.fillStyle = '#FFFFFF';
				boardctx.fillRect(that.x+1, that.y-14, tagWidth, 14);
				boardctx.fillStyle = '#000000';
				boardctx.strokeRect(that.x+1, that.y-14, tagWidth, 14);
				boardctx.fillText(that.num, that.x+2, that.y-2);
			}
		}

	} // Magnet

} // Grid

