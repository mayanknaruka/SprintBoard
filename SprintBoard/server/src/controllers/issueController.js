import Issue, { ISSUE_PRIORITIES, ISSUE_STATUSES } from '../models/Issue.js';
import Project from '../models/Project.js';
import Activity from '../models/Activity.js';
import { logActivity } from '../utils/activity.js';

const STATUS_QUERY_MAP = {
  'to-do': 'To Do',
  todo: 'To Do',
  'to do': 'To Do',
  'in-progress': 'In Progress',
  inprogress: 'In Progress',
  'in progress': 'In Progress',
  done: 'Done',
};

const PRIORITY_QUERY_MAP = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

function normalizeStatus(value) {
  if (!value) return undefined;
  if (ISSUE_STATUSES.includes(value)) return value;
  return STATUS_QUERY_MAP[String(value).toLowerCase()];
}

function normalizePriority(value) {
  if (!value) return undefined;
  if (ISSUE_PRIORITIES.includes(value)) return value;
  return PRIORITY_QUERY_MAP[String(value).toLowerCase()];
}

async function assertProjectAccess(projectId, user) {
  const project = await Project.findById(projectId);
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.role !== 'admin' && project.createdBy.toString() !== user._id.toString()) {
    const err = new Error('Not authorized for this project');
    err.statusCode = 403;
    throw err;
  }
  return project;
}

export async function getIssues(req, res, next) {
  try {
    const {
      status,
      priority,
      project,
      projectId,
      search,
      q,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    const normalizedStatus = normalizeStatus(status);
    if (status && !normalizedStatus) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${ISSUE_STATUSES.join(', ')} (or to-do, in-progress, done)`,
      });
    }
    if (normalizedStatus) filter.status = normalizedStatus;

    const normalizedPriority = normalizePriority(priority);
    if (priority && !normalizedPriority) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Allowed: ${ISSUE_PRIORITIES.join(', ')}`,
      });
    }
    if (normalizedPriority) filter.priority = normalizedPriority;

    const projectFilter = project || projectId;
    if (projectFilter) {
      await assertProjectAccess(projectFilter, req.user);
      filter.projectId = projectFilter;
    } else if (req.user.role !== 'admin') {
      const owned = await Project.find({ createdBy: req.user._id }).distinct('_id');
      filter.projectId = { $in: owned };
    }

    const searchTerm = (search || q || '').trim();
    if (searchTerm) {
      filter.title = { $regex: searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .populate('createdBy', 'name email')
        .populate('projectId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Issue.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        issues,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createIssue(req, res, next) {
  try {
    const { title, description, status, priority, projectId } = req.body;
    await assertProjectAccess(projectId, req.user);

    const issue = await Issue.create({
      title,
      description: description || '',
      status: status || 'To Do',
      priority: priority || 'Medium',
      projectId,
      createdBy: req.user._id,
    });

    await issue.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'projectId', select: 'name' },
    ]);

    const io = req.app.get('io');
    await logActivity({
      userId: req.user._id,
      issueId: issue._id,
      projectId,
      action: `${req.user.name} created issue "${issue.title}"`,
      io,
    });

    io?.to(`project:${projectId}`).emit('issue:created', issue);
    io?.emit('stats:changed');

    res.status(201).json({
      success: true,
      message: 'Issue created',
      data: { issue },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateIssue(req, res, next) {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    await assertProjectAccess(issue.projectId, req.user);

    const previousStatus = issue.status;
    const changes = [];

    if (req.body.title !== undefined && req.body.title !== issue.title) {
      changes.push(`title to "${req.body.title}"`);
      issue.title = req.body.title;
    }
    if (req.body.description !== undefined) {
      issue.description = req.body.description;
    }
    if (req.body.priority !== undefined && req.body.priority !== issue.priority) {
      changes.push(`priority from ${issue.priority} to ${req.body.priority}`);
      issue.priority = req.body.priority;
    }
    if (req.body.status !== undefined && req.body.status !== issue.status) {
      changes.push(`status from ${issue.status} to ${req.body.status}`);
      issue.status = req.body.status;
    }

    await issue.save();
    await issue.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'projectId', select: 'name' },
    ]);

    const io = req.app.get('io');

    let action;
    if (req.body.status !== undefined && req.body.status !== previousStatus) {
      action = `${req.user.name} changed issue status from ${previousStatus} to ${issue.status}`;
    } else if (changes.length) {
      action = `${req.user.name} updated issue "${issue.title}" (${changes.join(', ')})`;
    } else {
      action = `${req.user.name} updated issue "${issue.title}"`;
    }

    await logActivity({
      userId: req.user._id,
      issueId: issue._id,
      projectId: issue.projectId._id || issue.projectId,
      action,
      io,
    });

    io?.to(`project:${issue.projectId._id || issue.projectId}`).emit('issue:updated', issue);
    io?.emit('stats:changed');

    res.json({
      success: true,
      message: 'Issue updated',
      data: { issue },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteIssue(req, res, next) {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    await assertProjectAccess(issue.projectId, req.user);

    const projectId = issue.projectId;
    const title = issue.title;
    const issueId = issue._id;
    const io = req.app.get('io');

    await Activity.create({
      userId: req.user._id,
      issueId,
      projectId,
      action: `${req.user.name} deleted issue "${title}"`,
    });

    await issue.deleteOne();

    io?.to(`project:${projectId}`).emit('issue:deleted', { id: String(issueId), projectId });
    io?.emit('stats:changed');

    res.json({ success: true, message: 'Issue deleted' });

  } catch (error) {
    next(error);
  }
}
