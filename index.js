const { exec } = require("child_process");

function runScript(scriptPath, key, botKey, callback) {
  const child = exec(`node ${scriptPath} ${key} ${botKey || "unregistered"}`, { stdio: "inherit" });

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
runScript("bot.js", "Hyunjin");
runScript("bot.js", "Chesca", "LianeAPI_Reworks");
runScript("bot.js", "Jea");
