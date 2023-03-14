#!/bin/sh
set -e

# Start ssh-agent
eval $(ssh-agent)

# Add key to ssh-agent
echo "${SSH_KEY}" | ssh-add -

EOF=$(dd if=/dev/urandom bs=15 count=1 status=none | base64)
echo "SSH_KEY=($SSH_KEY<<$EOF)" >> "$GITHUB_STATE"
echo "SSH_AUTH_SOCK=$SSH_AUTH_SOCK" >> $GITHUB_ENV
echo "SSH_AGENT_PID=$SSH_AGENT_PID" >> $GITHUB_ENV
