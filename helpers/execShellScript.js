const core = require("@actions/core");
const execAsync = require("./execAsync");

/**
 * Simple wrapper to exec shell scripts directly
 * @param {string} script
 * @param {string?} using
 */
async function execShellScript(script, using = "sh") {
  try {
    await execAsync(`${using} ${script}`);
  } catch (error) {
    core.setFailed(error);
  }
}

module.exports = execShellScript;
