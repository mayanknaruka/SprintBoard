import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getIssues,
  createIssue,
  updateIssue,
  deleteIssue,
} from '../controllers/issueController.js';
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from '../models/Issue.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.get('/', getIssues);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('status').optional().isIn(ISSUE_STATUSES).withMessage(`Status must be one of: ${ISSUE_STATUSES.join(', ')}`),
    body('priority')
      .optional()
      .isIn(ISSUE_PRIORITIES)
      .withMessage(`Priority must be one of: ${ISSUE_PRIORITIES.join(', ')}`),
    body('projectId').isMongoId().withMessage('Valid project ID is required'),
  ],
  validate,
  createIssue
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid issue ID'),
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('status').optional().isIn(ISSUE_STATUSES),
    body('priority').optional().isIn(ISSUE_PRIORITIES),
  ],
  validate,
  updateIssue
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid issue ID')],
  validate,
  deleteIssue
);

export default router;
