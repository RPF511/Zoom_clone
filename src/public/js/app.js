const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

const welcome = document.getElementById("welcome");
const call = document.getElementById("call");

call.hidden = true;

// stream : combination of video & audio
let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label == camera.label){
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        })
    } catch(e){
        console.log(e);
    }
}

async function getMedia(deviceId){
    const initialConstrains = {
        audio: true,
        video: { facingMode: "user" },
    };
    const cameraConstraints = {
        audio: true,
        video: { deviceId : { exact: deviceId } },
    }
    try{
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId? cameraConstraints : initialConstrains
        );
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getCameras();
        }
    } catch(e){
        console.log(e);
    }
};




function handleMuteClick() {
    myStream
    .getAudioTracks()
    .forEach(track => track.enabled = !track.enabled);
    if(muted){
        muteBtn.innerText = "Unmute";
        muted = false;
    } else{
        muteBtn.innerText = "Mute";
        muted = true;
    }
}
function handleCameraClick() {
    myStream
    .getVideoTracks()
    .forEach(track => track.enabled = !track.enabled);
    if(cameraOff){
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else{
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

async function handleCameraChange(){
    getMedia(camerasSelect.value);
    if(myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find(sender => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);



/////////////////////// welcome form

const welcomeForm = welcome.querySelector("form");

async function initCall(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
}
welcomeForm.addEventListener("submit",handleWelcomeSubmit);



////////// socket
socket.on("welcome", async () => {
    console.log(myPeerConnection);
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName);
    console.log("send the offer");
});

socket.on("offer", async(offer) => {
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    console.log("got offer");
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("send the answer");
});

socket.on("answer", (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
    console.log("received the ice");
    myPeerConnection.addIceCandidate(ice);
});

//////// RTC
function makeConnection(){
    myPeerConnection = new RTCPeerConnection();
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    // console.log(myPeerConnection);
    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data){
    socket.emit("ice", data.candidate, roomName);
    console.log("send ice candidate");
}


function handleAddStream(data){
    console.log("got stream from peer");
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;

}

// const welcome = document.getElementById("welcome");
// const form = welcome.querySelector("form");
// const room = document.getElementById("room");


// room.hidden = true;

// let roomName;
let count = 0;

// function addMessage(message){
//     const ul = room.querySelector("ul");
//     const li = document.createElement("li");
//     li.innerText = message;
//     ul.appendChild(li);
// }

// function handleMessageSubmit(event){
//     event.preventDefault();
//     const input = room.querySelector("#message input");
//     const value = input.value;
//     socket.emit("new_message", input.value, roomName, () => {
//         addMessage(`You: ${value}`);
//     });
//     input.value = "";
// }

// function handleNameSubmit(event){
//     event.preventDefault();
//     const input = room.querySelector("#name input");
//     const value = input.value;
//     socket.emit("change_nickname", value, roomName);
// }

// function setRoomTitle(){
//     const h3 = room.querySelector("h3");
//     h3.innerText = `Room ${roomName} (${count})`;
// }

// function showRoom(roomName_server, count_server){
//     welcome.hidden = true;
//     room.hidden = false;
//     roomName = roomName_server;
//     count = count_server
//     setRoomTitle(roomName, count)
//     const msgForm = room.querySelector("#message");
//     const nameForm = room.querySelector("#name");
//     msgForm.addEventListener("submit", handleMessageSubmit);
//     nameForm.addEventListener("submit", handleNameSubmit);
// }

// function handleRoomSubmit(event){
//     event.preventDefault();
//     const room_name_input = form.querySelector("#room_name");
//     const nickname_input = form.querySelector("#nickname");
//     socket.emit("enter_room", room_name_input.value, nickname_input.value, showRoom);
    
//     room_name_input.value = "";
// }

// form.addEventListener("submit",handleRoomSubmit);


// socket.on("welcome", (user, new_count) => {
//     count = new_count;
//     setRoomTitle();
//     addMessage(`${user} joined`);
// });

// socket.on("bye", (user, new_count) => {
//     count = new_count;
//     setRoomTitle();
//     addMessage(`${user} left`);
// });

// socket.on("new_message", (user, msg) => {
//     addMessage(`${user} : ${msg}`);
// });

// socket.on("change_nickname", (old_name, new_name) => {
//     addMessage(`${old_name} changed nickname to  ${new_name}`);
// });

// socket.on("room_change", (room_data) => {
//     const roomList = welcome.querySelector("ul");
//     roomList.innerHTML = "";
//     if(room_data.length === 0){
//         return;
//     }
//     room_data.forEach(room => {
//         const li = document.createElement("li");
//         li.innerText= room;
//         roomList.append(li);
//     });
// });