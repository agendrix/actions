const core = require("@actions/core");
const path = require("path");
const execAsync = require("../../helpers/execAsync");
const validateRequiredInputs = require("../../helpers/validateRequiredInputs");

async function run() {
  try {
    validateRequiredInputs(["ecr_registry", "image", "tag"]);
    await execAsync(`sh ${path.join(__dirname, "./build-and-push.sh")}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
