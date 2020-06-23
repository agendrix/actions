const core = require("@actions/core");
const path = require("path");
const execAsync = require("../helpers/execAsync");

async function run() {
  try {
    process.env.SSH_KEY = core.getInput("ssh-key", { required: true });
    await execAsync(`sh ${path.join(__dirname, "./ssh.sh")}`);
  } catch (error) {
    core.setFailed(error);
  }
}

run();
