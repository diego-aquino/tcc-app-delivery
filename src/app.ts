import fastify from 'fastify';
import { z } from 'zod';
import LocationClient from './services/location';
import { handleServerError } from './errors';
import { calculateShippingCost } from './shipping';

const app = fastify({
  logger: true,
  disableRequestLogging: process.env.NODE_ENV === 'test',
});

const api = {
  location: new LocationClient(),
};

const calculateShippingCostSchema = z.object({
  /** O nome da cidade de origem. */
  originCityName: z.string().min(1),
  /** O nome da cidade de destino. */
  destinationCityName: z.string().min(1),
  /** O peso da encomenda em quilogramas (km). */
  weightInKilograms: z.coerce.number().positive(),
  /** O volume da encomenda em litros (L). */
  volumeInLiters: z.coerce.number().positive(),
});

export type CalculateShippingCostQuery = z.infer<
  typeof calculateShippingCostSchema
>;

app.get('/shipping/calculate', async (request, reply) => {
  const {
    originCityName,
    destinationCityName,
    weightInKilograms,
    volumeInLiters,
  } = calculateShippingCostSchema.parse(request.query);

  const [originCities, destinationCities] = await Promise.all([
    api.location.searchCities(originCityName),
    api.location.searchCities(destinationCityName),
  ]);

  if (originCities.length === 0) {
    return reply.status(400).send({ message: 'Origin city not found' });
  }
  if (destinationCities.length === 0) {
    return reply.status(400).send({ message: 'Destination city not found' });
  }

  const originCity = originCities[0];
  const destinationCity = destinationCities[0];

  const distance = await api.location.calculateDistanceBetweenCities(
    originCity.id,
    destinationCity.id,
  );

  const costInCents = calculateShippingCost(
    originCity,
    destinationCity,
    distance.kilometers,
    weightInKilograms,
    volumeInLiters,
  );

  return reply.status(200).send({
    distanceInKilometers: distance.kilometers,
    costInCents,
  });
});

app.setErrorHandler(handleServerError);

export default app;
