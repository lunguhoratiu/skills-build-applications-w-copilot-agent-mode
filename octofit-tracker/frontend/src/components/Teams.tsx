import { getJson } from '../api/client.js';
import { CapabilityCard, useApiData } from './CapabilityCard.js';

type Team = { _id?: string; name: string; mascot?: string; members?: string[] };

const loadTeams = () => getJson<{ teams?: Team[] }>('/api/teams').then((body) => body.teams ?? []);

export default function Teams() {
  const state = useApiData(loadTeams);
  return (
    <CapabilityCard title="Teams" description="Manage teams and members." state={state} emptyText="No teams created yet.">
      {(teams) => (
        <ul className="list-group">
          {teams.map((team, index) => (
            <li key={team._id ?? index} className="list-group-item">
              <strong>{team.name}</strong>
              {team.mascot ? ` (mascot: ${team.mascot})` : ''} — {team.members?.length ?? 0} member{team.members?.length === 1 ? '' : 's'}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
