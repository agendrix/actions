import { exec } from "@actions/exec";

export async function execAsync(commandLine: string, args: string[] | undefined = undefined): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(commandLine, args, {
      listeners: {
        stdout: data => resolve(data.toString()),
        stderr: data => reject(data.toString()),
      },
    });
  });
}
