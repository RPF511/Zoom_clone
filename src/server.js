import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public",express.static(__dirname+"/public"));
app.get("/", (req, res)=> res.render("home"));
app.get("/*", (req, res)=> res.redirect("/")); 

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });


const sockets = [];

wss.on("connection", (socket) => {
    sockets.push(socket);
    socket["nickname"] = "Anon";
    console.log("connected from client");
    socket.on("message", (msg) => {
        const message = JSON.parse(msg.toString("utf8"));
        console.log(msg.toString("utf8"));
        switch(message.type){
            case "new_message":
                sockets.forEach((aSocket)  => aSocket.send(`${socket.nickname} : ${message.payload}`));
            case "nickname":
                socket["nickname"] = message.payload;
        };
    });
    socket.on("close", () => {console.log("disconnected from client")});
});

server.listen(3000, handleListen);