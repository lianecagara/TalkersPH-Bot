const WebSocket = require("ws");
const express = require("express");
const LiaMongo = require("lia-mongo");
const http = require("http");

const PORT = process.env.PORT || 8080;

const client = new LiaMongo({
  uri: process.env.MONGO_URI,
  collection: "chat.chatThread",
});

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ noServer: true });

const users = new Map();

wss.on("connection", (socket) => {
  socket.on("message", (message) => {
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
  });

  socket.on("close", () => {
    handleDisconnect(socket);
  });
});

async function handleLogin(socket, { username }) {
  if (users.has(username)) {
    socket.send(
      JSON.stringify({ type: "error", message: "Username already taken" }),
    );
    return;
  }
  users.set(username, socket);
}

async function updateHistory(username, text) {
  let messages = await client.get("messages");
  if (!Array.isArray(messages)) {
    messages = [];
  }
  const info = {
    username,
    text,
    timestamp: Date.now(),
  };
  messages.push(info);
  await client.put("messages", messages);
}

async function handleMessage(socket, { text, username }) {
  console.log(`Received message from ${username}`, text);
  users.forEach((userSocket, userUsername) => {
    if (userSocket !== socket) {
      userSocket.send(JSON.stringify({ type: "message", username, text }));
    }
  });
  await updateHistory(username, text);

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

app.get("/api/history", async (req, res) => {
  try {
    const messages = await client.get("messages");
    res.json(messages);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

server.on("upgrade", (request, socket, head) => {
  const pathname = request.url;

  if (pathname === "/api/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
