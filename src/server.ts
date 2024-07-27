import fastify from 'fastify';
import { z } from 'zod';
import LocationClient from './services/location';
import { handleServerError } from './errors';
import { calculateShippingCost } from './shipping';

const server = fastify({ logger: true });

const api = {
  location: new LocationClient(),
};

const calculateShippingCostSchema = z.object({
  originCityName: z.string().min(1),
  destinationCityName: z.string().min(1),
  weightInKilograms: z.coerce.number().positive(),
  volumeInLiters: z.coerce.number().positive(),
});

server.get('/shipping/calculate', async (request, reply) => {
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

server.setErrorHandler(handleServerError);

export default server;
