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

ELO trail is a fan made website developed and maintained by AOE4 player Willyodas, code has been written with AI assistance.
ElO trail sources data from the aeo4world API.

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
- Current Data Refresh Strategy

## Data	Refresh Strategy
- Homepage Top 8 leaderboard	Refreshed once daily via scheduled Vercel Cron job and cached in PostgreSQL
- Player search results	Cached for a short period with server-side and browser caching
- Individual player history	Cached and refreshed only when necessary, with browser cache-busting when new history is requested
- Comparison data	Reuses cached player history wherever possible
## Git commit test