import * as core from "@actions/core";
import * as path from "path";
import { execAsync } from "../helpers";

async function run() {
  try {
    process.env.SSH_KEY = core.getInput("ssh-key", { required: true });
    await execAsync(`sh ${path.join(__dirname, "./ssh.sh")}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
