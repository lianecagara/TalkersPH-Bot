const WebSocket = require("ws");
const axios = require("axios");

const defaultUrl = `https://talkersph.replit.app/`;

class ChatBot {
  #ws;
  #botName;
  #messageListener;
  #dataUrl;
  #token;

  constructor() {
    this.#ws = null;
    this.#botName = null;
    this.#messageListener = null;
    this.queue = [];
  }

  async init(botName, url) {
    try {
      this.#botName = botName;
      const i = (url || defaultUrl) + "/ws-url";
      const response = await axios.get(i);
      const data = response.data;
      this.#dataUrl = data.url;
      this.#connectWebSocket(data.url);
      console.log(`Connected to ${this.#dataUrl} as ${botName}`);
    } catch (error) {
      console.error(error.stack);
    }
  }

  #connectWebSocket(url) {
    this.#ws = new WebSocket(url);

    this.#ws.onopen = () => {
      this.#sendLogin(this.#botName);
    };

    this.#ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(data);
      if (data.type === "login_success") {
        this.#token = data.token;
      }
      if (data.type === "message_edit") {
        const messageBody = data.text;
        const sender = String(data.username).trim();
        const eventObject = {
          ...data,
          type: data.type,
          sender,
          body: messageBody,
          botName: this.#botName,
          replyTo: data.replyTo || null,
          messageID: data.messageID,
        };
        this.#handleMessage(eventObject);
      }

      if (data.type === "message" || data.type === "message_reply") {
        if (data.selfSend) {
          const { queue } = this;
          const target = queue[queue.length - 1] || {};
          if (typeof target?.resolve === "function") {
            target.resolve({
              ...data,
              sender: this.#botName,
              body: data.text,
            });
          }
          return;
        }
        const sender = String(data.username).trim();
        const messageBody = data.text;
        const eventObject = {
          ...data,
          type: data.type,
          sender,
          body: messageBody,
          botName: this.#botName,
          replyTo: data.replyTo || null,
        };
        this.#handleMessage(eventObject);
      }
    };

    this.#ws.onerror = (error) => {
      console.error("WebSocket error:", error.stack);
    };

    this.#ws.onclose = () => {
      console.warn("WebSocket connection closed, restarting");
      this.#connectWebSocket(this.#dataUrl);
    };
  }

  #sendLogin(username) {
    this.#ws.send(JSON.stringify({ type: "login", username }));
  }

  #handleMessage(event) {
    if (this.#messageListener) {
      this.#messageListener(event);
    }
  }

  listen(callback) {
    this.#messageListener = callback;
  }
  sendMessage(message, replyTo) {
    if (this.#ws && message?.trim() !== "") {
      const trimmedMessage = message?.trim();
      this.#ws.send(
        JSON.stringify({
          type: replyTo ? "message_reply" : "message",
          text: trimmedMessage,
          token: this.#token,
          isBot: true,
          ...(replyTo
            ? {
                replyTo: {
                  text: replyTo.body,
                  username: replyTo.sender,
                },
              }
            : {}),
        }),
      );
      console.log(`Sent response:`, {
        sender: this.#botName,
        body: trimmedMessage,
      });
      return new Promise(async (resolve) => {
        this.queue.push({ resolve, message });
      });
    }
  }
  editMessage(message, messageID) {
    this.#ws.send(
      JSON.stringify({
        text: message,
        type: "message_edit",
        messageID,
        token: this.#token,
      }),
    );
  }
}

module.exports = ChatBot;
