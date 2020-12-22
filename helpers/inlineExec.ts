import { exec } from "@actions/exec";

/**
 * By default, await exec() returns the response number of the command.
 * This returns the stdout data instead.
 * @param commandLine The command to run
 */
export const inlineExec = async (commandLine: string) => {
  let stdoutData = "";
  await exec(commandLine, undefined, {
    listeners: {
      stdout: (data: Buffer) => {
        stdoutData += data.toString();
      },
    },
  });
  return stdoutData;
};
