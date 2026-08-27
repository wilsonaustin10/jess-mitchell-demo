# Mitchell Firm Company Brain Demo

A standalone, interactive prototype for the Mitchell Firm review. It presents a reliability-first command center for the firm’s existing CRM and AI workflows, with sample matter data and no production integrations.

## Run locally

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Open <http://127.0.0.1:4173/mitchell-firm-brain.html>.

## Build for deployment

```bash
npm run build
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

The production artifact is emitted to `dist/`, with the demo available at `/`
and at `/mitchell-firm-brain.html`. `vercel.json` pins this build contract so
Vercel does not depend on dashboard framework settings.

## Verify

```bash
npm ci
npm run build
npm test
npm run validate
```

The demo is intentionally client-only. Voice, capture, approvals, activity logs, and cited answers are scripted interactions against fictional sample matters.
