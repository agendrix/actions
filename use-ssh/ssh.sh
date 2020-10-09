#!/bin/sh
set -e

eval $(ssh-agent)
echo "${SSH_KEY}" | ssh-add -
echo "SSH_AUTH_SOCK=$SSH_AUTH_SOCK" >> $GITHUB_ENV
echo "SSH_AGENT_PID=$SSH_AGENT_PID" >> $GITHUB_ENV
