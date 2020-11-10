import * as core from "@actions/core";
import * as path from "path";
import { execAsync } from "../helpers/execAsync";

async function run() {
  try {
    process.env.SSH_KEY = core.getInput("ssh-key", { required: true });
    console.log("Before await");
    await execAsync(`sh ${path.join(__dirname, "../ssh.sh")}`);
    console.log("After await");
  } catch (error) {
    console.log("Catched error");
    core.setFailed(`Action failed with error ${error}`);
  }
}

run();
