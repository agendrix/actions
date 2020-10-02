#!/bin/sh
set -e

get_task_definition() {
  task_name=$1

  # Thoses keys are returned by the Amazon ECS DescribeTaskDefinition, but are not valid fields when registering a new task definition
  keys_to_omit=".compatibilities, .taskDefinitionArn, .requiresAttributes, .revision, .status"

  echo "$task_name"
  returned_task_definition=$(aws ecs describe-task-definition --task-definition "${task_name}" | jq .taskDefinition | jq "del($keys_to_omit)")
  if [ -z "${returned_task_definition}" ]; then
    echo "ERROR: aws ecs describe-task-definition returned a bad value."; exit 1
  fi
}

set_outputs() {
  should_deploy=$1
  task_definition=$2
  running_stable_task_definition=$3

  echo "::set-output name=should_deploy::$should_deploy"

  output_path="/tmp/task-definition.$INPUT_SERVICE.json"
  printf '%s\n' "$task_definition" > "$output_path"
  echo "::set-output name=path::$output_path"

  if [ -n "$running_stable_task_definition" ]; then
    stable_output_path="/tmp/task-definition.stable.json"
    printf '%s\n' "$running_stable_task_definition" > "$stable_output_path"
    echo "::set-output name=current_stable_task_definition_path::$stable_output_path"
  fi
}

container_definitions=$(sed "s+<IMAGE>+$INPUT_IMAGE+g;" "$INPUT_CONTAINER_DEFINITIONS_PATH")

if [ -f "$INPUT_SECRETS_PATH" ]; then
  echo "Appending secrets for service $INPUT_SERVICE"
  container_definitions=$(printf '%s\n' "$container_definitions" | jq --slurpfile secrets "$INPUT_SECRETS_PATH" '(.[] | .secrets) = $INPUT_SECRETS_PATH[]')
fi

get_task_definition `echo "${INPUT_CLUSTER}_${INPUT_SERVICE}" | tr - _`
latest_task_definition=$returned_task_definition
new_task_definition=$(printf '%s\n' "$latest_task_definition" | jq --argjson container_defs "$container_definitions" '.containerDefinitions = $container_defs')

if [ -n "$CURRENT_STABLE_TASKDEF_ARN" ]; then
  get_task_definition "$CURRENT_STABLE_TASKDEF_ARN"
  # Thoses keys are returned by the Amazon ECS DescribeTaskDefinition, but are not valid fields when registering a new task definition
  keys_to_omit=".compatibilities, .taskDefinitionArn, .requiresAttributes, .revision, .status"

  returned_task_definition=$(aws ecs describe-task-definition --task-definition "arn:aws:ecs:ca-central-1:268127068934:task-definition/dev_portal_nginx:62" --debug | jq .taskDefinition | jq "del($keys_to_omit)")
  if [ -z "${returned_task_definition}" ]; then
    echo "ERROR: aws ecs describe-task-definition returned a bad value."; exit 1
  fi

  current_tmp="$(mktemp)"; printf '%s\n' "$current_stable_taskdef" | jq -S . > "$current_tmp"
  new_tmp="$(mktemp)";     printf '%s\n' "$new_task_definition"    | jq -S . > "$new_tmp"

  if cmp -s "$current_tmp" "$new_tmp"; then
    echo "The task definition has not changed. Deployment will be skipped."
    set_outputs "false" "$latest_task_definition" "$current_stable_taskdef"
    exit 0
  else
    echo "::group::Diff between the current running task definition and the new one"
    echo "Current task definition:                                           New task definition diff:"
    diff -y -t --left-column "$current_tmp" "$new_tmp" || true # true prevents exit code 1
    echo "::endgroup::"

    set_outputs "true" "$new_task_definition" "$current_stable_taskdef"
    exit 0
  fi
fi

set_outputs "true" "$new_task_definition" ""
