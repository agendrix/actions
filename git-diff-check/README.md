# Git Diff Check

Test if git diff contains any of the listed diff.
This action will test if any of the files from the git diff contains one of the listed test strings.

See [action.yml](./action.yml) for the list of `inputs` and `outputs`.

## Example usage

```yaml
steps:
  - uses: actions/checkout@v2
    with:
      fetch-depth: 0
  - name: Test for changes
    uses: agendrix/actions/git-diff-check@master
    id: diffs
    with:
      before: ${{ github.event.before }}
      current: ${{ github.sha }}
      tests: |
        folder
        test-folder/sub-folder
        another-folder/a-file.js

  - run: echo "Contains changes = ${{ steps.diffs.outputs.contains_changes }}"
```

## Notes

- `fetch-depth: 0` on `actions/checkout@v2` is required in order to get all history for all branches and tags.
- If there is an error while comparing the two commits, this action will assumes there is changes.
