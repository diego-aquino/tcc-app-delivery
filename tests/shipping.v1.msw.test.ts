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
import { LocationCity } from '../src/clients/location';

const interceptorServer = setupServer(
  http.get(`${process.env.LOCATION_API_URL}/cities`, () => {
    return Response.json([]);
  }),
  http.get(`${process.env.LOCATION_API_URL}/cities/distances`, () => {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }),
);

describe('Shipping', () => {
  beforeAll(async () => {
    interceptorServer.listen({ onUnhandledRequest: 'bypass' });

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

  /**
   * Exemplo (para habilitar, remova o `.skip`)
   */
  test.skip('example', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
  });

  /**
   * Teste 1: Deve retornar um frete gratuito quando as duas cidades estão no
   * mesmo estado.
   */
  test('case 1', async () => {
    const originCitySearchName = 'São Paulo, SP';

    const originCity: LocationCity = {
      id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDM5MTc2',
      name: 'São Paulo',
      stateName: 'São Paulo',
      stateCode: 'SP',
      countryName: 'Brasil',
      countryCode: 'BRA',
    } satisfies LocationCity;

    const destinationCitySearchName = 'Campinas, SP';

    const destinationCity: LocationCity = {
      id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDM5Mzgx',
      name: 'Campinas',
      stateName: 'São Paulo',
      stateCode: 'SP',
      countryName: 'Brasil',
      countryCode: 'BRA',
    } satisfies LocationCity;

    interceptorServer.use(
      http.get(`${process.env.LOCATION_API_URL}/cities`, ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get('query') === originCitySearchName) {
          return Response.json([originCity]);
        }
        if (url.searchParams.get('query') === destinationCitySearchName) {
          return Response.json([destinationCity]);
        }

        return Response.json([]);
      }),
    );

    const distanceInKilometers = 83.9;

    interceptorServer.use(
      http.get(
        `${process.env.LOCATION_API_URL}/cities/distances`,
        ({ request }) => {
          const url = new URL(request.url);

          if (
            url.searchParams.get('originCityId') === originCity.id &&
            url.searchParams.get('destinationCityId') === destinationCity.id
          ) {
            return Response.json({ kilometers: distanceInKilometers });
          }

          return Response.json({ message: 'Not found' }, { status: 404 });
        },
      ),
    );

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: originCitySearchName,
        destinationCityName: destinationCitySearchName,
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      distanceInKilometers: distanceInKilometers,
      costInCents: 0,
    });
  });

  /**
   * Teste 2: Deve retornar o valor correto do frete entre duas cidades que não
   * estão no mesmo estado.
   */
  test('case 2', async () => {
    const originCitySearchName = 'São Paulo, SP';

    const originCity: LocationCity = {
      id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDM5MTc2',
      name: 'São Paulo',
      stateName: 'São Paulo',
      stateCode: 'SP',
      countryName: 'Brasil',
      countryCode: 'BRA',
    } satisfies LocationCity;

    const destinationCitySearchName = 'Recife, PE';

    const destinationCity: LocationCity = {
      id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDI4NjQ3',
      name: 'Recife',
      stateName: 'Pernambuco',
      stateCode: 'PE',
      countryName: 'Brasil',
      countryCode: 'BRA',
    } satisfies LocationCity;

    interceptorServer.use(
      http.get(`${process.env.LOCATION_API_URL}/cities`, ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get('query') === originCitySearchName) {
          return Response.json([originCity]);
        }
        if (url.searchParams.get('query') === destinationCitySearchName) {
          return Response.json([destinationCity]);
        }

        return Response.json([]);
      }),
    );

    const distanceInKilometers = 2133.1;

    interceptorServer.use(
      http.get(
        `${process.env.LOCATION_API_URL}/cities/distances`,
        ({ request }) => {
          const url = new URL(request.url);

          if (
            url.searchParams.get('originCityId') === originCity.id &&
            url.searchParams.get('destinationCityId') === destinationCity.id
          ) {
            return Response.json({ kilometers: distanceInKilometers });
          }

          return Response.json({ message: 'Not found' }, { status: 404 });
        },
      ),
    );

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: originCitySearchName,
        destinationCityName: destinationCitySearchName,
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      distanceInKilometers: distanceInKilometers,
      costInCents: 6277,
    });
  });

  /**
   * Teste 3: Deve retornar uma resposta de erro quando alguma cidade não foi
   * encontrada.
   */
  test('case 3', async () => {
    const originCitySearchName = 'São Paulo, SP';

    const originCity: LocationCity = {
      id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDM5MTc2',
      name: 'São Paulo',
      stateName: 'São Paulo',
      stateCode: 'SP',
      countryName: 'Brasil',
      countryCode: 'BRA',
    } satisfies LocationCity;

    const destinationCitySearchName = 'Recife, PE';

    interceptorServer.use(
      http.get(`${process.env.LOCATION_API_URL}/cities`, ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get('query') === originCitySearchName) {
          return Response.json([originCity]);
        }

        return Response.json([]);
      }),
    );

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: originCitySearchName,
        destinationCityName: destinationCitySearchName,
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Destination city not found',
    });
  });

  /**
   * Teste 4: Deve retornar uma resposta de erro quando não for possível
   * utilizar a API de localização por um erro desconhecido.
   */
  test('case 4', async () => {
    const originCitySearchName = 'São Paulo, SP';
    const destinationCitySearchName = 'Recife, PE';

    interceptorServer.use(
      http.get(`${process.env.LOCATION_API_URL}/cities`, () => {
        return Response.json(
          { message: 'Internal server error' },
          { status: 500 },
        );
      }),
    );

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: originCitySearchName,
        destinationCityName: destinationCitySearchName,
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Internal server error',
    });
  });
});
