# GitHub Actions learning notes

GitHub Actions runs automation defined in `.github/workflows/*.yml`. Common uses are CI (typecheck, test, build), CD (deployment), and repository automation. These files are ordered lessons: repeated setup and simulated deployment commands are intentional.

## Learning order

| File | Main concepts |
| --- | --- |
| [ci.yml](ci.yml) | Jobs, steps, runners, actions, event context, parallel jobs |
| [secrets.yml](secrets.yml) | `env`, `vars`, `secrets`, environment configuration and precedence |
| [outputs.yml](outputs.yml) | Step outputs, job outputs, `needs` |
| [caching.yml](caching.yml) | Dependency caches, lockfile keys, `$GITHUB_ENV`, fresh runners |
| [artifact.yml](artifact.yml) | Ordered jobs, uploading and downloading build files |
| [conditions.yml](conditions.yml) | Job/step `if`, status functions, step failure tolerance |
| [matrix.yml](matrix.yml) | Combinations, `include`, `exclude`, job failure tolerance |
| [reusable.yml](reusable.yml) + [reuse-example.yml](reuse-example.yml) | Reusable workflow inputs, secrets, outputs and caller |
| [containers.yml](containers.yml) | Job containers, service containers, host-to-service and container-to-service networking |

## Running the lessons

Only **reuse-example.yml**, the active topic, runs on `push`; it also supports manual runs. Other standalone examples use `workflow_dispatch`. The reusable definition uses only `workflow_call`. Move the `push` trigger when switching the active topic.

For a manual run, open **Actions → workflow → Run workflow**, select a branch, and supply any inputs. The workflow must exist on the default branch for manual triggering to be available. Use the workflow file path to distinguish the two older workflows named `CI`.

The new examples require no application services or secrets. The caller produces `rag-app-r2-preview`. Optionally add a repository Actions secret named `DEMO_TOKEN` to observe secret availability without printing it. The conditions and experimental matrix examples deliberately fail a command to demonstrate tolerance.

Existing application examples use Node 24, Corepack and pnpm 11, install from `pnpm-lock.yaml`, and run the scripts in `package.json`. The secrets lesson also starts the application: configure its listed variables/secrets in the `prod` environment, including a valid `PORT` and service credentials. Its job-level `GROQ_MODEL` secret must be set to avoid overriding the workflow default with an empty value. Commands that only echo “Deploying” are placeholders, not real deployments.

## Workflow basics

- **Workflow:** one YAML file containing triggers and jobs.
- **Trigger (`on`):** the event that starts a workflow.
- **Job:** steps sharing a runner. Jobs run in parallel unless linked by `needs`.
- **Runner (`runs-on`):** the machine executing a job, such as `ubuntu-latest`.
- **Step:** either a shell command (`run`) or an action (`uses`). Steps run in order.
- **Action:** reusable step functionality, such as checkout or setting up Node.
- **`name` vs `id`:** names are display labels; IDs let expressions reference steps and jobs.

`actions/checkout@v4` downloads repository contents; `actions/setup-node@v4` selects Node. Checkout is unnecessary for the new examples because they do not read application files. On Ubuntu, multiline `run: |` commands execute in a shell; variables set only in that shell do not persist into another step.

### Triggers

| Trigger | Use / important restriction |
| --- | --- |
| `push` | Commit pushed; supports branch/path filters |
| `pull_request` | PR activity; `branches` filters the PR's **target** branch |
| `issues` | Issue activity; supports activity `types`, not branch filters |
| `workflow_dispatch` | Manual run with optional typed inputs; no `branches` filter |
| `workflow_call` | Another workflow calls this workflow |
| `schedule` | Scheduled automation; cron uses UTC by default |

Reference syntax (not additional active triggers in this repository):

```yaml
on:
  push:
    branches: [master, 'feature-*']
  pull_request:
    branches: [master]
  issues:
    types: [opened]
  schedule:
    - cron: '0 0 * * *'
```

### Dependencies and runner isolation

`needs: [build]` waits for `build` to succeed by default and exposes its outputs/result. Failed or skipped dependencies normally skip downstream jobs unless a suitable `if` overrides that behavior. Each GitHub-hosted job starts on a fresh runner: `needs` does **not** transfer installed dependencies, environment variables, or files.

In `ci.yml`, the commented-out `needs` deliberately leaves jobs independent. `artifact.yml` adds ordering and file transfer; `caching.yml` repeats setup to illustrate runner isolation.

