import { PlayerSearch } from "@/features/player";

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold">ELO Trail</h1>

          <p className="text-muted-foreground">
            Track Age of Empires IV player performance.
          </p>
        </div>

        <PlayerSearch />
      </div>
    </main>
  );
}
