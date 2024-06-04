const { LLCBot } = require("./chatbotV2");
const { LianeAPI } = require("fca-liane-utils");

const ai = new LianeAPI("bestgpt");

const bot = new LLCBot({
  username: "Test Bot",
});
bot.on("message", "message_reply", async (event) => {
  function isCommand(key) {
    return String(event.text)
      .toLowerCase()
      .startsWith("#" + String(key).toLowerCase());
  }
  if (event.text === "hello") {
    const i = await bot.sendMessage(`Hello there ${event.username}!`, event);
    console.log("Sent hi, ", i);
  }
  if (event.text.includes("bot")) {
    bot.animate(
      `Wow, hello ${event.username}! How can I assist you today?`,
      50,
      event,
    );
  }
  if (isCommand("ai")) {
    const question = event.text.slice(4).trim();
    const { raw } = await ai.request(question);
    bot.animate(raw, 50, event);
  }
  if (isCommand("uwu")) {
    bot.animate("UwU, thank you!", 50, event);
  }
});

bot.on("ws_open", () => {
  bot.addCommand("#", "ai", "Ask AI anything!");
  bot.addCommand("#", "uwu", "Sends an uwu message!");
});

bot.startListening().catch(console.error);
