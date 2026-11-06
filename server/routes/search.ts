import { Router } from 'express';
import { searchVerses } from '../services/search';

const router = Router();

router.get('/search', (request, response) => {
  const offset = Number(request.query.offset) || 0;
  response.json(
    searchVerses({
      text: String(request.query.q || '').trim(),
      version: String(request.query.version || 'LBLA'),
      book: request.query.book ? String(request.query.book) : undefined,
      testament: request.query.testament ? String(request.query.testament) : undefined,
      offset: Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0,
    }),
  );
});

export default router;
