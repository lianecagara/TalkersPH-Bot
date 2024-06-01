const WebSocket = require("ws");
const http = require("http");

const PORT = process.env.PORT || 8080;

const server = http.createServer();

const wss = new WebSocket.Server({ server });

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const users = new Map();

wss.on("connection", (socket) => {
  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case "login":
          handleLogin(socket, data);
          break;
        case "message":
          handleMessage(socket, data);
          break;
        default:
          console.error("Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  socket.on("close", () => {
    handleDisconnect(socket);
  });
});

function handleLogin(socket, { username }) {
  if (users.has(username)) {
    socket.send(
      JSON.stringify({ type: "error", message: "Username already taken" })
    );
    return;
  }
  users.set(username, socket);
}

function handleMessage(socket, { text, username }) {
  console.log(`Received message from ${username}: ${text}`);
  users.forEach((userSocket, userUsername) => {
    if (userSocket !== socket) {
      userSocket.send(JSON.stringify({ type: "message", username, text }));
    }
  });

  console.log(`All ${users.size} users received the message.`);
}

function handleDisconnect(socket) {
  users.forEach((userSocket, username) => {
    if (userSocket === socket) {
      users.delete(username);
      console.log(`User ${username} disconnected.`);
    }
  });
}