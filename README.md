# Mitchell Firm Company Brain Demo

A standalone, interactive prototype for the Mitchell Firm review. It presents a reliability-first command center for the firm’s existing CRM and AI workflows, with sample matter data and no production integrations.

## Run locally

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Open <http://127.0.0.1:4173/mitchell-firm-brain.html>.

## Verify

```bash
npm ci
npm test
npm run validate
```

The demo is intentionally client-only. Voice, capture, approvals, activity logs, and cited answers are scripted interactions against fictional sample matters.
