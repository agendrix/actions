import * as core from "@actions/core";
import { exec } from "@actions/exec";
import { inlineExec } from "../../helpers/inlineExec";
import { ECRImagesDetails } from "./aws";

const ecrRegistry = core.getInput("ecr_registry", { required: true });
const image = core.getInput("image", { required: true });
const tag = core.getInput("tag", { required: true });
const args = core.getInput("args");
const path = core.getInput("path");
const file = core.getInput("file") || `${path}/Dockerfile`;

const taggedRegistryImage = `${ecrRegistry}/${image}:${tag}`;
const latestRegistryImage = `${ecrRegistry}/${image}:latest`;

async function getLatestImageDetailsFromECR() {
  try {
    const imagesDetails: ECRImagesDetails = JSON.parse(
      await inlineExec(`aws ecr describe-images --repository-name "${image}" --image-ids imageTag=latest`),
    );
    return imagesDetails.imageDetails[0];
  } catch (error) {
    core.info(`Unable to find latest image tag.\nError is: ${error}`);
    core.info("A new latest tag will be uploaded.");
    return null;
  }
}

function setOutputs(tagVersion: string) {
  core.setOutput("image_uri", `${ecrRegistry}/${image}:${tagVersion}`);
  core.setOutput("image", `${image}:${tagVersion}`);
  core.setOutput("tag", tagVersion);
}

async function run() {
  try {
    core.startGroup("Fetch latest image");
    const latestECRImage = await getLatestImageDetailsFromECR();
    core.endGroup();

    let cacheFrom = "";
    if (latestECRImage) {
      cacheFrom = `--build-arg BUILDKIT_INLINE_CACHE=1 --cache-from "${latestRegistryImage}"`;
    }

    await core.group(`Building '${image}:${tag}' image`, async () => {
      await exec(`docker build ${cacheFrom} \
        --tag "${image}:latest" \
        --tag "${taggedRegistryImage}" \
        --tag "${latestRegistryImage}" \
        ${args} -f "${file}" \
        "${path}"`);
    });

    let finalMessage: string;
    let outputTag: string;

    core.startGroup("Pushing new image to ECR");
    await exec(`docker push "${latestRegistryImage}"`);

    // Fetch the new latest version to see if its digest has changed
    const newLatestECRImage = await getLatestImageDetailsFromECR();
    if (!newLatestECRImage) throw new Error(`No image with tag 'latest' found after pushing '${image}:latest' to ECR.`);
    const latestRefTag = newLatestECRImage.imageTags.find((tag) => tag !== "latest");

    if (newLatestECRImage.imageDigest !== latestECRImage?.imageDigest || !latestRefTag) {
      await exec(`docker push "${taggedRegistryImage}"`);
      finalMessage = `The digest of '${image}:latest' has changed.\nA new tag version has been pushed: ${image}:${tag}.`;
      outputTag = tag;
    } else {
      finalMessage = `Local tag '${image}:${tag}' has the same digest as remote '${image}:${latestRefTag}' (latest).\nTag '${latestRefTag}' will be used.`;
      outputTag = latestRefTag;
    }
    core.endGroup();

    core.info(finalMessage);
    setOutputs(outputTag);
  } catch (error) {
    core.setFailed(`Action failed with error ${error}`);
  }
}

run();
