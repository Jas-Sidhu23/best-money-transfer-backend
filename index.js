const express    = require("express");
const app        = express();
var routes       = require("./routes");
const mysql      = require("./connection");
const cors       = require("cors");
const bodyParser = require("body-parser");
app.use(
  cors({
    // withCredentials: true,
    credentials: true,
    // credentials:'include',
    // origin: ["http://103.99.202.191:3002"],
    origin: [
      "http://192.168.0.5:4444",
    ],
  })
);
/*
const http = require('http');
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);


io.on("connection", (socket) => {
    console.log("Connected to Socket.IO server");
    console.log("Socket ID:", socket.id);
    socket.disconnect();
});

// Endpoint to initiate Socket.IO server
app.get("/initSocket", (req, res) => {
    // This will emit a message to all connected sockets when the endpoint is hit
    io.emit("init", { message: "Socket.IO server initiated1" });
    console.log('Socket.IO event emitted');
    res.json({ message: "Socket.IO server initiated" });
})



app.get("/", (req, res) => {
    return res.json({message:"hlo"});
    });

server.listen(4000, () => console.log(`Server Started at PORT:4000`));*/

app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);
app.use(bodyParser.json({ parameterLimit: 100000, limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    extended: true,
    parameterLimit: 100000,
    limit: "50mb",
  })
);

// app.use(
//   cors({
//     origin: "4444",
//   })
// );

app.use(routes);

app.listen(4444, () => {
  console.log("connected to port 4444");
});