const Y = require("./7");

const bot = new Y("wss://cassidy.onrender.com/ws");

bot.on("message", "message_reply", "message_edit", console.log);

bot.onOpen(() => {
  bot.sendMessage("!catfact");
});
