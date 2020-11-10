import * as core from "@actions/core";
import { exec } from "@actions/exec";

function setOutput(message: string, containsChanges: boolean) {
  core.info(message);
  core.setOutput("contains_changes", containsChanges ? "true" : "false");
}

async function run() {
  try {
    const before = core.getInput("before", { required: true });
    const current = core.getInput("current", { required: true });
    const tests = core.getInput("tests", { required: true }).split(/\r?\n| /);

    let diffs = "";
    try {
      core.startGroup("Current diffs");
      await exec(`git diff --name-only --diff-filter=AM "${before}" "${current}"`, undefined, {
        listeners: {
          stdout: (data: Buffer) => {
            diffs += data.toString();
          },
        },
      });
    } catch (_) {
      core.endGroup();
      return setOutput("Error comparing commits. Assuming changes.", true);
    } finally {
      core.endGroup();
    }

    core.startGroup("Files and folders to test");
    core.info(tests.join("\n"));
    core.endGroup();

    const diffFiles = diffs.split("\n");
    for (const test of tests) {
      for (const file of diffFiles) {
        if (file.includes(test)) {
          return setOutput(`Found match for "${test}" with "${file}".`, true);
        }
      }
    }
    return setOutput("No match found.", false);
  } catch (error) {
    core.setFailed(`Action failed with error ${error}`);
  }
}

run();
