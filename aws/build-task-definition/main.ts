import * as core from "@actions/core";
import * as path from "path";
import { execAsync, validateRequiredInputs } from "../../helpers";

async function run() {
  try {
    validateRequiredInputs(["cluster", "service", "container_definitions_path"]);

    const cluster = core.getInput("cluster", { required: true });
    const service = core.getInput("service", { required: true });
    process.env.CURRENT_STABLE_TASKDEF_ARN = await execAsync(
      `sh ${path.join(
        __dirname,
        "../helpers/get-running-task-definition.sh",
      )} --cluster "${cluster}" --service "${service}"`,
    );

    await execAsync(`sh ${path.join(__dirname, "./build-task-definition.sh")}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
