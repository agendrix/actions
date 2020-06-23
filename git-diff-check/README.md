# Git Diff Check

Test if git diff contains any of the listed diff.

See [action.yml](./action.yml) for the list of `inputs` and `outputs`.

## Example usage

```yaml
steps:
  - uses: actions/checkout@v1
  - uses: agendrix/actions/git-diff-check@master
    id: diffs
    with:
      before: ${{ github.event.before }}
      current: ${{ github.sha }}
      tests: |
        .storybook
        app/frontend/application-react
        documentation

  - run: echo "Contains changes = ${{ steps.diffs.outputs.contains_changes }}"
```

Note: `actions/checkout` needs to be @v1 in order to fetch more than one commit in the history.
