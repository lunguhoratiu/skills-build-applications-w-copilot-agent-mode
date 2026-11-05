import { getJson } from '../api/client.js';
import { CapabilityCard, useApiData } from './CapabilityCard.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

const loadLeaderboard = () => getJson<{ leaderboard?: Entry[] }>('/api/leaderboard').then((body) => body.leaderboard ?? []);

export default function Leaderboard() {
  const state = useApiData(loadLeaderboard);
  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals." state={state} emptyText="No leaderboard scores yet.">
      {(entries) => (
        <table className="table table-striped mb-0">
          <thead><tr><th scope="col">Rank</th><th scope="col">Team</th><th scope="col">Points</th></tr></thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.teamName}><td>{entry.rank}</td><td>{entry.teamName}</td><td>{entry.totalPoints}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </CapabilityCard>
  );
}
