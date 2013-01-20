/* Gridserver, a Node.js server for canvas collaboration
 * Copyright (c) 2013 Jody Zeitler
 * Licensed under the MIT license.
 */

var sys = require("sys"),
    http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    io = require("socket.io"),
	Canvas = require("canvas");

var server = http.createServer(function(request, response) {
	var ip_address = request.connection.remoteAddress;
	var log = "HTTP request from "+ip_address+" - ";
	var nolog = false;

    var uri = url.parse(request.url).pathname,
        filename = '';
    
	if (uri.search("favicon.ico") > 0) nolog = true;
    if (uri.search("map\/tiles") > 0) nolog = true;
    filename = path.join(process.cwd(), uri);
	filename = path.normalize(filename);
    
    path.exists(filename, function(exists){
        if(!exists) {
			log += "\033[33m404\033[39m - "+filename;
			if (!nolog) logEvent(log);
            response.writeHead(404, {"Content-Type": "text/html"});
            response.write("404 Not Found\n");
            response.end();
            return;
        }
		
		var stats = fs.lstatSync(filename);
		
		if (stats.isDirectory()){
			var indexpath = path.join(filename,"index.html");
			if (uri.substr(-1) !== '/') {
        		response.writeHead(302, {"Location" : uri+"/"});
				response.end();
			}
			else if (path.existsSync(indexpath)) {
				fs.readFile(indexpath, "binary", function(err, file) {
					log += "\033[32m200\033[39m - "+indexpath;
					logEvent(log);

					response.writeHead(200, {"Content-Type": "text/html"});
					response.write(file, "binary");
					response.end();
				});
			}
			else {
				fs.readdir(filename, function(err, files) {
					if(err) {
						log += "\033[31m500\033[39m - "+filename;
						logEvent(log);
						response.writeHead(500, {"Content-Type": "text/html"});
						response.write(err + "\n");
						response.end();
						return;
					}
					
					var contents = new Array();
					files.forEach(function(file) {
						var stat = fs.lstatSync(filename+file);
						if (stat.isDirectory()) contents.push({"name" : file, "dir" : 1});
						else contents.push({"name" : file, "dir" : -1});
					});
					contents.sort(function(a,b) {
						if (a.dir > 0 && b.dir < 0) return -1;
						if (a.dir < 0 && b.dir > 0) return 1;
						return a.name > b.name;
					});
					
					log += "\033[32m200\033[39m - Index of "+filename;
					logEvent(log);
					
					var html = "<html><head><title>Index of "+uri+"</title>";
					html += "<style type='text/css'>a{color: #555555; text-decoration: none}a:hover{color: #000000}.directory{color: #00AA00}.file{color: #0000AA}</style>";
					html += "</head><body><ul><li><a href='../'>Up</a></li>";
					for (var i=0; i < contents.length; i++) {
						var style;
						if (contents[i].dir > 0) style = "directory";
						else style = "file";
						html += "<li><a class='"+style+"' href='"+contents[i].name+"'>"+contents[i].name+"</a></li>";
					}
					html += "</ul></body></html>";
					
					response.writeHead(200, {"Content-Type": "text/html"});
					response.write(html);
					response.end();
				});
			}
		}
        
		else {
			fs.readFile(filename, "binary", function(err, file) {
				var reasonPhrase = {};
				
				if(err) {
					log += "\033[31m500\033[39m - "+filename;
					logEvent(log);
					response.writeHead(500, {"Content-Type": "text/html"});
					response.write(err + "\n");
					response.end();
					return;
				}
				
				reasonPhrase = contentType(filename);

				log += "\033[32m200\033[39m - "+filename;
				if (!nolog) logEvent(log);

				response.writeHead(200, reasonPhrase);
				response.write(file, "binary");
				response.end();
			});
		}
    });
});

function contentType(filename) {
	var extTypes = {
		"html" : "text/html",
		"css" : "text/css",
		"js" : "text/javascript",
		"txt" : "text/plain",
		"ico" : "image/vnd.microsoft.icon",
		"jpg" : "image/jpeg",
		"jpg" : "image/jpeg",
		"png" : "image/png",
		"zip" : "application/zip",
		"log" : "text/plain"
	}
	var i = filename.lastIndexOf('.') + 1;
	var ext = (i > 0) ? filename.substr(i) : null;
	var type = ext ? extTypes[ext.toLowerCase()] : null;
	if (type) return {"Content-Type" : type};
	else return {"Content-Type" : "application/octet-stream"};
}

function getTimestamp() {
    var currTime = new Date();
	var year = currTime.getFullYear();
	var month = (currTime.getMonth()+1); month = month<10 ? "0"+month : month;
	var day = currTime.getDate(); day = day<10 ? "0"+day : day;
	var hour = currTime.getHours(); hour = hour<10 ? "0"+hour : hour;
	var minute = currTime.getMinutes(); minute = minute<10 ? "0"+minute : minute;
	var second = currTime.getSeconds(); second = second<10 ? "0"+second : second;
    return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}

function logEvent(event) {
	fs.open('gridserver.log', 'a', 0666, function(err,fd) {
		fs.write(fd, "\n"+getTimestamp()+" - "+event, null, 'ascii', function(err) {
			fs.close(fd);
			sys.puts("\033[34m"+getTimestamp()+"\033[39m"+" - "+event); });
	});
}

