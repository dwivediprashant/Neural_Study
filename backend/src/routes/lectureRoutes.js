import { Router } from 'express';

import { listLectures, createLecture, getLecture, deleteLecture } from '../controllers/lectureController.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, listLectures);
router.post('/', requireAuth, requireRole('teacher'), createLecture);
router.get('/:lectureId', optionalAuth, getLecture);
router.delete('/:lectureId', requireAuth, requireRole('teacher'), deleteLecture);

export default router;
