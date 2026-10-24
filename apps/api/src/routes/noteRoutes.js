import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/notes', async (req, res, next) => {
  try {
    const notes = await prisma.note.findMany({
      where: { userId: req.user.id },
      include: {
        subject: true,
        topic: true
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
});

router.post('/notes', async (req, res, next) => {
  try {
    const { title, subjectId, topicId, contentMarkdown, tags, isAiGenerated } = req.body;
    const note = await prisma.note.create({
      data: {
        userId: req.user.id,
        title: title || 'Untitled Note',
        subjectId: subjectId || null,
        topicId: topicId || null,
        contentMarkdown: contentMarkdown || '',
        tags: tags || null,
        isAiGenerated: Boolean(isAiGenerated)
      },
      include: {
        subject: true,
        topic: true
      }
    });
    res.status(201).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});

router.put('/notes/:id', async (req, res, next) => {
  try {
    const { title, contentMarkdown, tags, subjectId, topicId } = req.body;
    const note = await prisma.note.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(contentMarkdown !== undefined && { contentMarkdown }),
        ...(tags !== undefined && { tags }),
        ...(subjectId !== undefined && { subjectId }),
        ...(topicId !== undefined && { topicId })
      },
      include: {
        subject: true,
        topic: true
      }
    });
    res.json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});

router.delete('/notes/:id', async (req, res, next) => {
  try {
    await prisma.note.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Note deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
