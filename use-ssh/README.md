# Setup the SSH agent

This action allows to fetch private repositories.

See [action.yml](./action.yml) for the list of `inputs` and `outputs`.

## Example usage

```yaml
uses: agendrix/actions/use-ssh@master
with:
  ssh-key: ${{ secrets.SSH_KEY }}
```

Note: `actions/checkout` needs to be @v1 in order to fetch more than one commit in the history.
