# DDT Lab app

## Development

Install dependencies and run the Vite development server:

```bash
npm install
npm run dev
```

The catalog and analysis-request browser APIs use SvelteKit server routes in development and production. Configure the private upstream URLs in `.env` (see `.env.example`). Leave the API keys blank only if the upstream service allows unauthenticated requests.

## Production build and run

This app uses `@sveltejs/adapter-node`; static hosting is no longer supported because API proxy routes must run on the server.

```bash
npm run build
node --env-file=.env build
```

Use Node.js 20 or newer. Adapter-node does not load `.env` at runtime: `node --env-file=.env build` supplies it for local/manual runs. In production, systemd, Docker, PM2, or the chosen process manager must pass the same variables directly in the process environment (or use Node's `--env-file` option). Never put API keys in `PUBLIC_*` variables.

Required runtime configuration:

- `CATALOG_API_URL` and `OEM_INTERFACE_URL`: private upstream base URLs.
- `CATALOG_API_KEY` and `OEM_INTERFACE_API_KEY`: independent server-only keys for their respective upstreams.
- `ORIGIN`: the app's public origin, including scheme and port. It must match the browser origin so adapter-node's CSRF check accepts FormData POSTs.
- `BODY_SIZE_LIMIT=25M`: permits report PDFs up to the API's 20 MB limit; adapter-node's default is 512 KB.

`PUBLIC_CATALOG_API_URL` should be empty to send browser catalog requests to the same-origin `/api/v1/catalog/...` proxy. `PUBLIC_ANALYSIS_REQUEST_API_URL` should remain `/oem-api` for the same-origin analysis-request proxy.

Put a reverse proxy (for example, the existing deployment's HTTPS ingress) in front of Node, configure it to pass the correct `ORIGIN` and preserve request bodies, and restrict direct network access to the Node listener. Do not expose a direct Node port that bypasses the intended network controls. The app still has API routes for Python-based local simulation and caller-supplied CKAN catalog fetching; these return 404 unless `ENABLE_LOCAL_SIMULATION_TOOLS=true` is explicitly set. Keep that flag false in public production deployments unless those tools are deliberately secured and needed.

## Docker deployment

`Dockerfile`, `.dockerignore` and `docker-compose.yml` in this directory build and run the app with adapter-node:

```bash
cp .env.example .env   # fill in the real upstream URLs, keys and ORIGIN
docker compose up -d --build
```

- The compose file resolves `build.context` and `env_file: .env` relative to its own directory, so it stays next to `package.json`. `.env` is read at container start and is never copied into the image (see `.dockerignore`); changing a value needs only `docker compose up -d`.
- Both networks are `external` and must already exist: `caddy-web` (the reverse proxy's network, where Caddy reaches the app as `ddtlab-app:3000`) and `oem-interface_default` (the OEM interface project's network, where `CATALOG_API_URL`/`OEM_INTERFACE_URL` can use a service name such as `http://catalog-api:8000`). Set `CADDY_NETWORK` or `OEM_NETWORK` in `.env` if the host names them differently.
- No host port is published, so the Node listener is reachable only through the reverse proxy; make sure that proxy forwards 25 MB request bodies (`BODY_SIZE_LIMIT=25M`).
- The runtime image contains only `build/` and `package.json` (no `node_modules`, no Python client), so the Python-based local simulation tools cannot run inside it; keep `ENABLE_LOCAL_SIMULATION_TOOLS=false`.

## Deployment follow-up

The current deployment environment must be changed outside this repository: replace static hosting with a Node process (see Docker deployment above), inject the runtime variables above, allow the 25 MB request size through the reverse proxy, set the public `ORIGIN`, and restrict the Node listener to the reverse proxy/network. Update the repository's Developer Docs wiki deployment instructions to match these requirements as well.
