import { LocationCity } from '../clients/location';

const SHIPPING_COST_BY_KILOMETER = 1 / 50; // R$ 1,00 a cada 50 km
const SHIPPING_COST_BY_KILOGRAM = 1 / 0.5; // R$ 1,00 a cada 500 g
const SHIPPING_COST_BY_LITER = 1 / 1; // R$ 1,00 a cada 1 L

export function calculateShippingCost(
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
