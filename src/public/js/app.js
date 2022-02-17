const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");


room.hidden = true;

let roomName;
let count = 0;

function addMessage(message){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function handleMessageSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#message input");
    const value = input.value;
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
}

function handleNameSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#name input");
    const value = input.value;
    socket.emit("change_nickname", value, roomName);
}

function setRoomTitle(){
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${count})`;
}

function showRoom(roomName_server, count_server){
    welcome.hidden = true;
    room.hidden = false;
    roomName = roomName_server;
    count = count_server
    setRoomTitle(roomName, count)
    const msgForm = room.querySelector("#message");
    const nameForm = room.querySelector("#name");
    msgForm.addEventListener("submit", handleMessageSubmit);
    nameForm.addEventListener("submit", handleNameSubmit);
}

function handleRoomSubmit(event){
    event.preventDefault();
    const room_name_input = form.querySelector("#room_name");
    const nickname_input = form.querySelector("#nickname");
    socket.emit("enter_room", room_name_input.value, nickname_input.value, showRoom);
    
    input.value = "";
}

form.addEventListener("submit",handleRoomSubmit);


socket.on("welcome", (user, new_count) => {
    count = new_count;
    setRoomTitle();
    addMessage(`${user} joined`);
});

socket.on("bye", (user, new_count) => {
    count = new_count;
    setRoomTitle();
    addMessage(`${user} left`);
});

socket.on("new_message", (user, msg) => {
    addMessage(`${user} : ${msg}`);
});

socket.on("change_nickname", (old_name, new_name) => {
    addMessage(`${old_name} changed nickname to  ${new_name}`);
});

socket.on("room_change", (room_data) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    if(room_data.length === 0){
        return;
    }
    room_data.forEach(room => {
        const li = document.createElement("li");
        li.innerText= room;
        roomList.append(li);
    });
});