## Expressions, contexts and environment values

`${{ ... }}` evaluates an Actions expression. A step/job `if` generally permits omitting the wrapper; an expression beginning with `!` should use the wrapper to avoid YAML tag syntax.

| Context / mechanism | Purpose |
| --- | --- |
| `github` | Event, repository and ref; `github.ref` can be `refs/heads/master` |
| `runner` | Runner details, such as `runner.os` |
| `env` | Workflow/job/step environment values |
| `vars` | Non-secret configuration variables |
| `secrets` | Sensitive configuration; do not print values |
| `inputs` | Typed dispatch or reusable-workflow inputs |
| `steps.ID.outputs.NAME` | Output of an earlier named step in this job |
| `needs.JOB.outputs.NAME` | Output of a declared dependency |
| `needs.JOB.result` | Dependency result: success, failure, cancelled or skipped |
| `matrix` | Current matrix combination |

The most specific `env` wins: **step → job → workflow**. `environment: prod` selects a GitHub environment, which can provide secrets/variables and approval rules; it is different from `env`.

Use `env` to pass expressions containing external text or secrets into shell commands, then quote shell variables, for example `printf '%s\n' "$EVENT_JSON"`. Directly interpolating event text into `run` can turn its contents into shell syntax. Missing secrets evaluate to an empty string. Secrets cannot be referenced directly in an `if`; for step conditions, map them into job-level `env` and check that value. Never put secrets in outputs or artifacts.

### Environment files and outputs

| Mechanism | Scope / example |
| --- | --- |
| `$GITHUB_ENV` | `echo "STORE_PATH=..." >> "$GITHUB_ENV"` makes a variable available to **subsequent** steps in the same job |
| `$GITHUB_OUTPUT` | `echo "build_tag=v1.2.0" >> "$GITHUB_OUTPUT"` creates a named output on a step with an `id` |
| Job `outputs` | Maps a step output so another job can read it via `needs` |
| Workflow `outputs` | Maps a job output so a reusable workflow's caller can read it |

`outputs.yml` demonstrates step → job → downstream job. Outputs carry small values; artifacts carry files.

## Caching versus artifacts

| | Cache: `caching.yml` | Artifact: `artifact.yml` |
| --- | --- | --- |
| Purpose | Reuse dependencies to speed up installation | Transfer/preserve generated build files |
| Actions | `actions/cache@v4` | `actions/upload-artifact@v4`, `actions/download-artifact@v4` |
| Identifier | OS + lockfile hash in a cache key | Artifact name `build-files` |
| Contents here | pnpm's download store | `dist` and `package.json` |

`hashFiles('**/pnpm-lock.yaml')` changes when dependency definitions change, producing a new cache key. A matching cache restores the store; installation still runs to populate `node_modules`. On a miss, the cache action can save the store after a successful job. Optional `restore-keys` provide prefix fallbacks but are not used here.

Artifacts let `deploy` download the exact files built by `build`. Caching dependencies does not transfer build output, and neither mechanism shares a running process.

## Conditions and tolerated failures

Read [conditions.yml](conditions.yml) first, then the job-level example in [matrix.yml](matrix.yml).

| Construct | Meaning |
| --- | --- |
| Job `if` | Skip an entire job; evaluated before matrix expansion, so do not use `matrix` here |
| Step `if` | Run a step only when its condition matches |
| `success()` | Earlier work succeeded; the implicit status check for most conditions |
| `failure()` | Detect an earlier untolerated failure; useful for diagnostics |
| `always()` | Run even after failure/cancellation; useful for short final reporting |
| `${{ !cancelled() }}` | Run after success/failure but skip cancellation |
| Step `continue-on-error: true` | Tolerate that step's failure and allow normal following steps |
| Job `continue-on-error: true` | Allow that job to fail without failing the workflow run |

For a failed step with `continue-on-error: true`, `steps.ID.outcome` is `failure` but `steps.ID.conclusion` is `success`. Check **outcome** when reacting to a tolerated failure; `failure()` alone will not catch it. Job-level tolerance does not make every later step inside that job run after a failure: normal step status conditions still apply.

By default the conditions lesson succeeds and skips failure diagnostics. Enable its boolean input to run the optional job. To practice the failure path, temporarily remove the step's `continue-on-error`: diagnostics and final reporting run, normal success steps skip, and the job fails.

## Matrix, include and exclude

