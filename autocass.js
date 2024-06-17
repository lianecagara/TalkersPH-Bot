const WebSocket = require("ws");
const eventsMap = new Map();
const threadsMap = new Map();

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
      console.log("WebSocket connection closed. Reconnecting..."); // lol reconnect
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
      messageReply: replyMessageID ? { messageID: replyMessageID } : null,
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
    }, 2000); // try to reconnect every 2 second so the bot wont die asf
  }
}
let bot = null;

module.exports = {
  config: {
    name: "autocass",
    version: "1.0.0",
    role: 0,
    author: "Lia?",
    shortDescription: {
      en: "Connect to cassidy api.",
    },
    longDescription: {
      en: "Connect to cassidy api.",
    },
    category: "API",
    guide: {
      en: "{pn}",
    },
  },
  onLoad({ api }) {
    bot = new WebSocketBot("wss://cassidy.onrender.com/ws");
    bot.on("message", "message_reply", (event) => {
      const threadID = threadsMap.get(event.messageID);
      if (event.messageReply) {
        api.sendMessage(
          event.body,
          threadID,
          (_, info) => {
            eventsMap.set(info.messageID, { ...event, info });
          },
          event.messageID,
        );
      } else {
        api.sendMessage(event.body, threadID, (_, info) => {
          eventsMap.set(info.messageID, {
            ...event,
            info,
          });
        });
      }
    });
    bot.on("message_edit", (event) => {
      let currentEvent = null;
      eventsMap.forEach((value, key) => {
        if (value.messageID === event.messageID) {
          currentEvent = value;
        }
      });
      if (currentEvent && currentEvent.info) {
        api.editMessage(event.body, currentEvent.info.messageID);
      }
    });
  },
  onStart() {},
  async onChat({ event }) {
    let i = event.body.startsWith("!");
    switch (event.type) {
      case "message":
        if (i) {
          threadsMap.set(event.messageID, event.threadID);
          bot.sendMessage(event.body, {
            senderID: event.senderID,
            messageID: event.messageID,
          });
        }
        break;
      case "message_reply":
        if (i) {
          threadsMap.set(event.messageID, event.threadID);
          const currentEvent =
            eventsMap.get(event.messageReply.messageID) ?? {};
          bot.replyToMessage(event.body, currentEvent.messageID, {
            senderID: event.senderID,
            messageID: event.messageID,
          });
        }
        break;
      case "message_reaction":
        if (true) {
          const currentEvent2 = eventsMap.get(event.messageID) ?? {};
          if (currentEvent2.messageID) {
            bot.reactToMessage(event.reaction, currentEvent2.messageID);
          }
        }
    }
  },
};
