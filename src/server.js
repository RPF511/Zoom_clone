import http from "http";
// import WebSocket from "ws";
import SocketIo from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public",express.static(__dirname+"/public"));
app.get("/", (req, res)=> res.render("home"));
app.get("/*", (req, res)=> res.redirect("/")); 

const handleListen = () => console.log(`Listening on http://localhost:3000`);


const httpServer = http.createServer(app);

const wsServer = SocketIo(httpServer);

function publicRooms(){
    const {sockets: {adapter: {sids, rooms}}} = wsServer;
    // const sids = wsServer.sockets.adapter.sids;
    const publicRoom = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined) {
            publicRoom.push(key);
        }
    });
    return publicRoom;
}
function countRoomUser(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", socket => {
    socket.nickname = socket.id;
    wsServer.sockets.emit("room_change", publicRooms());
    socket.onAny((event) => {
        console.log("event : ",event);
    });
    socket.on("enter_room", (roomName,nickName,showRoom) => {
        // console.log(socket.rooms);
        socket.nickname = nickName;
        socket.join(roomName);
        // console.log(socket.rooms);
        showRoom(roomName, countRoomUser(roomName));
        socket.to(roomName).emit("welcome", socket.nickname, countRoomUser(roomName));
        wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => socket.to(room).emit("bye", socket.nickname, countRoomUser(room) - 1 ));
    });
    socket.on("disconnect", ()=> {
        wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", socket.nickname, msg);
        done();
    });
    socket.on("change_nickname", (new_name, room) => {
        let old_name = socket.nickname;
        socket.nickname = new_name;
        socket.to(room).emit("change_nickname", old_name, new_name);
    });
});

// const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });


// const sockets = [];

// wss.on("connection", (socket) => {
//     sockets.push(socket);
//     socket["nickname"] = "Anon";
//     console.log("connected from client");
//     socket.on("message", (msg) => {
//         const message = JSON.parse(msg.toString("utf8"));
//         console.log(msg.toString("utf8"));
//         switch(message.type){
//             case "new_message":
//                 sockets.forEach((aSocket)  => aSocket.send(`${socket.nickname} : ${message.payload}`));
//             case "nickname":
//                 socket["nickname"] = message.payload;
//         };
//     });
//     socket.on("close", () => {console.log("disconnected from client")});
// });

httpServer.listen(3000, handleListen);