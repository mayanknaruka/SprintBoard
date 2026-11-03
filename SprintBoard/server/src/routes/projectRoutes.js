import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.get('/', getProjects);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 100 }),
    body('description').optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  createProject
);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid project ID')],
  validate,
  getProject
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('description').optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  updateProject
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid project ID')],
  validate,
  deleteProject
);

export default router;
