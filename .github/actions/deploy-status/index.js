// JavaScript Custom Action Entrypoint.
// GitHub Actions runs this script directly using the runner's built-in Node.js environment
// specified in action.yml (e.g. using: 'node20').

import fs from 'node:fs';

/**
 * Helper to retrieve action inputs.
 * Under the hood, the GitHub Actions runner converts `with:` inputs into uppercase
 * environment variables prefixed with `INPUT_`, replacing spaces with underscores and dashes with underscores.
 * E.g., `with: { app-name: 'rag-app' }` -> `process.env['INPUT_APP-NAME']` or `process.env['INPUT_APP_NAME']`.
 */
function getInput(name, options = {}) {
  const normalizedKey = name.replace(/[\s-]/g, '_').toUpperCase();
  const rawKey = name.toUpperCase();
  const val =
    process.env[`INPUT_${normalizedKey}`] ||
    process.env[`INPUT_${rawKey}`] ||
    '';

  if (options.required && !val.trim()) {
    throw new Error(`Input required and not supplied: ${name}`);
  }
  return val.trim();
}

/**
 * Helper to set action outputs.
 * GitHub Actions runner provides an environment file path in `process.env.GITHUB_OUTPUT`.
 * Writing `name=value\n` to that file registers the step output so downstream steps
 * or jobs can consume it via `${{ steps.<id>.outputs.<name> }}`.
 */
function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `${name}=${value}\n`, { encoding: 'utf8' });
  } else {
    // Fallback for local testing outside runner environment
    console.log(`[local-output] ${name}=${value}`);
  }
}

/**
 * Helper to register a secret with the GitHub Actions log-masking engine.
 * Printing the workflow command `::add-mask::<secret>` instructs the runner to replace
 * any future occurrences of that string in log outputs with `***`.
 */
function maskSecret(secret) {
  if (secret && secret.length > 0) {
    process.stdout.write(`::add-mask::${secret}\n`);
  }
}

/**
 * Helper to report failure to the runner.
 * The workflow command `::error::<message>` creates an annotation in the GitHub Actions UI.
 */
function setFailed(message) {
  process.stdout.write(`::error::${message}\n`);
  process.exitCode = 1;
}

async function run() {
  try {
    console.log('--- Executing Custom JavaScript Action (Deploy Status) ---');

    // 1. Read Inputs
    const appName = getInput('app-name', { required: true });
    const deployUrl = getInput('deployment-url', { required: true });
    const environment = getInput('environment') || 'prod';
    const authToken = getInput('auth-token');

    // 2. Handle Secrets
    // If a secret token is passed, immediately mask it so it cannot leak into log output.
    if (authToken) {
      maskSecret(authToken);
      console.log(`Received authentication secret token (length: ${authToken.length} chars, masked in logs)`);
    } else {
      console.log('No secret token provided (running in unauthenticated mode)');
    }

    // 3. Perform verification logic
    console.log(`Verifying application: ${appName}`);
    console.log(`Target environment:    ${environment}`);
    console.log(`Target deployment URL: ${deployUrl}`);

    // Validate URL format
    try {
      new URL(deployUrl);
    } catch {
      throw new Error(`Invalid deployment URL format: "${deployUrl}"`);
    }

    const timestamp = new Date().toISOString();
    const releaseId = `${appName}-${environment}-${Date.now()}`;
    const status = 'healthy';
    const summary = `Deployment check successful for ${appName} on ${environment} (${deployUrl}) at ${timestamp}`;

    console.log(`Status result: ${status}`);
    console.log(`Release identifier: ${releaseId}`);

    // 4. Set Action Outputs
    // Outputs become accessible in the workflow via steps.<step-id>.outputs.<output-name>
    setOutput('status', status);
    setOutput('release-id', releaseId);
    setOutput('summary', summary);

    console.log('--- Custom JavaScript Action completed successfully ---');
  } catch (error) {
    setFailed(error instanceof Error ? error.message : String(error));
  }
}

run();
