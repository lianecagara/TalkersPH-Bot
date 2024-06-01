const Bot = require('./chatbot');

const bot = new Bot();

bot.init('Liane BOT');

bot.listen((event) => {
  console.log(event);
  if (event.body.startsWith('hi')) {
    bot.sendMessage(`Hello ${event.sender}!`);
  }
});