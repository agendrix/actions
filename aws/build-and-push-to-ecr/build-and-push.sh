#!/bin/sh
set -e

if [ -z "$INPUT_FILE" ]; then
  file="$INPUT_PATH/Dockerfile"
else
  file="$INPUT_FILE"
fi

get_tag_version_from_latest() {
  # Try to find on ECR a tag version with the same image as :latest
  latest_tag_version=$(
    aws ecr describe-images --repository-name "$INPUT_IMAGE" --image-ids imageTag=latest \
      | jq '.imageDetails[0].imageTags' \
      | jq -r 'del(.[] | select(. == "latest"))[0]'
  )
}

compare_digest_with_latest() {
  # Compare the digests. If they are the same, check if a tag version already exists on ECR with that image, and return this one.
  latest_image_digest=$(docker inspect --format='{{.RootFS}}' "$INPUT_ECR_REGISTRY/$INPUT_IMAGE:latest")
  new_image_digest=$(docker inspect --format='{{.RootFS}}' "$INPUT_ECR_REGISTRY/$INPUT_IMAGE:$INPUT_TAG")

  if [ "$new_image_digest" = "$latest_image_digest" ]; then
    get_tag_version_from_latest
    if [ -n "$latest_tag_version" ]; then
      echo "The new image ($INPUT_IMAGE:$INPUT_TAG) is the same as $INPUT_IMAGE:latest ($latest_tag_version)."
      echo "Skipping push to ECR."

      docker tag "$INPUT_ECR_REGISTRY/$INPUT_IMAGE:latest" "$INPUT_ECR_REGISTRY/$INPUT_IMAGE:$latest_tag_version"
      docker tag "$INPUT_ECR_REGISTRY/$INPUT_IMAGE:latest" "$INPUT_IMAGE:$latest_tag_version"
      set_outputs "$INPUT_IMAGE" "$latest_tag_version"
      exit 0
    fi
  fi
}

verify_if_image_repo_is_empty() {
  image_repo_is_empty=$(aws ecr list-images --repository-name "$INPUT_IMAGE" | jq '.imageIds | length == 0')
  exit_status=$?
  if [ $exit_status != 0 ]; then
    exit 1
  fi
}

set_outputs() {
  image=$1
  version=$2

  echo "::set-output name=image_uri::$INPUT_ECR_REGISTRY/$image:$version"
  echo "::set-output name=image::$image:$version"
  echo "::set-output name=tag::$version"
}

verify_if_image_repo_is_empty
if [ "$image_repo_is_empty" = "false" ]; then
  echo "::group::Pulling \"$INPUT_IMAGE:latest\""
  docker pull "$INPUT_ECR_REGISTRY/$INPUT_IMAGE:latest"
  docker tag "$INPUT_ECR_REGISTRY/$INPUT_IMAGE:latest" "$INPUT_IMAGE:latest"
  echo "::endgroup::"
fi

echo "::group::Building new image"
docker build \
  --build-arg BUILDKIT_INLINE_CACHE=1 --cache-from "$INPUT_ECR_REGISTRY/$INPUT_IMAGE:latest" \
  --tag "$INPUT_ECR_REGISTRY/$INPUT_IMAGE:$INPUT_TAG" \
  $INPUT_ARGS -f "$file" \
  "$INPUT_PATH";
echo "::endgroup::"

if [ "$image_repo_is_empty" = "false" ]; then
  compare_digest_with_latest
fi

echo "::group::Pushing new image to ECR"
docker tag "$INPUT_ECR_REGISTRY/$INPUT_IMAGE:$INPUT_TAG" "$INPUT_ECR_REGISTRY/$INPUT_IMAGE:latest"
docker tag "$INPUT_ECR_REGISTRY/$INPUT_IMAGE:$INPUT_TAG" "$INPUT_IMAGE:latest"
docker push "$INPUT_ECR_REGISTRY/$INPUT_IMAGE:$INPUT_TAG"
docker push "$INPUT_ECR_REGISTRY/$INPUT_IMAGE:latest"
echo "::endgroup::"

set_outputs "$INPUT_IMAGE" "$INPUT_TAG"
