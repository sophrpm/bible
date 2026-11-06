import { Router } from 'express';
import multer from 'multer';
import { listVersions } from '../services/reading';
import { importVersion } from '../services/import';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const router = Router();
const uploadBible = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

router.get('/versions', (_request, response) => {
  response.json(listVersions());
});

router.post('/versions/import', uploadBible.single('file'), (request, response) => {
  if (!request.file) {
    response.status(400).json({ error: 'Selecciona un archivo SQLite3.' });
    return;
  }

  try {
    const filename =
      typeof request.body?.filename === 'string'
        ? request.body.filename
        : request.file.originalname;
    const id = importVersion(request.file.buffer, filename);
    response.status(201).json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo importar la versión.';
    response.status(400).json({ error: message });
  }
});

export default router;