A matrix creates one job per combination of its dimensions. `matrix.yml` begins with two operating systems × two Node versions × one experimental flag: four combinations.

- `exclude` removes Windows + Node 22.
- The first `include` adds a `note` to the remaining original Ubuntu combinations without replacing their dimension values.
- The second `include` cannot merge into an original combination without replacing values, so it adds an Ubuntu + Node 26 experimental job. Added combinations are not expanded by subsequent `include` entries.

The resulting jobs are:

| OS | Node | Experimental | Extra note |
| --- | --- | --- | --- |
| Ubuntu | 22 | false | Linux baseline |
| Ubuntu | 24 | false | Linux baseline |
| Windows | 24 | false | — |
| Ubuntu | 26 | true | Experimental failure demo |

`max-parallel: 2` limits concurrency. `fail-fast: false` keeps sibling jobs running after a required job fails; it does not tolerate that failure. `continue-on-error: ${{ matrix.experimental }}` tolerates only the experimental job. With `fail-fast: true`, a non-tolerated failure can cancel queued/running siblings; a tolerated experimental failure does not trigger that cancellation.

## Reusable workflows

[reusable.yml](reusable.yml) defines the contract under `on.workflow_call`. [reuse-example.yml](reuse-example.yml) calls it at **job level** using `uses`; the called workflow supplies its own runners and steps.

- **Inputs:** `app_name` is a required string; `revision` is a number defaulting to `1`; `preview` is a boolean defaulting to `true`. Callers pass them through `with` using the declared types. Omit optional inputs to use defaults.
- **Secrets:** the caller maps repository secret `DEMO_TOKEN` to the callee's optional `demo_token`. Secrets are passed separately from inputs. Declare `required: true` when missing credentials must prevent a call.
- **Inheritance:** `secrets: inherit` can replace the explicit mapping for eligible calls within the same organization or enterprise. Explicit mapping makes dependencies easier to review. Secrets must be passed again at each hop in nested workflows.
- **Environment secrets:** `workflow_call` cannot accept an environment declaration from the caller; an `environment` on a called job selects that environment's secrets. A same-named environment secret takes precedence over a passed secret.
- **Outputs:** `$GITHUB_OUTPUT` → `jobs.label.outputs` → `on.workflow_call.outputs` → caller's `needs.release.outputs.release_label`.

A local reference (`./.github/workflows/reusable.yml`) uses the caller's commit. Cross-repository references use `owner/repo/.github/workflows/file.yml@ref`; pin a commit SHA for a stable reference. Caller workflow-level `env` does not automatically propagate into the callee: use inputs. A reusable workflow also cannot elevate the caller's `GITHUB_TOKEN` permissions.

## Containers and service containers

[containers.yml](containers.yml) covers containerized job execution and service containers. Container jobs and service containers require Linux-based runners (`ubuntu-latest`).

| Concept | Mechanism / Scope | Network Communication |
| --- | --- | --- |
| Job container | `container: <image>` at job level; all steps run inside the container | Accesses other service containers on the same Docker bridge network by service name |
| Service container | `services.<name>: image: <image>` | Provides dependency services (e.g., databases, caches) for the job |
| Host to service | Host runner (no job `container:`) + `services` | Runner connects via `localhost:<mapped_port>` (e.g. `127.0.0.1:6379`). Port mapping under `ports:` is **mandatory**. |
| Container to service | Job `container:` + `services` | Steps connect directly via service label hostname (e.g. `redis:6379`). Host port mapping is **unnecessary**; `localhost` refers to the job container itself, not the service. |

- **Service health checks:** Use `options` on service definitions (e.g. `--health-cmd "redis-cli ping" --health-interval 10s --health-timeout 5s --health-retries 5`) so GitHub Actions blocks step execution until the service container is healthy and ready to accept connections.
- **Docker network lifecycle:** GitHub Actions automatically creates a shared Docker bridge network for the job when service containers or job containers are declared, and cleans them up after the job finishes.

## Quick revision

- Order jobs with `needs`; transfer values with outputs and files with artifacts.
- Use a cache for reusable dependency downloads; still install dependencies.
- Use `if` to choose whether work runs and `continue-on-error` to tolerate a failure.
- Use a matrix to vary configurations and a reusable workflow to share job logic.
- Use container jobs for custom execution environments and service containers for dependencies, noting host-to-service (`localhost`) vs container-to-service (service name) networking.
- Keep `push` on the active lesson and manual triggers on completed standalone lessons.
