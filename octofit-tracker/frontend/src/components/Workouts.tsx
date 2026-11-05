import { getJson } from '../api/client.js';
import { CapabilityCard, useApiData } from './CapabilityCard.js';

type Suggestion = { _id?: string; title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };

// Seeded demo user; there is no authentication in this exercise.
const userEmail = 'mona@example.com';

const loadSuggestions = () =>
  getJson<{ suggestions?: Suggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`).then((body) => body.suggestions ?? []);

export default function Workouts() {
  const state = useApiData(loadSuggestions);
  return (
    <CapabilityCard title="Workout suggestions" description={`Recommend workouts from activity patterns for ${userEmail}.`} state={state} emptyText="No workout suggestions yet.">
      {(suggestions) => (
        <ul className="list-group">
          {suggestions.map((suggestion, index) => (
            <li key={suggestion._id ?? index} className="list-group-item">
              <strong>{suggestion.title}</strong>
              {suggestion.minutes ? ` — ${suggestion.minutes} min` : ''}
              {suggestion.difficulty ? `, ${suggestion.difficulty}` : ''}
              {suggestion.reason ? <div className="text-muted small">{suggestion.reason}</div> : null}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
