const WebSocket = require("ws");

class WebSocketBot {
  constructor(url, password) {
    this.url = url;
    this.password = password;
    this.ws = null;
    this.handlers = {};
    this.onOpenFunc = () => {};
    this.onCloseFunc = () => {};
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.ws = new WebSocket(this.url);

    this.ws.on("open", (...args) => {
      this.onOpenFunc(...args);
      this.login();
    });

    this.ws.on("message", (data) => {
      const message = JSON.parse(data);
      this.handleMessage(message);
    });

    this.ws.on("close", (...args) => {
      this.onCloseFunc(...args);
      console.log("WebSocket connection closed. Reconnecting...");
      this.reconnect();
    });
  }

  login() {
    this.send({
      type: "login",
      password: this.password,
    });
  }
  onOpen(callback) {
    this.onOpenFunc = callback;
  }
  onClose(callback) {
    this.onCloseFunc = callback;
  }

  handleMessage(message) {
    const { type, botSend } = message;
    if ((type === "message" || type === "message_reply") && !botSend) {
      console.log(`Ignoring ${type} because botSend is not true.`);
      return;
    }
    if (this.handlers[type]) {
      this.handlers[type].forEach((handler) => handler(message));
    } else {
      console.log(`Unhandled message type: ${type}`);
    }
  }

  sendMessage(message, extra = {}) {
    this.send({
      type: "message",
      body: message,
      ...extra,
    });
  }

  replyToMessage(message, replyMessageID, extra = {}) {
    this.send({
      type: "message_reply",
      body: message,
      messageReply: { messageID: replyMessageID },
      ...extra,
    });
  }

  reactToMessage(reaction, messageID, extra = {}) {
    this.send({
      type: "message_reaction",
      reaction,
      messageID,
      ...extra,
    });
  }

  send(payload) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      console.error("WebSocket not open.");
    }
  }

  on(...args) {
    const handler = args.pop(); // last argument is the handler function
    const types = args; // all other arguments arw event types

    types.forEach((type) => {
      if (!this.handlers[type]) {
        this.handlers[type] = [];
      }
      this.handlers[type].push(handler);
    });
  }

  reconnect() {
    setTimeout(() => {
      this.setupWebSocket();
    }, 2000); // try to reconnect every 2 second
  }
}

module.exports = WebSocketBot;
