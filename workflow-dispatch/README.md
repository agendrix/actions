# Workflow dispatch

Trigger a workflow run with the workflow_dispatch event.

See [action.yml](./action.yml) for the list of `inputs`.

## Example usage

```yaml
steps:
  - uses: actions/checkout@v2
  - name: Trigger my workflow
    uses: agendrix/actions/workflow-dispatch@master
    with:
      token: ${{ secrets.GITHUB_PERSONAL_ACCESS_TOKEN }}
      workflow: "my-workflow.yml"
      inputs: '{ "key": "value", "another_key": true }'
```
