const core = require("@actions/core");
const execAsync = require("../helpers/execAsync");

/**
 * @param {string} message
 * @param {boolean} containsChanges
 */
function setOutput(message, containsChanges) {
  core.info(message);
  core.setOutput("contains_changes", containsChanges ? "true" : "false");
}

async function run() {
  try {
    const before = core.getInput("before", { required: true });
    const current = core.getInput("current", { required: true });
    const tests = core.getInput("tests", { required: true }).split(/\r?\n| /);

    core.startGroup("Current diffs");
    const diffs = await execAsync(`git diff --name-only --diff-filter=AM ${before} ${current}`);
    core.endGroup();

    core.startGroup("Files and folders to test");
    core.info(tests.join("\n"));
    core.endGroup();

    for (const test of tests) {
      if (diffs.includes(test)) {
        return setOutput(`Found match for "${test}".`, true);
      }
    }
    return setOutput("No match found.", false);
  } catch (error) {
    core.setFailed(error);
  }
}

run();
