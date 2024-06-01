const { exec } = require("child_process");

function runScript(scriptPath, key) {
  const child = exec(`node ${scriptPath}`, { stdio: "inherit" });

  child.stdout.on("data", (data) => {
    console.log(`[ ${key} ] ${data}`);
  });

  child.stderr.on("data", (data) => {
    console.error(`[ ${key} ] ${data}`);
  });

  child.on("close", (code) => {
    console.log(`${scriptPath} exited with code ${code}`);
  });
}

runScript("bot.js", "BOT");
runScript("example_server.js", "SERVER");
