import fastify from 'fastify';
import { z } from 'zod';
import LocationClient, { LocationCity } from './services/location';
import { handleServerError } from './errors';

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

const SHIPPING_COST_BY_KILOMETER = 1 / 50; // R$ 1,00 a cada 50 km
const SHIPPING_COST_BY_KILOGRAM = 1 / 0.5; // R$ 1,00 a cada 500 g
const SHIPPING_COST_BY_LITER = 1 / 1; // R$ 1,00 a cada 1 L

function calculateShippingCost(
  originCity: LocationCity,
  destinationCity: LocationCity,
  distanceInKilometers: number,
  weightInKilograms: number,
  volumeInLiters: number,
) {
  const haveSameState =
    originCity.stateCode === destinationCity.stateCode &&
    originCity.countryCode === destinationCity.countryCode;

  if (haveSameState) {
    return 0;
  }

  const cost =
    distanceInKilometers * SHIPPING_COST_BY_KILOMETER +
    weightInKilograms * SHIPPING_COST_BY_KILOGRAM +
    volumeInLiters * SHIPPING_COST_BY_LITER;

  const costInCents = Math.ceil(cost * 100);
  return costInCents;
}

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
