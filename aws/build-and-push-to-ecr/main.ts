import * as core from "@actions/core";
import * as path from "path";
import { execAsync, validateRequiredInputs } from "../../helpers";

async function run() {
  try {
    validateRequiredInputs(["ecr_registry", "image", "tag"]);

    await execAsync(`sh ${path.join(__dirname, "../build-and-push.sh")}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
