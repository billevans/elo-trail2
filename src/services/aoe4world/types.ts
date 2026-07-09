export interface Aoe4WorldPlayer {
  profile_id: number;

  name: string;

  steam_id?: string;

  country?: string;

  avatars?: {
    small?: string | null;
    medium?: string | null;
    full?: string | null;
  };

  last_game_at?: string | null;

  leaderboards?: Record<
    string,
    {
      rating?: number;

      rank?: number | null;

      rank_level?: string | null;

      streak?: number;

      games_count?: number;

      wins_count?: number;

      losses_count?: number;

      win_rate?: number;
    }
  >;
}
