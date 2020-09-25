# Workflow dispatch

Trigger a workflow run with the workflow_dispatch event.

See [action.yml](./action.yml) for the list of `inputs` and `outputs`.

## Example usage

```yaml
steps:
  - uses: actions/checkout@v2
  - name: Trigger my workflow
    uses: agendrix/actions/workflow-dispatch@master
    id: trigger-workflow
    with:
      token: ${{ secrets.MY_PAC }}
      workflow: "my-workflow.yml"
      inputs: '{ "key": "value", "another_key": true }'
```
