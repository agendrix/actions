import * as core from "@actions/core";
import { exec } from "@actions/exec";

async function run() {
  try {
    const sshKey = core.getState("SSH_KEY");
    core.setSecret(sshKey);
    await exec(`echo ${sshKey} | ssh-add -d -`);
  } catch (error) {
    core.setFailed(`Action failed with error ${error}`);
  }
}

run();
