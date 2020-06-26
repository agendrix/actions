const core = require("@actions/core");
const execAsync = require("../helpers/execAsync");

async function run() {
  try {
    await execAsync("ssh-agent -k");
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
