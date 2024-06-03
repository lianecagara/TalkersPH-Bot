const Bot = require("./chatbot");
const { LianeAPI } = require("fca-liane-utils");
const express = require("express");
const app = express();
const botKey = process.argv[2];
const botUser = process.argv[3] || "unregistered";

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

bot.init(botKey + " 🇵🇭", "https://liasparklivechat.onrender.com").then(() => {
  //bot.sendMessage("Connected ✅");
});

const jea = new LianeAPI(String(botKey).toLowerCase(), botUser);

bot.listen(async (event) => {
  //console.log(event);
  if (event.type === "message_edit") {
    //bot.sendMessage(`Adik mo sa pag edit ha!`, event);
    return;
  }
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
  /*if (event.body.includes("love")) {
    bot.sendMessage(`I love you ${event.sender}!`, event);
  }*/
  if (
    !event.body.includes(botKey) &&
    event.replyTo?.username !== event.botName &&
    !event.body.includes("@everyone")
  ) {
    return;
  }
  const i = await bot.sendMessage(`Loading...`, event);
  const { raw: message } = await jea.request(
    `Hi ako si ${event.sender}, ${event.body}`,
  );
  bot.editMessage(`${message}`, i.messageID);
});
app.use(express.json());

app.post("/sendMessage", (req, res) => {
  res.send(`Done`);
  const {
    body: { text },
  } = req;
  bot.sendMessage(text);
});
function generatePort() {
  return Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024;
}
function randomName() {
  const names = [
    "Jea",
    "Vedar",
    "Cassidy",
    "James",
    "NTKhang03",
    "Elon Musk",
    "Liana",
    "Bruh",
  ];
  return names[Math.floor(Math.random() * names.length)];
}
const port = generatePort();
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
