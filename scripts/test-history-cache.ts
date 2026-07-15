import "dotenv/config";

import {
  createHistoryCacheKey,
  readCachedPlayerGames,
} from "../src/services/database";

async function main() {
  const key = createHistoryCacheKey(11196570, "rm_1v1", 180);

  const result = await readCachedPlayerGames(key);

  console.log({
    state: result.state,
    gameCount: result.games.length,
    metadata: result.metadata,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });
