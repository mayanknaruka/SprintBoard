import Project from '../models/Project.js';
import Issue from '../models/Issue.js';
import Activity from '../models/Activity.js';

export async function getDashboard(req, res, next) {
  try {
    const projectFilter =
      req.user.role === 'admin' ? {} : { createdBy: req.user._id };

    const projects = await Project.find(projectFilter).select('_id');
    const projectIds = projects.map((p) => p._id);

    const issueFilter = { projectId: { $in: projectIds } };

    const [totalProjects, totalIssues, todo, inProgress, done, highPriority, recentActivity] =
      await Promise.all([
        Project.countDocuments(projectFilter),
        Issue.countDocuments(issueFilter),
        Issue.countDocuments({ ...issueFilter, status: 'To Do' }),
        Issue.countDocuments({ ...issueFilter, status: 'In Progress' }),
        Issue.countDocuments({ ...issueFilter, status: 'Done' }),
        Issue.countDocuments({ ...issueFilter, priority: 'High' }),
        Activity.find({ projectId: { $in: projectIds } })
          .populate('userId', 'name email')
          .populate('issueId', 'title status priority')
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

    const byPriority = await Issue.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const byStatus = await Issue.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalProjects,
          totalIssues,
          openIssues: todo,
          inProgressIssues: inProgress,
          completedIssues: done,
          highPriorityIssues: highPriority,
        },
        charts: {
          byStatus: byStatus.map((s) => ({ label: s._id, count: s.count })),
          byPriority: byPriority.map((p) => ({ label: p._id, count: p.count })),
        },
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
}
