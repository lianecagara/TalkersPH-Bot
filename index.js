const { exec } = require("child_process");

function runScript(scriptPath, key, callback) {
  const child = exec(`node ${scriptPath}`, { stdio: "inherit" });

  child.stdout.on("data", (data) => {
    console.log(`[ ${key} ] ${data}`);
  });

  child.stderr.on("data", (data) => {
    console.error(`[ ${key} ] ${data}`);
  });

  child.on("close", (code) => {
    console.log(`${scriptPath} exited with code ${code}`);
    if (callback) callback();
  });
}
runScript("bot.js", "BOT");
