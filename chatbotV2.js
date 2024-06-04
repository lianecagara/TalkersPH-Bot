const WebSocket = require("ws");
const axios = require("axios");

const defaultUrl = `https://liasparklivechat.onrender.com`;

class LLCBot {
  #onEvent;
  constructor({ username, url = defaultUrl, token }) {
    this.ws = null;
    this.botName = username;
    this.username = username;
    this.#onEvent = async function () {};
    this.url = url;
    this.token = token ?? null;
    this.onFuncs = {};
    this.queue = [];
    this.onlineUsers = [];
  }

  async startListening(callback) {
    let { token, username, url } = this;
    console.log("Listening started!");
    if (!token) {
      try {
        token = await this.makeToken(username);
        this.token = token;
      } catch (error) {
        console.log(`Failed Getting token:`, error.message);
        return;
      }
    }
    const {
      data: { url: wsUrl },
    } = await axios.get(`${url}/ws-url`);
    this.ws = new WebSocket(wsUrl);
    const { ws } = this;

    ws.onopen = (i) => {
      if (typeof this.onFuncs.ws_open == "function") {
        this.onFuncs.ws_open(i);
      }
      this.wsSend({
        type: "presence",
      });
      console.log(`Connected to ${wsUrl} as ${username}`);
    };

    ws.onmessage = (info) => this.handleListen(info);
    ws.onclose = () => {
      if (typeof this.onFuncs.ws_close == "function") {
        this.onFuncs.ws_close();
      }
      console.log(`Server disconnected, restarting connection.`);
      this.startListening(callback);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error.message);
    };

    this.#onEvent = typeof callback === "function" ? callback : async () => {};
  }

  async makeToken(username) {
    console.log(`Getting token for ${username}...`);
    const res = await axios.get(`${this.url}/api/request_access_token`, {
      params: { username },
    });
    const { token, type, message } = res.data;
    if (type === "fail") {
      throw new Error(message);
    } else if (type === "success") {
      console.log(`Got token ${token} for username ${username}.`);
      return token;
    }
  }

  async handleListen(info) {
    const event = JSON.parse(info.data);
    if (event.type === "login_failure") {
      console.log(`Failed to login as ${this.botName}`);
      process.exit();
    }
    if (event.type === "online_users") {
      this.onlineUsers = event.users;
    }
    if (event.selfSend) {
      const resolve = this.queue[this.queue.length - 1];
      if (resolve) {
        resolve(event);
        this.queue.pop();
      }
      return;
    }
    console.log(event);
    const onFunc = this.onFuncs[event.type];
    if (typeof onFunc === "function") {
      onFunc(event);
    }
    this.#onEvent(event);
  }

  on(...args) {
    const [callback, ...types] = args.reverse();
    for (const type of types) {
      this.onFuncs[type] = callback;
    }
  }

  onEvent(callback) {
    this.#onEvent = callback;
  }

  sendMessage(text, replyTo, isNotBot) {
    this.wsSend({
      type: replyTo ? "message_reply" : "message",
      text,
      replyTo,
      isBot: !!isNotBot,
    });
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  editMessage(text, messageID) {
    this.wsSend({
      type: "message_edit",
      text,
      messageID,
    });
  }
  async animate(text, interval, replyTo) {
    interval ??= 50;
    let resultText = "";
    const info = await this.sendMessage("", replyTo);
    for (const char of String(text).split("")) {
      await new Promise((i) => setTimeout(i, interval));
      resultText += char;
      this.editMessage(resultText, info.messageID);
    }
    return info;
  }
  async addCommands(prefix, commands) {
    try {
      const response = await axios.post(
        `${this.url}/api/commands/${this.token}`,
        {
          action: "add",
          commands,
          prefix,
        },
      );
      console.log(response.data.message);
    } catch (error) {
      console.error("Failed to add command:", error.message);
    }
  }

  async addCommand(prefix, commandName, description = "") {
    try {
      const response = await axios.post(
        `${this.url}/api/commands/${this.token}`,
        {
          action: "add",
          commands: [{ name: commandName, description }],
          prefix,
        },
      );
      console.log(response.data.message);
    } catch (error) {
      console.error("Failed to add command:", error.message);
    }
  }

  async deleteCommand(prefix, commandName) {
    try {
      const response = await axios.post(
        `${this.url}/api/commands/${this.token}`,
        {
          action: "delete",
          commands: [{ name: commandName }],
          prefix,
        },
      );
      console.log(response.data.message);
    } catch (error) {
      console.error("Failed to delete command:", error.message);
    }
  }

  async getCommandPrefixes() {
    try {
      const response = await axios.get(`${this.url}/api/prefixes`);
      return response.data;
    } catch (error) {
      console.error("Failed to get command prefixes:", error.message);
      return [];
    }
  }

  async sendSlashCommand(commandName, args = []) {
    try {
      const response = await axios.post(
        `${this.url}/api/commands/${this.token}/slash`,
        {
          command: commandName,
          args,
        },
      );
      console.log(response.data.message);
    } catch (error) {
      console.error("Failed to send slash command:", error.message);
    }
  }

  async sendCommandCheck(commandName) {
    this.wsSend({
      type: "command_check",
      commandName,
    });
  }

  isReady() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  wsSend(data) {
    if (!this.isReady()) {
      throw new Error("Connection not ready!");
    }
    this.ws?.send(
      JSON.stringify({
        ...data,
        accessToken: this.token,
        token: this.token,
        isOfficialBot: true,
      }),
    );
  }

  setBaseURL(url) {
    this.url = url;
    console.log(`Base URL set to ${url}`);
  }
}
module.exports = { LLCBot };
