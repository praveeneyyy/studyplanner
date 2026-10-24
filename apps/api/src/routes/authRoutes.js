import { Router } from 'express';
import { AuthService } from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { RegisterRequestSchema, LoginRequestSchema, QuickLoginRequestSchema, UpdateProfileSchema } from '@ai-study/shared-schemas';

const router = Router();

router.post('/register', validateBody(RegisterRequestSchema), async (req, res, next) => {
  try {
    const result = await AuthService.register(req.validatedBody);
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/login', validateBody(LoginRequestSchema), async (req, res, next) => {
  try {
    const result = await AuthService.login(req.validatedBody);
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/quick-login', validateBody(QuickLoginRequestSchema), async (req, res, next) => {
  try {
    const result = await AuthService.quickLogin(req.validatedBody);
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/guest', async (req, res, next) => {
  try {
    const result = await AuthService.guestLogin();
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await AuthService.getMe(req.user.id);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
});

router.put('/profile', requireAuth, validateBody(UpdateProfileSchema), async (req, res, next) => {
  try {
    const updated = await AuthService.updateProfile(req.user.id, req.validatedBody);
    res.json({ success: true, data: { user: updated } });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

router.get('/export', requireAuth, async (req, res, next) => {
  try {
    const exportData = await AuthService.exportUserData(req.user.id);
    res.setHeader('Content-Disposition', 'attachment; filename="study-planner-export.json"');
    res.json(exportData);
  } catch (err) {
    next(err);
  }
});

router.delete('/profile', requireAuth, async (req, res, next) => {
  try {
    await AuthService.deleteAccount(req.user.id);
    res.clearCookie('token');
    res.json({ success: true, message: 'Account permanently deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
