const axios = require("axios");

const message = process.argv.slice(2).join(" ");

axios.post("http://localhost:8080/sendMessage", {
  text: message,
});
