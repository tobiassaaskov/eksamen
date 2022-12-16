document.addEventListener("DOMContentLoaded", (event) => {
            console.log('loaded')
    const form = document.querySelector("form");
    const input = document.querySelector(".input");
    const messages = document.querySelector(".messages");
    const username = prompt("Please enter a nickname: ", "");
    var socket = io.connect();


    form.addEventListener("submit", function(event) {
        event.preventDefault();

        addMessage(username + ": " + input.value);

        socket.emit("chat_message", {
            message: input.value
        });

        input.value = "";
        return false;
    }, false);

    socket.on("chat_message", function(data) {
        addMessage(data.username + ": " + data.message);
    });

    socket.on("user_join", function(data) {
        
        addMessage(brugernavn + " just joined the chat!");
    });

    socket.on("user_leave", function(data) {
        addMessage(data + " has left the chat.");
    });

    addMessage("You have joined the chat as '" + username  + "'.");
    socket.emit("user_join", username);

    function addMessage(message) {
        const li = document.createElement("li");
        li.innerHTML = message;
        messages.appendChild(li);
        window.scrollTo(0, document.body.scrollHeight);
    }
});// $(document).ready(function(){
/*
window.addEventListener('DOMContentLoaded', (event) => {
console.log('DOM fully loaded and parsed');

// var socket = io.connect('http://localhost:3000');



var username = prompt("What is your name?");

// var username = 'xxx'
socket.emit('join', username);


// Listens for form submission
$("#chatForm").on('submit', function(e){
e.preventDefault();
var message = $("#message").val();
socket.emit('new_message', message)
$("#message").val("");
})

// adds HTML message to chat
const addMessageToChat = (message) => {
const messageElement = document.createElement('li');
// Opgave 2 ...

messageElement.innerText = new Date(message.timestamp).messageElement.innerText.getHours() + ":" + messageElement.innerText.getMinutes() + ", "+ messageElement.innerText.toDateString();
+ ': ' + message.username 
// + ": " + message.message + " - "

$("#messagesContainer").append(messageElement);
}


// On receiving one message: {username: '...', message: '...'}
socket.on('new_message', function(message){
console.log('message: ', message)
addMessageToChat(message);
})


// on receiving a list of messages
socket.on('messages', function(messages) {
console.log('messages: ', messages)
messages.forEach(message => {
addMessageToChat(message);
})
})

// On person joined chat
socket.on('addChatter', function(name){
var $chatter = $("<li>", {
text: name,
attr: {
  'data-name':name
}
})
$("#chatters").append($chatter)
})

// On person disconnect
socket.on("removeChatter", function(name){
$("#chatters li[data-name=" + name +"]").remove()
})

});
//  })
*/