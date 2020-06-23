#!/bin/sh
set -e

eval $(ssh-agent)
echo "${SSH_KEY}" | ssh-add -
echo "::set-env name=SSH_AUTH_SOCK::$SSH_AUTH_SOCK"
echo "::set-env name=SSH_AGENT_PID::$SSH_AGENT_PID"
