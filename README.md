# Agendrix Actions for GitHub

<a href="https://github.com/agendrix/actions/actions"><img alt="status" src="https://github.com/agendrix/actions/workflows/build-test/badge.svg"></a>

This repo contains a set of reusable actions for GitHub Workflows.

## Available Actions

- [use-ssh](./use-ssh/README.md): Fetch private repositories
- [git-diff-check](./git-diff-check/README.md): Test for specific changes with git diff

## Developing locally

Install the dependencies

```bash
$ yarn install
```

When creating a new TypeScript action, make sure that all your associated scripts in `actions.yml` runs.(pre|main|post) point to `dist/<scriptName>.js`.

The script [`build-all.js`](./build-all.js) will then find the associated `.ts` files within your action folder (`<scriptName>.ts`).

When committing, we use a pre-commit hook to build the code.

### Useful Links

- [Metadata syntax for GitHub Actions](https://help.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions)
- [Creating a JavaScript action](https://help.github.com/en/actions/creating-actions/creating-a-javascript-action#commit-tag-and-push-your-action-to-github)

### Versioning

After testing you can create a git tag to reference the stable and latest action version.

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

---

Templated from https://github.com/actions/typescript-action.
