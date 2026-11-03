import mongoose from 'mongoose';

export const ISSUE_STATUSES = ['To Do', 'In Progress', 'Done'];
export const ISSUE_PRIORITIES = ['Low', 'Medium', 'High'];

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ISSUE_STATUSES,
      default: 'To Do',
      index: true,
    },
    priority: {
      type: String,
      enum: ISSUE_PRIORITIES,
      default: 'Medium',
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

issueSchema.index({ title: 'text' });
issueSchema.index({ projectId: 1, status: 1, priority: 1 });

export default mongoose.model('Issue', issueSchema);
