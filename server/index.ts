import { enrichExistingBibles } from './services/enrichment';
import { createApp } from './app';
import { seed } from './services/seed';

// Bootstrap is the only module that binds the application to a network port.
seed();
enrichExistingBibles();

const app = await createApp();
const port = Number(process.env.PORT) || 3000;

app.listen(port, '127.0.0.1', () => {
  console.log(`Concordia: http://localhost:${port}`);
});
