import * as core from "@actions/core";
import * as github from "@actions/github";

function parseInputs() {
  try {
    const inputs = core.getInput("inputs");
    return inputs ? JSON.parse(inputs) : null;
  } catch (_) {
    core.setFailed("Action failed. inputs is not a valid JSON string");
  }
}

async function run() {
  try {
    const { owner, repo: workflowRepo } = github.context.repo;
    const repo = core.getInput("repository") || workflowRepo;
    const workflowFileName = core.getInput("workflow", { required: true });
    const branch = core.getInput("branch") || "master";
    const token = core.getInput("token", { required: true });
    const octokit = github.getOctokit(token);
    const inputs = parseInputs();

    core.startGroup("Sending workflow_dispatch event");
    const workflows = await octokit.actions.listRepoWorkflows({ owner, repo });
    const workflow = workflows.data.workflows.find(
      (workflow) => workflow.path === `.github/workflows/${workflowFileName}`,
    );

    if (workflow) {
      const response = await octokit.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflow.id,
        ref: branch,
        inputs,
      });

      if (response.status !== 204) {
        core.setFailed(
          `Action failed. Workflow has not started correctly. Github responded with status ${response.status}`,
        );
      }
    } else {
      core.setFailed(`Action failed. Could not find a workflow with ${workflowFileName} in the repo named ${repo}`);
    }
  } catch (error) {
    core.setFailed(error.message);
  } finally {
    core.endGroup();
  }
}

run();
