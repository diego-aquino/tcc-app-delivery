import supertest from 'supertest';
import { httpInterceptor } from 'zimic/interceptor/http';
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
import { LocationSchema } from '../src/types/location.generated';
import { LocationCity } from '../src/clients/LocationClient';

httpInterceptor.default.onUnhandledRequest({
  log: false,
});

const locationInterceptor = httpInterceptor.create<LocationSchema>({
  type: 'local',
  baseURL: process.env.LOCATION_API_URL!,
  saveRequests: true,
});

describe('Shipping', () => {
  const cities = {
    saoPaulo: {
      id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDM5MTc2',
      name: 'São Paulo',
      state: { name: 'São Paulo', code: 'SP' },
      country: { name: 'Brasil', code: 'BRA' },
    },
    recife: {
      id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDI4NjQ3',
      name: 'Recife',
      state: { name: 'Pernambuco', code: 'PE' },
      country: { name: 'Brasil', code: 'BRA' },
    },
  } satisfies Record<string, LocationCity>;

  beforeAll(async () => {
    await locationInterceptor.start();

    await app.ready();
  });

  beforeEach(async () => {
    locationInterceptor.get('/cities').respond({
      status: 200,
      body: [],
    });

    locationInterceptor
      .get('/cities/:originId/distances/cities/:destinationId')
      .respond({
        status: 404,
        body: { message: 'Not found' },
      });
  });

  afterEach(async () => {
    locationInterceptor.clear();
  });

  afterAll(async () => {
    await app.close();

    await locationInterceptor.stop();
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

    const cityListHandler = locationInterceptor
      .get('/cities')
      .with({
        searchParams: { query: originCity.name },
      })
      .respond({
        status: 200,
        body: [originCity],
      });

    const distanceInKilometers = 83.9;

    const distanceGetHandler = locationInterceptor
      .get(`/cities/${originCity.id}/distances/cities/${destinationCity.id}`)
      .respond({
        status: 200,
        body: { kilometers: distanceInKilometers },
      });

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

    expect(cityListHandler.requests()).toHaveLength(2);
    expect(distanceGetHandler.requests()).toHaveLength(1);
  });

  test('caso 2: deve retornar o valor correto do frete entre duas cidades que não estão no mesmo estado', async () => {
    const originCity = cities.saoPaulo;
    const destinationCity = cities.recife;

    const originCityListHandler = locationInterceptor
      .get('/cities')
      .with({
        searchParams: { query: originCity.name },
      })
      .respond({
        status: 200,
        body: [originCity],
      });

    const destinationCityListHandler = locationInterceptor
      .get('/cities')
      .with({
        searchParams: { query: destinationCity.name },
      })
      .respond({
        status: 200,
        body: [destinationCity],
      });

    const distanceInKilometers = 2133.1;

    const distanceGetHandler = locationInterceptor
      .get(`/cities/${originCity.id}/distances/cities/${destinationCity.id}`)
      .respond({
        status: 200,
        body: { kilometers: distanceInKilometers },
      });

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

    expect(originCityListHandler.requests()).toHaveLength(1);
    expect(destinationCityListHandler.requests()).toHaveLength(1);
    expect(distanceGetHandler.requests()).toHaveLength(1);
  });

  test('caso 3: deve retornar uma resposta de erro quando alguma cidade não foi encontrada', async () => {
    const originCity = cities.saoPaulo;
    const destinationCity = cities.recife;

    const originCityListHandler = locationInterceptor
      .get('/cities')
      .with({
        searchParams: { query: originCity.name },
      })
      .respond({
        status: 200,
        body: [originCity],
      });

    const destinationCityListHandler = locationInterceptor
      .get('/cities')
      .with({
        searchParams: { query: destinationCity.name },
      })
      .respond({
        status: 200,
        body: [],
      });

    const distanceGetHandler = locationInterceptor
      .get('/cities/:originId/distances/cities/:destinationId')
      .respond({
        status: 404,
        body: { message: 'Not found' },
      });

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

    expect(originCityListHandler.requests()).toHaveLength(1);
    expect(destinationCityListHandler.requests()).toHaveLength(1);
    expect(distanceGetHandler.requests()).toHaveLength(0);
  });

  test('caso 4: deve retornar uma resposta de erro quando não for possível utilizar a API de localização por um erro desconhecido', async () => {
    const originCity = cities.saoPaulo;
    const destinationCity = cities.recife;

    const errorCityListHandler = locationInterceptor.get('/cities').respond({
      status: 500,
      body: { message: 'Internal server error' },
    });

    const errorDistanceGetHandler = locationInterceptor
      .get('/cities/:originCityId/distances/cities/:destinationCityId')
      .respond({
        status: 500,
        body: { message: 'Internal server error' },
      });

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

    const errorCityListRequests = errorCityListHandler.requests();
    expect(errorCityListRequests).toHaveLength(2);

    const searchParams = errorCityListRequests
      .map((request) => Object.fromEntries(request.searchParams))
      .sort((params, otherParams) =>
        params.query.localeCompare(otherParams.query),
      );

    type SearchParams =
      LocationSchema['/cities']['GET']['request']['searchParams'];

    expect(searchParams).toEqual<SearchParams[]>([
      { query: destinationCity.name },
      { query: originCity.name },
    ]);

    expect(errorDistanceGetHandler.requests()).toHaveLength(0);
  });
});
