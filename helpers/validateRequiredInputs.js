const core = require("@actions/core");

/**
 * Validate that all required inputs were provided
 * If not, it will throw.
 * @param {string[]} requiredInputs
 */
async function validateRequiredInputs(requiredInputs) {
  for (const requiredInput of requiredInputs) {
    core.getInput(requiredInput, { required: true });
  }
}

module.exports = validateRequiredInputs;
