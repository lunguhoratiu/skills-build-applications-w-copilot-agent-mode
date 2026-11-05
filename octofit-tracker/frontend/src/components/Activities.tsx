import { getJson } from '../api/client.js';
import { CapabilityCard, useApiData } from './CapabilityCard.js';

type Activity = { _id?: string; type: string; minutes: number; points: number; occurredAt?: string };

const loadActivities = () => getJson<{ activities?: Activity[] }>('/api/activities').then((body) => body.activities ?? []);

export default function Activities() {
  const state = useApiData(loadActivities);
  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points." state={state} emptyText="No activities logged yet.">
      {(activities) => (
        <ul className="list-group">
          {activities.map((activity, index) => (
            <li key={activity._id ?? index} className="list-group-item">
              {activity.type}: {activity.minutes} minutes, {activity.points} points
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
