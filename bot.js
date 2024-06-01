const Bot = require("./chatbot");
const { LianeAPI } = require("fca-liane-utils");
const bot = new Bot();
const prefix = "/";

bot.init("Jea", "http://localhost:8080").then(() => {
  bot.sendMessage("Connected ✅");
});

const jea = new LianeAPI("jea-mean", "lanceajiro");

bot.listen(async (event) => {
  console.log(event);
  if (event.body.startsWith("hi")) {
    bot.sendMessage(`Hello ${event.sender}!`);
  }
  if (!event.body.startsWith(prefix + "jea ")) {
    return;
  }
  const message = await jea.ask(`Sabi ni ${event.sender}: ${event.body}`);
  bot.sendMessage(`Replying to ${event.sender}:

${message}`);
});
