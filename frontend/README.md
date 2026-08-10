# LazyTripZ — Frontend

Angular 21 SPA with standalone components and Angular Material.

**Setup, architecture and full documentation live in the [root README](../README.md).**
Spanish version: [README.es.md](../README.es.md).

## Quick reference

```bash
npm install --legacy-peer-deps   # the flag is required: peer dependency conflict
npx ng serve                     # http://localhost:4200  (ng is not on the global PATH)
npx ng build
npx ng test
```

`ng serve` proxies `/api`, `/auth` and `/storage` to the Laravel backend on port 8000 via
`proxy.conf.json`. The backend must be running, or every request will fail.

Notes for contributors: [CLAUDE.md](CLAUDE.md).
