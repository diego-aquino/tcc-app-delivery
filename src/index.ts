import server from './server';
import { loadServerSwagger } from './swagger';

loadServerSwagger().then(async () => {
  await server.listen({
    port: Number(process.env.PORT),
  });
});
