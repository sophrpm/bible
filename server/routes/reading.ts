import { Router } from 'express';
import { listBooks, readChapter, readVerse } from '../services/reading';

const router = Router();

router.get('/books', (request, response) => {
  const version = String(request.query.version || 'LBLA');
  response.json(listBooks(version));
});

router.get('/chapter', (request, response) => {
  const version = String(request.query.version || 'LBLA');
  const book = String(request.query.book || 'JHN');
  const chapter = Number(request.query.chapter || 1);
  response.json(readChapter(version, book, chapter));
});

router.get('/verse', (request, response) => {
  const version = String(request.query.version || 'LBLA');
  const id = String(request.query.id);
  response.json(readVerse(version, id));
});

export default router;
