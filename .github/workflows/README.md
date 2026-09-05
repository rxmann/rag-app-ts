# GitHub Actions Notes

## What is GitHub Actions?

GitHub Actions is a CI/CD platform built into GitHub that automates software workflows. It lets you run scripts (lint, test, build, deploy) in response to events like pushing code or creating a pull request.

Workflows are defined in YAML files under `.github/workflows/`.

## Where is it Used?

- **CI (Continuous Integration):** Run tests and lint on every push/PR
- **CD (Continuous Deployment):** Deploy to production after merge to main
- **Automation:** Schedule tasks, label issues, release packages
- **Code Quality:** Type checking, formatting, security scans

## Basic Example

```yaml
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm test
```

This workflow runs on every push, checks out the code, installs dependencies, and runs tests.

## Key Terminologies

### Workflow

A YAML file in `.github/workflows/` defining an automated process. One repository can have multiple workflows.

### Trigger (`on`)

The event that starts a workflow. Common triggers:

| Trigger             | Description                            |
| ------------------- | -------------------------------------- |
| `push`              | Code pushed to a branch                |
| `pull_request`      | PR opened or updated                   |
| `workflow_dispatch` | Manual trigger from UI                 |
| `schedule`          | Cron-based (e.g., `cron: '0 0 * * *'`) |

Example with branches:

```yaml
on:
  push:
    branches: [main, master]
```

### Job

A group of steps running on the same runner. Multiple jobs run in parallel by default.

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]
  test:
    runs-on: ubuntu-latest
    steps: [...]
```

### Step

An individual task within a job. Can run a shell command or use a pre-built action.

```yaml
steps:
  - name: Install deps
    run: npm install
  - uses: actions/checkout@v4
```

### Runner

The virtual machine that executes jobs. Options: `ubuntu-latest`, `windows-latest`, `macos-latest`.

### Actions

Reusable packages that perform common tasks. Referenced with `uses`.

Common actions:

- `actions/checkout@v4` - Check out repository code
- `actions/setup-node@v4` - Set up Node.js
- `actions/setup-python@v5` - Set up Python

## Environment Variables

```yaml
env:
  NODE_ENV: production
steps:
  - run: echo $NODE_ENV
```

## Secrets

Sensitive data stored in repository settings, accessed via `${{ secrets.NAME }}`.

```yaml
steps:
  - run: echo ${{ secrets.API_KEY }}
```

## Caching

Speed up workflows by caching dependencies:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
```

## Useful Commands

```yaml
# Conditional steps
- if: github.ref == 'refs/heads/main'
  run: echo "Only on main"

# Matrix builds
strategy:
  matrix:
    node-version: [18, 20, 22]

# Continue on error
- run: npm test
  continue-on-error: true
```
