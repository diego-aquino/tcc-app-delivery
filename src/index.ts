import app from './app';
import { loadSwagger } from './swagger';

loadSwagger().then(async () => {
  await app.listen({
    port: Number(process.env.PORT),
  });
});
