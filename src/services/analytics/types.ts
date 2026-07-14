import type { EloPoint, MatchSummary } from "@/types/history";

export interface PlayerCareerSummary {
  currentElo: number | null;
  games: number;
  wins: number;
  losses: number;
  winRate: number | null;
}

export interface RatingExtreme {
  rating: number | null;
  date: string | null;
  gameId: number | string | null;
}

export interface RatingAnalytics {
  startingElo: number | null;
  currentElo: number | null;
  peak: RatingExtreme;
  lowest: RatingExtreme;
  totalChange: number;
  averageElo: number | null;
  medianElo: number | null;
}

export interface MatchAnalytics {
  games: number;
  wins: number;
  losses: number;
  unknownResults: number;
  winRate: number | null;
  averageGain: number | null;
  averageLoss: number | null;
  biggestGain: number | null;
  biggestLoss: number | null;
}

export type StreakKind = "win" | "loss" | "none";

export interface StreakValue {
  kind: StreakKind;
  count: number;
}

export interface StreakAnalytics {
  current: StreakValue;
  longestWin: number;
  longestLoss: number;
}

export interface ActivityPeriod {
  date: string | null;
  games: number;
}

export interface InactivityPeriod {
  days: number;
  from: string | null;
  to: string | null;
}

export interface ActivityAnalytics {
  mostActiveDay: ActivityPeriod;
  longestBreak: InactivityPeriod;
  firstGameAt: string | null;
  lastGameAt: string | null;
}

export interface PlayerAnalytics {
  rating: RatingAnalytics;
  matches: MatchAnalytics;
  career: PlayerCareerSummary;
  streaks: StreakAnalytics;
  activity: ActivityAnalytics;
  civilisations: CivilisationAnalytics;
  opponents: OpponentAnalytics;
}

export interface PlayerAnalyticsInput {
  points: EloPoint[];
  matches: MatchSummary[];
  career?: Partial<PlayerCareerSummary>;
}

export interface CivilisationPerformance {
  civilisation: string;
  games: number;
  wins: number;
  losses: number;
  unknownResults: number;
  winRate: number | null;
  netEloChange: number;
  averageEloChange: number | null;
  averageGain: number | null;
  averageLoss: number | null;
}

export interface CivilisationHighlight {
  civilisation: string | null;
  games: number;
  winRate: number | null;
}

export interface CivilisationAnalytics {
  civilisations: CivilisationPerformance[];
  favourite: CivilisationHighlight;
  strongest: CivilisationHighlight;
  weakest: CivilisationHighlight;
}

export interface OpponentPerformance {
  opponentKey: string;
  profileId: number | null;
  name: string;
  games: number;
  wins: number;
  losses: number;
  unknownResults: number;
  winRate: number | null;
  netEloChange: number;
  averageOpponentElo: number | null;
  highestOpponentElo: number | null;
  lastPlayedAt: string | null;
}

export interface OpponentMatchHighlight {
  profileId: number | null;
  name: string | null;
  opponentElo: number | null;
  playedAt: string | null;
  gameId: number | string | null;
}

export interface OpponentSummaryHighlight {
  profileId: number | null;
  name: string | null;
  games: number;
  wins: number;
  losses: number;
  winRate: number | null;
}

export interface OpponentAnalytics {
  uniqueOpponents: number;
  repeatOpponents: number;
  averageOpponentElo: number | null;
  strongestDefeated: OpponentMatchHighlight;
  highestFaced: OpponentMatchHighlight;
  mostFrequent: OpponentSummaryHighlight;
  opponents: OpponentPerformance[];
}
