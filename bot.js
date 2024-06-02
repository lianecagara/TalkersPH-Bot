const Bot = require("./chatbot");
const { LianeAPI } = require("fca-liane-utils");
const express = require("express");
const app = express();

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

bot.init(`Jea`, "https://liasparklivechat.onrender.com").then(() => {
  //bot.sendMessage("Connected ✅");
});

const jea = new LianeAPI("jea-mean", "lanceajiro");

bot.listen(async (event) => {
  console.log(event);
  if (event.body.startsWith("spam")) {
    const amount = parseInt(event.body.split(" ")[1]);
    let [, , ...message] = event.body.split(" ");
    message = message.join(" ");
    if (!message) {
      return bot.sendMessage("Missing message after amount.");
    }
    if (isNaN(amount) || amount > 20) {
      return bot.sendMessage("Invalid amount.");
    }
    for (let i = 0; i < amount; i++) {
      await new Promise((r) => setTimeout(r, 500));
      bot.sendMessage(i + 1 + ". " + message);
    }
  }
  if (event.body.startsWith("hi")) {
    bot.sendMessage(`Hello ${event.sender}!`, event);
  }
  if (!event.body.startsWith(prefix + "jea ")) {
    return;
  }
  const message = await jea.ask(`Sabi ni ${event.sender}: ${event.body}`);
  bot.sendMessage(
    `Replying to ${event.sender}:

${message}`,
    event,
  );
});
app.use(express.json());

app.post("/sendMessage", (req, res) => {
  res.send(`Done`);
  const {
    body: { text },
  } = req;
  bot.sendMessage(text);
});

app.listen(8080);
