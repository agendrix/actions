#!/bin/sh
set -e

if [ -z "$INPUT_FILE" ]; then
  file="$INPUT_PATH/Dockerfile"
else
  file="$INPUT_FILE"
fi

tagged_registry_image="$INPUT_ECR_REGISTRY/$INPUT_IMAGE:$INPUT_TAG"
latest_registry_image="$INPUT_ECR_REGISTRY/$INPUT_IMAGE:latest"

get_tag_version_from_latest() {
  # Try to find on ECR a tag version with the same image as :latest
  latest_tag_version=$(
    aws ecr describe-images --repository-name "$INPUT_IMAGE" --image-ids imageTag=latest \
      | jq '.imageDetails[0].imageTags' \
      | jq -r 'del(.[] | select(. == "latest"))[0]'
  )
}

set_outputs() {
  image=$1
  version=$2
  {
    echo "image_uri=$INPUT_ECR_REGISTRY/$image:$version"
    echo "image=$image:$version"
    echo "tag=$version"
  } >> "$GITHUB_OUTPUT"
}

compare_digest_with_latest() {
  # Compare the digests. If they are the same, check if a tag version already exists on ECR with that image, and return this one.
  latest_image_digest=$(docker inspect --format='{{.RootFS}}' "$latest_registry_image")
  new_image_digest=$(docker inspect --format='{{.RootFS}}' "$tagged_registry_image")

  if [ "$new_image_digest" = "$latest_image_digest" ]; then
    get_tag_version_from_latest
    if [ -n "$latest_tag_version" ]; then
      echo "The new image ($INPUT_IMAGE:$INPUT_TAG) is the same as $INPUT_IMAGE:latest ($latest_tag_version)."
      echo "Skipping push to ECR."

      docker tag "$latest_registry_image" "$INPUT_ECR_REGISTRY/$INPUT_IMAGE:$latest_tag_version"
      docker tag "$latest_registry_image" "$INPUT_IMAGE:$latest_tag_version"
      set_outputs "$INPUT_IMAGE" "$latest_tag_version"
      exit 0
    fi
  fi
}

echo "::group::Building new image using latest image cache"
docker buildx build \
  --cache-to type=inline \
  --cache-from type=registry,ref="$latest_registry_image" \
  --output type=image,oci-mediatypes=true,compression=zstd,compression-level=3,force-compression=true,name=$tagged_registry_image,push=true \
  $INPUT_ARGS -f "$file" \
  "$INPUT_PATH";
echo "::endgroup::"

# compare_digest_with_latest

echo "::group::Pushing new image to ECR"
# docker tag "$tagged_registry_image" "$latest_registry_image"
# docker tag "$tagged_registry_image" "$INPUT_IMAGE:latest"
# docker push "$tagged_registry_image"
if [ "$INPUT_SKIP_LATEST_TAG_PUSH" != "true" ]; then
  docker push "$latest_registry_image"
fi
echo "::endgroup::"

set_outputs "$INPUT_IMAGE" "$INPUT_TAG"
