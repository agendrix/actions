import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as path from "path";
import { inlineExec } from "../../helpers/inlineExec";
import { validateRequiredInputs } from "../../helpers/validateRequiredInputs";

async function run() {
  try {
    validateRequiredInputs(["cluster", "service", "container_definitions_path"]);

    const cluster = core.getInput("cluster", { required: true });
    const service = core.getInput("service", { required: true });
    const getRunningTaskDefinitionScript = path.join(__dirname, "../../helpers/get-running-task-definition.sh");

    const stableTaskDefArn = await inlineExec(`
      sh ${getRunningTaskDefinitionScript} --cluster "${cluster}" --service "${service}"
    `);

    process.env.CURRENT_STABLE_TASKDEF_ARN = stableTaskDefArn;
    await exec(`sh ${path.join(__dirname, "../build-task-definition.sh")}`);
  } catch (error) {
    core.setFailed(`Action failed with error ${error}`);
  }
}

run();
