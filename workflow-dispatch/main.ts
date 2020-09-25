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
    const { owner: workflowOwner, repo: workflowRepo } = github.context.repo;
    const owner = core.getInput("owner") || workflowOwner;
    const repo = core.getInput("repository") || workflowRepo;
    const workflowFileName = core.getInput("workflow", { required: true });
    const ref = core.getInput("ref") || "master";
    const token = core.getInput("token", { required: true });
    const inputs = parseInputs();

    core.startGroup("Fetching workflow_id for the requested workflow");
    const octokit = github.getOctokit(token);
    const workflows = await octokit.actions.listRepoWorkflows({ owner, repo });
    const workflow = workflows.data.workflows.find(
      (workflow) => workflow.path === `.github/workflows/${workflowFileName}`,
    );
    core.endGroup();

    if (workflow) {
      core.startGroup("Sending workflow dispatch event");
      const response = await octokit.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflow.id,
        ref,
        inputs,
      });

      if (response.status !== 204) {
        core.setFailed(
          `Action failed. Workflow has not started correctly. Github responded with status ${response.status}`,
        );
      }
    } else {
      core.setFailed(
        `Action failed. Could not find a workflow with ${workflowFileName} in the repo named ${repo} owned by ${owner}`,
      );
    }
  } catch (error) {
    core.setFailed(error.message);
  } finally {
    core.endGroup();
  }
}

run();
