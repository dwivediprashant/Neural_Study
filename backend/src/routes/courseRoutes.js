import { Router } from 'express';
import { getCourses, createCourse } from '../controllers/courseController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, getCourses);
router.post('/', requireAuth, createCourse);

export default router;
