# Contributing

## Setting up NPM_TOKEN

The publish workflow (`.github/workflows/publish.yml`) requires an `NPM_TOKEN` repository secret to publish to npm. Without this secret the publish job will fail at the `npm publish` step.

### Steps

1. **Create an npm access token**
   - Log in at [npmjs.com](https://www.npmjs.com) → click your avatar → **Access Tokens**
   - Click **Generate New Token** → choose **Granular Access Token**
   - Set token name (e.g., `create-ai-template-publish`)
   - Expiration: choose a rotation period (e.g., 365 days)
   - Packages and scopes: select **Read and write** for the `create-ai-template` package
   - Click **Generate Token** and copy the value immediately (shown once)

2. **Add the secret to the repository**
   - Go to the repo on GitHub → **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `NPM_TOKEN`
   - Secret: paste the token value from step 1
   - Click **Add secret**

3. **How it is used**
   The publish workflow reads this secret as `NODE_AUTH_TOKEN`, which the `actions/setup-node` action uses to authenticate with the npm registry when `npm publish` runs.

### OIDC upgrade path

npm trusted publishing (OIDC) eliminates the need for a long-lived `NPM_TOKEN` entirely. Once ready, configure a trusted publisher at npmjs.com → package → Settings → Trusted Publishers, then update `publish.yml` to use `id-token: write` permissions and remove the `NODE_AUTH_TOKEN` env var. See the comment in `publish.yml` for details.
