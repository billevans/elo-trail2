export const PLAYER_HISTORY_CACHE_VERSION = "persistent-history-v1";

/*
 * A history may be served as fresh for 30 minutes.
 * The upcoming incremental-refresh stage will update it
 * after this period without downloading the entire history.
 */
export const PLAYER_HISTORY_CACHE_TTL_MS = 30 * 60 * 1000;

/*
 * Retain only the supported 180-day history window.
 * The additional overlap day protects games occurring
 * close to the UTC boundary during incremental refreshes.
 */
export const PLAYER_HISTORY_RETENTION_DAYS = 181;

export const PLAYER_HISTORY_DEFAULT_DAYS = 180;

/*
 * Incremental refreshes intentionally overlap the newest
 * cached game by one day. This protects against late game
 * updates and timestamp-boundary differences.
 */
export const PLAYER_HISTORY_REFRESH_OVERLAP_MS = 24 * 60 * 60 * 1000;

/*
 * A refresh lease prevents multiple requests from
 * refreshing the same player history simultaneously.
 */
export const PLAYER_HISTORY_REFRESH_LEASE_MS = 2 * 60 * 1000;

/*
 * Player caches that have not been refreshed for this
 * period are removed. Their game rows are deleted by the
 * database relation's cascading delete.
 */
export const PLAYER_HISTORY_UNUSED_CACHE_DAYS = 30;
