const exec = require("@actions/exec");

/**
 * @param {string} commandLine
 * @param {string[]?} args
 * @returns {Promise<string>}
 */
async function asyncExec(commandLine, args = undefined) {
  return new Promise((resolve, reject) => {
    exec.exec(commandLine, args, {
      listeners: {
        stdout: (data) => resolve(data.toString()),
        stderr: (data) => reject(data.toString()),
      },
    });
  });
}

module.exports = asyncExec;
