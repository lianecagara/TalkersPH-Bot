const Bot = require("./chatbot");
const { LianeAPI } = require("fca-liane-utils");
const bot = new Bot();
const prefix = "/";
const style = {
  color: "white",
  "font-weight": "bold",
  "background-color": "blue",
  padding: "1px 1px 1px",
  "border-radius": "1px",
};
const mappedStyle = Object.entries(style)
  .map(([key, value]) => `${key}: ${value}`)
  .join(" ");

bot.init(`Jea`, 'https://liasparklivechat.onrender.com').then(() => {
  //bot.sendMessage("Connected ✅");
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
