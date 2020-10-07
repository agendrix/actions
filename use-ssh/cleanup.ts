import * as core from "@actions/core";
import execAsync from "../helpers/execAsync";

async function run() {
  try {
    await execAsync("ssh-agent -k");
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
