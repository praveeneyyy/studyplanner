import { Router } from 'express';
import { SubjectService } from '../services/subjectService.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  CreateSubjectSchema,
  UpdateSubjectSchema,
  CreateExaminationSchema,
  CreateUnitSchema,
  CreateTopicSchema,
  UpdateTopicSchema
} from '@ai-study/shared-schemas';

const router = Router();
router.use(requireAuth);

router.get('/subjects', async (req, res, next) => {
  try {
    const subjects = await SubjectService.listSubjects(req.user.id);
    res.json({ success: true, data: subjects });
  } catch (err) {
    next(err);
  }
});

router.post('/subjects', validateBody(CreateSubjectSchema), async (req, res, next) => {
  try {
    const subject = await SubjectService.createSubject(req.user.id, req.validatedBody);
    res.status(201).json({ success: true, data: subject });
  } catch (err) {
    next(err);
  }
});

router.get('/subjects/:id', async (req, res, next) => {
  try {
    const subject = await SubjectService.getSubject(req.user.id, req.params.id);
    res.json({ success: true, data: subject });
  } catch (err) {
    next(err);
  }
});

router.put('/subjects/:id', validateBody(UpdateSubjectSchema), async (req, res, next) => {
  try {
    const updated = await SubjectService.updateSubject(req.user.id, req.params.id, req.validatedBody);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/subjects/:id', async (req, res, next) => {
  try {
    await SubjectService.deleteSubject(req.user.id, req.params.id);
    res.json({ success: true, message: 'Subject deleted.' });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------
// Examinations
// ----------------------------------------------------
router.post('/examinations', validateBody(CreateExaminationSchema), async (req, res, next) => {
  try {
    const exam = await SubjectService.createExamination(req.user.id, req.validatedBody);
    res.status(201).json({ success: true, data: exam });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------
// Units & Topics
// ----------------------------------------------------
router.post('/subjects/:subjectId/units', async (req, res, next) => {
  try {
    const unit = await SubjectService.createUnit(req.user.id, {
      ...req.body,
      subjectId: req.params.subjectId
    });
    res.status(201).json({ success: true, data: unit });
  } catch (err) {
    next(err);
  }
});

router.post('/units/:unitId/topics', async (req, res, next) => {
  try {
    const topic = await SubjectService.createTopic(req.user.id, {
      ...req.body,
      unitId: req.params.unitId
    });
    res.status(201).json({ success: true, data: topic });
  } catch (err) {
    next(err);
  }
});

router.put('/topics/:id', validateBody(UpdateTopicSchema), async (req, res, next) => {
  try {
    const updated = await SubjectService.updateTopic(req.user.id, req.params.id, req.validatedBody);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/subjects/:id/import-syllabus', async (req, res, next) => {
  try {
    const units = await SubjectService.importSyllabus(req.user.id, req.params.id, req.body.units || []);
    res.status(201).json({ success: true, data: units });
  } catch (err) {
    next(err);
  }
});

export default router;
