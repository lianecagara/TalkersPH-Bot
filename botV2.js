const { LLCBot } = require("./chatbotV2");

const bot = new LLCBot({
  username: "Test Bot",
});
bot.on("message", (event) => {
  if (event.text === "hello") {
    bot.sendMessage(`Hello there ${event.username}!`, event);
  }
  if (event.text.includes("bot")) {
    bot.animate(`Hello ${event.username}! How can I assist you today?`);
  }
});

bot.startListening().catch(console.error);
