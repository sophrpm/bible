import { atlasData } from '../services/atlas';
import { Router } from 'express';
import { references } from '../services/references';
import { graphSample, bibleStatistics, verseInformation } from '../services/connections';

const router = Router();

router.get('/references', (request, response) => {
  response.json(
    references(
      String(request.query.id || 'JHN.1.1'),
      String(request.query.direction || 'both'),
      Number(request.query.min) || 0,
    ),
  );
});

router.get('/graph', (_request, response) => {
  response.json(graphSample());
});

router.get('/stats', (_request, response) => {
  response.json(bibleStatistics());
});

router.get('/verse-info', (request, response) => {
  const id = String(request.query.id || 'JHN.1.1');
  const version = String(request.query.version || 'LBLA');
  response.json(verseInformation(version, id));
});

router.get('/atlas-data', (_request, response) => {
  response.json(atlasData());
});
export default router;
