import { isValidObjectId } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const { userId, teamId, type, minutes } = (input ?? {}) as Record<string, unknown>;
  if (typeof userId !== 'string' || !isValidObjectId(userId)) throw httpError(400, 'userId must be a valid id');
  if (typeof teamId !== 'string' || !isValidObjectId(teamId)) throw httpError(400, 'teamId must be a valid id');
  if (typeof type !== 'string' || !type.trim()) throw httpError(400, 'type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) throw httpError(400, 'minutes must be a positive number');

  const [userExists, teamExists] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!userExists) throw httpError(404, 'User not found');
  if (!teamExists) throw httpError(404, 'Team not found');

  // One point per minute keeps leaderboard totals easy to reason about.
  const activity = await Activity.create({ user: userId, team: teamId, type: type.trim(), minutes, points: Math.round(minutes), occurredAt: new Date() });
  return activity.toJSON();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const { name, mascot, members = [] } = (input ?? {}) as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim()) throw httpError(400, 'name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw httpError(400, 'mascot is required');
  if (!Array.isArray(members) || !members.every((id) => typeof id === 'string' && isValidObjectId(id))) {
    throw httpError(400, 'members must be an array of valid user ids');
  }
  const memberIds = [...new Set(members as string[])];
  if ((await User.countDocuments({ _id: { $in: memberIds } })) !== memberIds.length) throw httpError(400, 'Every member must be an existing user');

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
  return team.toJSON();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ teamName: string; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: Team.collection.name, localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

const focusByActivityType: Record<string, string> = {
  run: 'endurance', walk: 'endurance', cycle: 'endurance', swim: 'endurance', row: 'endurance',
  strength: 'strength', weights: 'strength', climb: 'strength',
  yoga: 'mobility', stretch: 'mobility', pilates: 'mobility',
};

export async function suggestWorkouts(userEmail: string) {
  const email = userEmail.trim().toLowerCase();
  const user = await User.findOne({ email }).lean();
  if (!user) throw httpError(404, 'User not found');

  const recent = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const minutesByType = new Map<string, number>();
  for (const activity of recent) minutesByType.set(activity.type, (minutesByType.get(activity.type) ?? 0) + activity.minutes);
  const topType = [...minutesByType.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const activityFocus = topType ? focusByActivityType[topType.toLowerCase()] : undefined;
  const focus = activityFocus ?? user.fitnessGoal;
  const reason = activityFocus
    ? `Matches your recent ${topType} activity, which builds ${focus}.`
    : `Supports your ${focus} fitness goal.`;

  const workouts = await Workout.find().sort({ title: 1 }).lean();
  return workouts
    .sort((a, b) => Number(b.focus === focus) - Number(a.focus === focus))
    .map((workout) => ({
      ...workout,
      reason: workout.focus === focus ? reason : `Adds ${workout.focus} variety to your ${focus} routine.`,
    }));
}

export { User };
