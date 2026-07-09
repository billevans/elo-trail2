import type { Aoe4WorldPlayer } from "@/services/aoe4world";

export function PlayerCard({ player }: { player: Aoe4WorldPlayer }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{player.name}</h3>

      <p className="text-muted-foreground text-sm">
        Profile ID: {player.profile_id}
      </p>

      {player.country && <p>Country: {player.country}</p>}

      {player.rating && <p>Rating: {player.rating}</p>}
    </div>
  );
}
