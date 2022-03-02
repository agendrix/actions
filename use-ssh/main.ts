import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as path from "path";

async function run() {
  try {
    process.env.SSH_KEY = core.getInput("ssh-key", { required: true });
    core.setSecret(process.env.SSH_KEY);
    await exec(`sh ${path.join(__dirname, "../ssh.sh")}`);
  } catch (error) {
    core.setFailed(`Action failed with error ${error}`);
  }
}

run();
