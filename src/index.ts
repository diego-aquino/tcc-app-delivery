import app from './server/app';
import { loadSwagger } from './server/swagger';

loadSwagger().then(async () => {
  await app.listen({
    port: Number(process.env.PORT),
  });
});
