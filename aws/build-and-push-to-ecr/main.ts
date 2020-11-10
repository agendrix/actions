import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as path from "path";
import { validateRequiredInputs } from "../../helpers/validateRequiredInputs";

async function run() {
  try {
    validateRequiredInputs(["ecr_registry", "image", "tag"]);

    await exec(`sh ${path.join(__dirname, "../build-and-push.sh")}`);
  } catch (error) {
    core.setFailed(`Action failed with error ${error}`);
  }
}

run();
