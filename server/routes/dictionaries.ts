import { Router } from 'express';
import multer from 'multer';
import { dictionaryEntries, importDictionary, listDictionaries } from '../services/dictionaries';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 256 * 1024 * 1024, files: 1 },
});
router.get('/dictionaries', (_request, response) => {
  response.json(listDictionaries());
});
router.post('/dictionaries/import', upload.single('file'), (request, response) => {
  if (!request.file) {
    response.status(400).json({ error: 'Selecciona un diccionario SQLite3.' });
    return;
  }
  try {
    const filename =
      typeof request.body.filename === 'string' ? request.body.filename : request.file.originalname;
    response.status(201).json({ id: importDictionary(request.file.buffer, filename) });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
});
router.get('/dictionary', (request, response) => {
  const query = String(request.query.q || '').trim();
  if (!query) {
    response.json({ items: [], more: false });
    return;
  }
  response.json(
    dictionaryEntries(
      query,
      String(request.query.ids || '')
        .split(',')
        .filter(Boolean),
      request.query.exact === '1',
      Math.max(0, Math.floor(Number(request.query.offset) || 0)),
    ),
  );
});
export default router;
