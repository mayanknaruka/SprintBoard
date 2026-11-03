import Activity from '../models/Activity.js';

export async function logActivity({ userId, issueId, projectId, action, io }) {
  const activity = await Activity.create({ userId, issueId, projectId, action });
  const populated = await activity.populate([
    { path: 'userId', select: 'name email' },
    { path: 'issueId', select: 'title status priority' },
  ]);

  if (io) {
    io.to(`project:${projectId}`).emit('activity:created', populated);
  }

  return populated;
}
