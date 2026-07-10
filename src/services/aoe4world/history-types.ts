export interface Aoe4WorldGamePlayer {
  profile_id?: number | null;
  name?: string | null;
  country?: string | null;
  result?: string | null;
  civilization?: string | null;
  civilization_randomized?: boolean | null;
  rating?: number | null;
  rating_diff?: number | null;
  mmr?: number | null;
  mmr_diff?: number | null;
  input_type?: string | null;
}

export interface Aoe4WorldGameTeamEntry {
  player?: Aoe4WorldGamePlayer | null;
}

export interface Aoe4WorldGame {
  game_id?: number | string;
  id?: number | string;

  started_at?: string | null;
  updated_at?: string | null;

  duration?: number | null;

  map?: string | null;
  map_name?: string | null;

  kind?: string | null;
  leaderboard?: string | null;
  mmr_leaderboard?: string | null;

  season?: number | null;
  server?: string | null;
  patch?: number | null;

  average_rating?: number | null;
  average_mmr?: number | null;

  ongoing?: boolean | null;
  just_finished?: boolean | null;

  teams?: Aoe4WorldGameTeamEntry[][] | null;

  /**
   * Retained as a defensive fallback in case another endpoint
   * returns participants without the nested team structure.
   */
  players?: Aoe4WorldGamePlayer[] | null;
}

export interface Aoe4WorldGamesResponse {
  total_count?: number;
  page?: number;
  per_page?: number;
  count?: number;
  offset?: number;

  filters?: {
    leaderboard?: string | null;
    since?: string | number | null;
    profile_ids?: number[] | null;
    opponent_profile_id?: number | null;
    opponent_profile_ids?: number[] | null;
  };

  games?: Aoe4WorldGame[];
}
