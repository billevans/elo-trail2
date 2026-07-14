import { calculateActivity } from "./activity";
import { calculateCivilisationAnalytics } from "./civilisations";
import {
  calculateMatchAnalytics,
  calculateRatingAnalytics,
  normaliseCareerSummary,
} from "./statistics";
import { calculateStreaks } from "./streaks";
import type { PlayerAnalytics, PlayerAnalyticsInput } from "./types";

export function calculatePlayerAnalytics({
  points,
  matches,
  career,
}: PlayerAnalyticsInput): PlayerAnalytics {
  const matchAnalytics = calculateMatchAnalytics(matches);

  const ratingAnalytics = calculateRatingAnalytics(points, career?.currentElo);

  const careerSummary = normaliseCareerSummary(
    career,
    matchAnalytics,
    ratingAnalytics.currentElo,
  );

  return {
    rating: ratingAnalytics,
    matches: matchAnalytics,
    career: careerSummary,
    streaks: calculateStreaks(matches),
    activity: calculateActivity(matches),
    civilisations: calculateCivilisationAnalytics(matches),
  };
}
