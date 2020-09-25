import * as core from "@actions/core";
import * as github from "@actions/github";
import { send } from "process";

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
    const ref = core.getInput("ref") || "main";
    const token = core.getInput("token", { required: true });
    const inputs = parseInputs();
    const octokit = github.getOctokit(token);

    const fetchWorkflow = async () => {
      core.startGroup("Fetching workflow_id for the requested workflow");
      const workflows = await octokit.actions.listRepoWorkflows({ owner, repo });
      const workflow = workflows.data.workflows.find(
        (workflow) => workflow.path === `.github/workflows/${workflowFileName}`,
      );
      core.endGroup();

      return workflow;
    };

    const sendWorkflowDispatchEvent = async (workflow_id: number) => {
      core.startGroup("Sending workflow dispatch event");
      const response = await octokit.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id,
        ref,
        inputs,
      });
      core.endGroup();

      return response;
    };

    const workflow = await fetchWorkflow();

    if (workflow) {
      const response = await sendWorkflowDispatchEvent(workflow.id);
      if (response.status !== 204) {
        throw new Error(
          `Action failed. Workflow has not started correctly. Github responded with status ${response.status}`,
        );
      }
    } else {
      throw new Error(
        `Action failed. Could not find a workflow with ${workflowFileName} in the repo named ${repo} owned by ${owner}`,
      );
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
