/*
 * Basic chat functionality
 */

var user;

function login(){
	if ( $("#username").val() == "" ) return;
	user = $("#username").val();

	socket.emit('login', user);

	$("#input").html("<textarea id='message' onkeydown='checkEnter(event,this)'></textarea><br /><button onclick='sendMessage()'>Send</button>");
	$("#message").focus();
}

function sendMessage(){
	var message = $("#message").val();
	if (message == "") return;
	$("#message").val("");
	socket.emit('message', message);
}

function formatMessage(messageData) {
	var time = messageData.time.replace("\\","");
	var user = messageData.user.replace("\\","");
	var message = messageData.message.replace("\\","");
	message = message.replace("\n","<br />");
	message = message.replace( RegExp("(\\w{5})(\\w)","g"), function(all,text,char) { return text+"<wbr>"+char; });
	html = "<div class='message'><table><tr>";
	html += "<td class='tag'><span class='time'>"+time+"</span> <span class='username'>"+user+"</span></td><td>"+message+"</td>";
	html += "</tr></table></div>";
	return html;
}
 
function checkEnter(e, field){
	if (e.keyCode == 13) {
		e.preventDefault();
		if (e.ctrlKey) $(field).val( $(field).val()+"\n" );
		else $(field).siblings("button:first").click();
	}
}
