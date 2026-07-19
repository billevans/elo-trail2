# ELO Trail Observability

ELO Trail provides a private, server-rendered operational dashboard at:

```text
/admin/observability

The dashboard helps the maintainer assess application health, responsible
AoE4World API usage, persistent-history cache behaviour, database capacity and
recent bounded operational failures.

The dashboard does not display player search text, IP addresses, credentials,
stack traces or raw user-agent values.

Access and security

Access requires the following environment variables:

OBSERVABILITY_DASHBOARD_USERNAME=
OBSERVABILITY_DASHBOARD_PASSWORD=
OBSERVABILITY_SESSION_SECRET=

The dashboard is protected by:

administrator username and password authentication;
a signed HTTP-only session cookie;
server-side session validation;
proxy-level redirection;
page-level authorisation.

OBSERVABILITY_SESSION_SECRET must be a long, random secret that is not reused
for another purpose.

Reporting windows

Operational-event metrics can be viewed across:

the preceding 24 hours;
the preceding 7 days;
the preceding 30 days.

The selected window affects event totals, errors, route performance, cache
outcomes and API-efficiency trends.

Cache-capacity measurements are different. They are a point-in-time database
snapshot generated when the dashboard is rendered. They are not historical
measurements for the selected reporting window.

Cache capacity planning

The cache-capacity panel reports:

persistent history-cache records;
cached game records;
declared cached-game totals;
history-cache table storage;
cached-game table storage;
combined storage;
configured storage allowance;
storage utilisation;
average bytes per cache;
average bytes per cached game;
oldest cache refresh;
newest cache refresh.

Table storage is measured by PostgreSQL. It may include table data, indexes and
other relation storage reported by the database.

The panel is intended as an operational planning aid rather than a billing
statement. The hosting provider remains the authoritative source for database
quotas and billing usage.

Storage allowance

The capacity panel compares measured cache storage with:

OBSERVABILITY_DATABASE_ALLOWANCE_BYTES="524288000"

524288000 bytes is 500 MiB.

This value does not limit PostgreSQL and does not automatically delete data. It
provides a reference allowance used to calculate:

utilisation = measured cache storage / configured allowance

Set the value to the amount of database storage that ELO Trail is prepared to
allocate to persistent history caching.

The configured allowance should be:

greater than zero;
expressed as an integer number of bytes;
reviewed when the database plan or retention policy changes.
Capacity status thresholds

The dashboard assigns a capacity status using these thresholds:

Utilisation	Status	Meaning
Below 70%	Healthy	Existing capacity is adequate
70% to below 90%	Watch	Review growth and retention settings
90% or above	Attention	Take action before available capacity is exhausted

These thresholds are operational guidance. They do not indicate that the
database provider has applied or will apply the same thresholds.

Operational response
Below 70%

Continue normal monitoring.

Confirm periodically that:

cleanup jobs are succeeding;
cache retention remains appropriate;
average storage per cached game is reasonably stable;
cache growth reflects genuine player usage.
From 70% to below 90%

Review:

recent cache growth;
cache and cached-game counts;
cleanup failures;
retention duration;
stale or unusually large cache records;
the configured allowance;
the actual database plan and provider quota.

Avoid increasing refresh frequency or retaining more history until the cause of
growth is understood.

At 90% or above

Treat the capacity status as requiring prompt operational attention.

Consider:

confirming the measured usage against the database provider;
checking whether cleanup is running successfully;
reducing cache retention where appropriate;
removing expired or invalid cache data through the supported cleanup process;
investigating unexpectedly large records;
increasing database capacity when the retained data is still required.

Do not delete production cache rows manually without first understanding the
retention and referential-integrity implications.

Empty-cache behaviour

When no persistent history-cache records exist:

cache and cached-game counts may be zero;
average bytes per cache may be unavailable;
average bytes per game may be unavailable;
oldest and newest refresh timestamps may be unavailable.

The dashboard displays a neutral fallback instead of attempting to divide by
zero or format a missing value.

Trends

Period-over-period trends are calculated for operational-event metrics such as:

event volume;
error rate;
average duration;
fresh cache rate;
upstream games retrieved.

Capacity is deliberately excluded from these trends because the application
currently stores only the latest point-in-time capacity snapshot. Historical
capacity trends would require recording capacity measurements over time.

Responsible API usage

The dashboard supports ELO Trail's responsible API strategy by exposing:

fresh cache outcomes;
incremental and full refreshes;
cache misses;
stale fallbacks;
upstream games retrieved;
games returned to users;
route duration and error rates.

These metrics should be used to identify unnecessary upstream work and preserve
bounded, user-driven access to AoE4World.
```
