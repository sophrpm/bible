import { type Server } from 'node:http';
import { type AddressInfo } from 'node:net';
import { createApp } from '../../server/app';
import { seed } from '../../server/services/seed';

/** Tests own an ephemeral loopback port and never depend on the user's preview server. */
export async function startApiServer() {
  seed();
  const app = await createApp({ serveClient: false });
  const server = await new Promise<Server>((resolve, reject) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    listener.once('error', reject);
  });
  const address = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}/api/`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
