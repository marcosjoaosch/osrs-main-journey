# Quest sync service — activation pending

`worker.mjs` exports a Cloudflare-compatible Worker with `/health` and
`/quests?username=...`. No database, paid dependency or client secret is required.
Only WikiSync STANDARD is queried. Public player data is returned, never stored goals.

Run verification with `node --test quest-service/worker.test.mjs quest-service/client.test.mjs`.

For a local HTTP check, run `node quest-service/local-server.mjs` (loopback port
4174) and consult `/quests?username=samurai_jao` or `/quests?username=Iron%20Samuka`.
This runs the same handler as the hosted Worker; it does not expose a public service.

Activation checklist:

1. Register a dedicated public Worker/service on the approved hosting account.
2. Deploy `worker.mjs` as the ESM entrypoint. Set `ALLOWED_ORIGINS` to
   `https://marcosjoaosch.github.io` in production.
3. Test both accounts through the deployed endpoint, including CORS from GitHub Pages.
4. Set `window.OSRS_QUEST_SERVICE_URL` in `quest-sync-config.js` to that verified HTTPS origin.
5. Publish the frontend and verify Quests, linked goals and Roadmap in the browser.

Cache (30 seconds), request coalescing and rate limits (30 requests/minute/client)
are per Worker isolate, not a distributed quota. Before wider traffic, configure
the hosting provider's edge rate limiting. Failures are never cached as success.
Source timestamps are not asserted to be RuneLite upload times.

Deployment has NOT occurred. No service URL or credential has been created.
The empty config keeps the current direct-then-snapshot behavior until activation.
