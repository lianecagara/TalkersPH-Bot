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
      if (data.type === "login_success") {
        this.#token = data.token;
      }
      if (data.type === "message" || data.type === "message_reply") {
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
    }
  }
}

module.exports = ChatBot;
