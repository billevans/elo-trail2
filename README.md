This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## About ELO-trail

ELO Trail is a fan-made website developed and maintained by Age of Empires IV
player Willyodas. The code has been written with AI assistance.

ELO Trail sources public game data from the AoE4World API.

## ELO-trail Development Principle

Every feature should either minimise impact on the AoE4World API, provide meaningful value to players, reduce operational cost, or improve maintainability. If a feature doesn't meet at least one of those goals, it doesn't belong in the website.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Responsible API Usage

ELO Trail uses the AoE4World public API responsibly.

- User-driven requests only
- No background crawling
- No continuous polling
- Search input is debounced
- Responses are cached
- History requests are bounded
- Low request concurrency
- Requests identify the application with a dedicated User-Agent
- Documented data-refresh strategy

## Data Refresh Strategy

- Homepage Top 8 leaderboard Refreshed once daily via scheduled Vercel Cron job and cached in PostgreSQL
- Player search results Cached for a short period with server-side and browser caching
- Individual player history Cached and refreshed only when necessary, with browser cache-busting when new history is requested
- Comparison data Reuses cached player history wherever possible

## Administrator Dashboard

ELO Trail includes a private, server-rendered operational dashboard at:

```text
/admin/observability
```

The dashboard reports:

- operational health across 24-hour, 7-day and 30-day windows;
- route error rates and response durations;
- history-cache outcomes and refresh behaviour;
- bounded AoE4World API usage;
- current persistent-cache database capacity;
- recent operational errors.

It does not display player search text, IP addresses, credentials, stack traces
or raw user-agent values.

The dashboard is protected by:

- administrator username and password authentication;
- a signed HTTP-only session cookie;
- server-side session validation;
- proxy-level redirection;
- page-level authorisation.

Required environment variables:

```env
OBSERVABILITY_DASHBOARD_USERNAME=
OBSERVABILITY_DASHBOARD_PASSWORD=
OBSERVABILITY_SESSION_SECRET=
OBSERVABILITY_DATABASE_ALLOWANCE_BYTES="524288000"
```

The configured database allowance is a capacity-planning reference. It does not
place a limit on PostgreSQL or automatically delete cached data.

See `docs/observability.md` for metric definitions, capacity thresholds and
operational guidance.
