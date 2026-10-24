import { Router } from 'express';
import { PlannerService } from '../services/plannerService.js';
import { AIPlanBuilderService } from '../services/aiPlanBuilderService.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  GeneratePlanRequestSchema,
  CompleteSessionRequestSchema,
  RescheduleSessionRequestSchema
} from '@ai-study/shared-schemas';

const router = Router();
router.use(requireAuth);

// Context-aware AI Study Plan Builder endpoints
router.get('/planner/context', async (req, res, next) => {
  try {
    const context = await AIPlanBuilderService.getStudentContext(req.user.id);
    res.json({ success: true, data: context });
  } catch (err) {
    next(err);
  }
});

router.post('/planner/ai-draft', async (req, res, next) => {
  try {
    const { prompt, constraints, history } = req.body || {};
    const result = await AIPlanBuilderService.generatePlanDraft(
      req.user.id,
      prompt,
      constraints || {},
      history || []
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/planner/adjust-draft', async (req, res, next) => {
  try {
    const { draft, action, params } = req.body || {};
    const result = await AIPlanBuilderService.adjustPlanDraft(req.user.id, { draft, action, params });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/planner/confirm-ai-draft', async (req, res, next) => {
  try {
    const draft = req.body.draft || req.body;
    const result = await AIPlanBuilderService.confirmPlanDraft(req.user.id, draft);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/planner/preview', validateBody(GeneratePlanRequestSchema), async (req, res, next) => {
  try {
    const preview = await PlannerService.previewSchedule(req.user.id, req.validatedBody);
    res.json({ success: true, data: preview });
  } catch (err) {
    next(err);
  }
});

router.post('/planner/confirm', validateBody(GeneratePlanRequestSchema), async (req, res, next) => {
  try {
    const confirmed = await PlannerService.confirmSchedule(req.user.id, req.validatedBody);
    res.status(201).json({ success: true, data: confirmed });
  } catch (err) {
    next(err);
  }
});

router.get('/planner/export/ics', async (req, res, next) => {
  try {
    const icsContent = await PlannerService.exportICS(req.user.id, { planId: req.query.planId });
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="study-schedule.ics"');
    res.send(icsContent);
  } catch (err) {
    next(err);
  }
});

router.get('/sessions', async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;
    const sessions = await PlannerService.getSessions(req.user.id, { startDate, endDate, status });
    res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
});

router.post('/sessions/:id/start', async (req, res, next) => {
  try {
    const session = await PlannerService.startSession(req.user.id, req.params.id);
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
});

router.post('/sessions/:id/complete', validateBody(CompleteSessionRequestSchema), async (req, res, next) => {
  try {
    const result = await PlannerService.completeSession(req.user.id, req.params.id, req.validatedBody);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/sessions/:id/reschedule', validateBody(RescheduleSessionRequestSchema), async (req, res, next) => {
  try {
    const session = await PlannerService.rescheduleSession(req.user.id, req.params.id, req.validatedBody);
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
});

router.post('/planner/recover-missed', async (req, res, next) => {
  try {
    const result = await PlannerService.recoverMissedSessions(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/sessions', async (req, res, next) => {
  try {
    const session = await PlannerService.createCustomSession(req.user.id, req.body);
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
});

export default router;
