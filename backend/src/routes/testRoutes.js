import { Router } from 'express';
import {
  listTests,
  getTestBySlug,
  submitTestAttempt,
  listTestAttempts,
} from '../controllers/testController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, listTests);
router.get('/attempts', requireAuth, listTestAttempts);
router.get('/:slug', optionalAuth, getTestBySlug);
router.post('/:slug/attempts', requireAuth, submitTestAttempt);

export default router;
