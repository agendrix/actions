import * as core from "@actions/core";
import { exec } from "@actions/exec";

async function run() {
  try {
    await exec("ssh-agent -k");
  } catch (error) {
    core.setFailed(`Action failed with error ${error}`);
  }
}

run();
