import Project from '../models/Project.js';
import Issue from '../models/Issue.js';
import Activity from '../models/Activity.js';

export async function getProjects(req, res, next) {
  try {
    const filter =
      req.user.role === 'admin'
        ? {}
        : { createdBy: req.user._id };

    const projects = await Project.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const withCounts = await Promise.all(
      projects.map(async (project) => {
        const issueCount = await Issue.countDocuments({ projectId: project._id });
        return { ...project.toObject(), issueCount };
      })
    );

    res.json({ success: true, data: { projects: withCounts } });
  } catch (error) {
    next(error);
  }
}

export async function createProject(req, res, next) {
  try {
    if (req.user.role === 'member') {
      // Members can create projects they own
    }

    const project = await Project.create({
      name: req.body.name,
      description: req.body.description || '',
      createdBy: req.user._id,
    });

    await project.populate('createdBy', 'name email');

    const io = req.app.get('io');
    io?.emit('project:created', project);

    res.status(201).json({
      success: true,
      message: 'Project created',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id).populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (
      req.user.role !== 'admin' &&
      project.createdBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this project' });
    }

    const issues = await Issue.find({ projectId: project._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const activities = await Activity.find({ projectId: project._id })
      .populate('userId', 'name email')
      .populate('issueId', 'title status priority')
      .sort({ createdAt: -1 })
      .limit(20);

    const stats = {
      total: issues.length,
      todo: issues.filter((i) => i.status === 'To Do').length,
      inProgress: issues.filter((i) => i.status === 'In Progress').length,
      done: issues.filter((i) => i.status === 'Done').length,
      high: issues.filter((i) => i.priority === 'High').length,
    };

    res.json({
      success: true,
      data: { project, issues, activities, stats },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (
      req.user.role !== 'admin' &&
      project.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
    }

    if (req.body.name !== undefined) project.name = req.body.name;
    if (req.body.description !== undefined) project.description = req.body.description;

    await project.save();
    await project.populate('createdBy', 'name email');

    const io = req.app.get('io');
    io?.emit('project:updated', project);

    res.json({
      success: true,
      message: 'Project updated',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (
      req.user.role !== 'admin' &&
      project.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
    }

    const issueIds = await Issue.find({ projectId: project._id }).distinct('_id');
    await Activity.deleteMany({ issueId: { $in: issueIds } });
    await Issue.deleteMany({ projectId: project._id });
    await project.deleteOne();

    const io = req.app.get('io');
    io?.emit('project:deleted', { id: project._id });

    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
}
