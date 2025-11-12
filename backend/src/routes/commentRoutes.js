import { Router } from 'express';

import {
  createComment,
  listComments,
  resolveComment,
} from '../controllers/commentController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, requireRole('student'), createComment);
router.get('/', requireAuth, listComments);
router.patch('/:commentId/resolve', requireAuth, requireRole('teacher'), resolveComment);

export default router;
