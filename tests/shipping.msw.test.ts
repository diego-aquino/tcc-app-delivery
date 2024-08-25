import { setupServer } from 'msw/node';
import { http } from 'msw';
import supertest from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';

import app, { CalculateShippingQuery } from '../src/server/app';
import { LocationCity } from '../src/clients/LocationClient';

const LOCATION_API_URL = process.env.LOCATION_API_URL;

const interceptorServer = setupServer(
  http.get(`${LOCATION_API_URL}/cities`, () => {
    return Response.json([]);
  }),
  http.get(`${LOCATION_API_URL}/cities/distances`, () => {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }),
);

describe('Shipping', () => {
  const cities = {
    saoPaulo: {
      id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDM5MTc2',
      name: 'São Paulo',
      stateName: 'São Paulo',
      stateCode: 'SP',
      countryName: 'Brasil',
      countryCode: 'BRA',
    },
    recife: {
      id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDI4NjQ3',
      name: 'Recife',
      stateName: 'Pernambuco',
      stateCode: 'PE',
      countryName: 'Brasil',
      countryCode: 'BRA',
    },
  } satisfies Record<string, LocationCity>;

  beforeAll(async () => {
    interceptorServer.listen({
      onUnhandledRequest: 'bypass',
    });

    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    interceptorServer.resetHandlers();
  });

  afterAll(async () => {
    await app.close();

    interceptorServer.close();
  });

  test.skip('exemplo', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: cities.saoPaulo.name,
        destinationCityName: cities.recife.name,
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
  });

  test('caso 1: deve retornar um frete gratuito quando as duas cidades estão no mesmo estado', async () => {
    const originCity = cities.saoPaulo;
    const destinationCity = originCity;

    interceptorServer.use(
      http.get(`${LOCATION_API_URL}/cities`, ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get('query') === originCity.name) {
          return Response.json([originCity]);
        }
        if (url.searchParams.get('query') === destinationCity.name) {
          return Response.json([destinationCity]);
        }

        return Response.json([]);
      }),
    );

    const distanceInKilometers = 83.9;

    interceptorServer.use(
      http.get(`${LOCATION_API_URL}/cities/distances`, ({ request }) => {
        const url = new URL(request.url);

        if (
          url.searchParams.get('originCityId') === originCity.id &&
          url.searchParams.get('destinationCityId') === destinationCity.id
        ) {
          return Response.json({ kilometers: distanceInKilometers });
        }

        return Response.json({ message: 'Not found' }, { status: 404 });
      }),
    );

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: originCity.name,
        destinationCityName: destinationCity.name,
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      distanceInKilometers: distanceInKilometers,
      costInCents: 0,
    });
  });

  test('caso 2: deve retornar o valor correto do frete entre duas cidades que não estão no mesmo estado', async () => {
    const originCity = cities.saoPaulo;
    const destinationCity = cities.recife;

    interceptorServer.use(
      http.get(`${LOCATION_API_URL}/cities`, ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get('query') === originCity.name) {
          return Response.json([originCity]);
        }
        if (url.searchParams.get('query') === destinationCity.name) {
          return Response.json([destinationCity]);
        }

        return Response.json([]);
      }),
    );

    const distanceInKilometers = 2133.1;

    interceptorServer.use(
      http.get(`${LOCATION_API_URL}/cities/distances`, ({ request }) => {
        const url = new URL(request.url);

        if (
          url.searchParams.get('originCityId') === originCity.id &&
          url.searchParams.get('destinationCityId') === destinationCity.id
        ) {
          return Response.json({ kilometers: distanceInKilometers });
        }

        return Response.json({ message: 'Not found' }, { status: 404 });
      }),
    );

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: originCity.name,
        destinationCityName: destinationCity.name,
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      distanceInKilometers: distanceInKilometers,
      costInCents: 6277,
    });
  });

  test('caso 3: deve retornar uma resposta de erro quando alguma cidade não foi encontrada', async () => {
    const originCity = cities.saoPaulo;
    const destinationCity = cities.recife;

    interceptorServer.use(
      http.get(`${LOCATION_API_URL}/cities`, ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get('query') === originCity.name) {
          return Response.json([originCity]);
        }

        return Response.json([]);
      }),
    );

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: originCity.name,
        destinationCityName: destinationCity.name,
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Destination city not found',
    });
  });

  test('caso 4: deve retornar uma resposta de erro quando não for possível utilizar a API de localização por um erro desconhecido', async () => {
    const originCity = cities.saoPaulo;
    const destinationCity = cities.recife;

    interceptorServer.use(
      http.get(`${LOCATION_API_URL}/cities`, () => {
        return Response.json(
          { message: 'Internal server error' },
          { status: 500 },
        );
      }),
    );

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: originCity.name,
        destinationCityName: destinationCity.name,
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Internal server error',
    });
  });
});
