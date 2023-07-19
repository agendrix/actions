#!/bin/sh
set -e

if [ -z "$INPUT_FILE" ]; then
  file="$INPUT_PATH/Dockerfile"
else
  file="$INPUT_FILE"
fi

tagged_registry_image="$INPUT_ECR_REGISTRY/$INPUT_IMAGE:$INPUT_TAG"
latest_registry_image="$INPUT_ECR_REGISTRY/$INPUT_IMAGE:latest"

setup_soci() {
  echo "::group::Setting up soci snapshotter"
  wget https://github.com/awslabs/soci-snapshotter/releases/download/v0.3.0/soci-snapshotter-0.3.0-linux-amd64.tar.gz
  sudo tar -C /usr/local/bin -xvf soci-snapshotter-0.3.0-linux-amd64.tar.gz
  echo "::endgroup::"
}

setup_nerdctl() {
  echo "::group::Setting up nerdctl"
  wget "https://github.com/containerd/nerdctl/releases/download/v1.4.0/nerdctl-1.4.0-linux-amd64.tar.gz"
  sudo tar -C /usr/local/bin -xvf nerdctl-1.4.0-linux-amd64.tar.gz
  aws ecr get-login-password | sudo nerdctl login --username AWS --password-stdin "$INPUT_ECR_REGISTRY"
  echo "::group::Setting up nerdctl" 
}

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

latest_tag_available=$(aws ecr list-images --repository-name "$INPUT_IMAGE" | jq '.imageIds[] | select(.imageTag=="latest") | length > 0')
if [ "$latest_tag_available" = "true" ]; then
  # TODO: remove this code
  # echo "::group::Pulling \"$INPUT_IMAGE:latest\""
  # docker pull "$latest_registry_image"
  # docker tag "$latest_registry_image" "$INPUT_IMAGE:latest"
  # echo "::endgroup::"

  docker buildx create --use --name docker-container-builder
  echo "::group::Building new image from latest image cache"
  docker buildx build \
    --cache-to type=inline \
    --cache-from type=registry,ref="$latest_registry_image" \
    --output type=oci,dest=image.tar,name="$tagged_registry_image" \
    $INPUT_ARGS -f "$file" \
    "$INPUT_PATH";
  echo "::endgroup::"

  # compare_digest_with_latest
else
  echo "::group::Building new image"
  docker build \
    --tag "$tagged_registry_image" \
    $INPUT_ARGS -f "$file" \
    "$INPUT_PATH";
  echo "::endgroup::"
fi

echo "::group::Pushing new image to ECR"
sudo nerdctl load --input image.tar
sudo nerdctl image tag "$tagged_registry_image" "$latest_registry_image"
sudo nerdctl image tag "$tagged_registry_image" "$INPUT_IMAGE:latest"
sudo nerdctl push "$tagged_registry_image"
if [ "$INPUT_SKIP_LATEST_TAG_PUSH" != "true" ]; then
  docker push "$latest_registry_image"
fi
echo "::endgroup::"

if [ "$INPUT_CREATE_SOCI_INDEX" = "true" ]; then
  setup_soci
  echo "::group::Creating soci index"
    sudo soci create "$tagged_registry_image"
    PASSWORD=$(aws ecr get-login-password); sudo soci push --user AWS:$PASSWORD "$tagged_registry_image"
  echo "::endgroup::"
fi

set_outputs "$INPUT_IMAGE" "$INPUT_TAG"