function getShortTime() {
	var currTime = new Date();
	var hour = currTime.getHours(); hour = hour<10 ? "0"+hour : hour;
	var minute = currTime.getMinutes(); minute = minute<10 ? "0"+minute : minute;
	var second = currTime.getSeconds(); second = second<10 ? "0"+second : second;
	return hour + ':' + minute + ':' + second;
}

function onlineJSON() {
	online = new Array();
	for (var nick in users)
		online.push(users[nick]);
	return JSON.stringify(online);
}

function drawStroke(data) {
	json = JSON.parse(data);

	ctx.strokeStyle = json.color;
	ctx.lineWidth = json.size;
	ctx.globalCompositeOperation = json.composition;

	ctx.beginPath();
	ctx.moveTo(json.strokeX[0], json.strokeY[0]);
	for (var i=1; i < json.strokeX.length; i++)
		ctx.lineTo(json.strokeX[i], json.strokeY[i]);
	ctx.stroke();
	ctx.closePath();

	image = canvas.toDataURL();
}

function clearCanvas() {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.restore();
}

function saveBoard(name) {
	var data = JSON.stringify({"name" : name, "dimensions" : dimensions, "image" : image, "magnets" : magnets});
	fs.open('boards/'+name+'.wb', 'w', 0666, function(err,fd) {
		fs.write(fd, data, null, 'utf-8', function(err) {
			fs.close(fd);
			if (err) { logEvent("Error saving file: "+err); }
			else { logEvent("Board saved to boards/"+name+".wb"); }
		});
	});
}

function loadBoard(name) {
	var loc = "boards/"+name+".wb";
	path.exists(loc, function(exists) {
		if (exists) {
			fs.readFile('boards/'+name+'.wb', function(err, file) {
				if (err) { logEvent("Error reading file: "+err); }
				else {
					data = JSON.parse(file);
					dimensions = data.dimensions;
					image = data.image;
					magnets = data.magnets;
					logEvent("Board loaded from boards/"+data.name+".wb");
					
					io.sockets.json.emit('newGrid', JSON.stringify(dimensions) );
					io.sockets.emit('newImage', image);
					io.sockets.json.emit('newMagnets', JSON.stringify(magnets) );
				}
			});
		} else {
			logEvent("Requested board does not exist");
		}
	});
} 


var canvas = new Canvas(800, 800),
	ctx = canvas.getContext('2d'),
	dimensions = { "width" : 800, "height" : 800, "squareWidth" : 20, "squareHeight" : 20 };

var image = canvas.toDataURL();
var magnets = new Array();

var users = new Array();
var chatLog = new Array();

server.listen(8080);
logEvent("Server running at localhost:8080");

var io = io.listen(server);

io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number
io.set('log level', 1);                    // reduce logging

loadBoard('current');
setInterval("saveBoard('current')", 300000); // save every 5 min

io.sockets.on('connection',function(socket) {
	logEvent("Socket established: " + socket.id);
	socket.json.emit('init', JSON.stringify(chatLog) );

	io.sockets.json.emit('online', onlineJSON() );
	socket.json.emit('newGrid', JSON.stringify(dimensions) );
	socket.emit('newImage', image);
	socket.json.emit('newMagnets', JSON.stringify(magnets) );

	socket.on('login', function(data) {
		logEvent(data + " logged in from " + socket.id);
		users[socket.id] = data;
		io.sockets.json.emit('online', onlineJSON() );
	});

	socket.on('message', function(data) {
		logEvent("Message from " + socket.id);
		var response = {};
		response.time = getShortTime();
		response.user = users[socket.id];
		response.message = data;
		io.sockets.json.emit('message', JSON.stringify(response) );
		chatLog.push(response);
	});

	socket.on('saveStroke', function(data) {
		logEvent("Stroke from " + socket.id);
		socket.broadcast.emit('newStroke', data);
		drawStroke(data);
	});

    socket.on('clearImage', function(data) {
        logEvent("Clear request from " + socket.id);
		clearCanvas();
		image = canvas.toDataURL();
        socket.broadcast.emit('newImage', image);
    });

	socket.on('saveMagnets', function(data) {
		logEvent("Magnets from " + socket.id);
		magnets = JSON.parse(data);
		socket.broadcast.emit('newMagnets', JSON.stringify(magnets) );
	});

	socket.on('newGrid', function(data) {
		logEvent("New dimensions from " + socket.id);
		var json = JSON.parse(data);
		canvas = new Canvas(json.width, json.height);
		ctx = canvas.getContext('2d');
		dimensions = { "width" : json.width, "height" : json.height, "squareWidth" : json.squareWidth, "squareHeight" : json.squareHeight };
		image = canvas.toDataURL();
		magnets = new Array();
		io.sockets.json.emit('newGrid', data);
	});

	socket.on('saveGrid', function(data) {
		logEvent("Save request from " + socket.id);
		saveBoard(data);
		socket.emit('saveGrid', "Board saved.");
	});

	socket.on('loadGrid', function(data) {
		logEvent("Load request from " + socket.id);
		loadBoard(data);
		socket.emit('loadGrid', "Board loaded.");
	});

	socket.on('uploadedMagnet', function(data) {
		logEvent("Magnet uploaded by " + socket.id);
		socket.broadcast.emit('uploadedMagnet', null);
	});

    socket.on('disconnect', function() {
		logEvent("Socket disconnected: " + socket.id);
		delete users[socket.id];
		io.sockets.emit('online', onlineJSON() );
		saveBoard('current');
	});
});




