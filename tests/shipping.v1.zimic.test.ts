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

httpInterceptor.default.onUnhandledRequest({ log: false });

const locationInterceptor = httpInterceptor.create<LocationSchema>({
  type: 'local',
  baseURL: process.env.LOCATION_API_URL!,
  saveRequests: true,
});

describe('Shipping', () => {
  beforeAll(async () => {
    await locationInterceptor.start();

    await app.ready();
  });

  beforeEach(async () => {
    locationInterceptor.get('/cities').respond({
      status: 200,
      body: [],
    });

    locationInterceptor.get('/cities/distances').respond({
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

    const originCityListHandler = locationInterceptor
      .get('/cities')
      .with({ searchParams: { query: originCitySearchName } })
      .respond({
        status: 200,
        body: [originCity],
      });

    const destinationCityListHandler = locationInterceptor
      .get('/cities')
      .with({ searchParams: { query: destinationCitySearchName } })
      .respond({
        status: 200,
        body: [destinationCity],
      });

    const distanceInKilometers = 83.9;

    const distanceGetHandler = locationInterceptor
      .get('/cities/distances')
      .with({
        searchParams: {
          originCityId: originCity.id,
          destinationCityId: destinationCity.id,
        },
      })
      .respond({
        status: 200,
        body: { kilometers: distanceInKilometers },
      });

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

    expect(originCityListHandler.requests()).toHaveLength(1);
    expect(destinationCityListHandler.requests()).toHaveLength(1);
    expect(distanceGetHandler.requests()).toHaveLength(1);
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

    const originCityListHandler = locationInterceptor
      .get('/cities')
      .with({ searchParams: { query: originCitySearchName } })
      .respond({
        status: 200,
        body: [originCity],
      });

    const destinationCityListHandler = locationInterceptor
      .get('/cities')
      .with({ searchParams: { query: destinationCitySearchName } })
      .respond({
        status: 200,
        body: [destinationCity],
      });

    const distanceInKilometers = 2133.1;

    const distanceGetHandler = locationInterceptor
      .get('/cities/distances')
      .with({
        searchParams: {
          originCityId: originCity.id,
          destinationCityId: destinationCity.id,
        },
      })
      .respond({
        status: 200,
        body: { kilometers: distanceInKilometers },
      });

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

    expect(originCityListHandler.requests()).toHaveLength(1);
    expect(destinationCityListHandler.requests()).toHaveLength(1);
    expect(distanceGetHandler.requests()).toHaveLength(1);
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

    const originCityListHandler = locationInterceptor
      .get('/cities')
      .with({ searchParams: { query: originCitySearchName } })
      .respond({
        status: 200,
        body: [originCity],
      });

    const destinationCityListHandler = locationInterceptor
      .get('/cities')
      .with({ searchParams: { query: destinationCitySearchName } })
      .respond({
        status: 200,
        body: [],
      });

    const distanceGetHandler = locationInterceptor
      .get('/cities/distances')
      .respond({
        status: 404,
        body: { message: 'Not found' },
      });

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

    expect(originCityListHandler.requests()).toHaveLength(1);
    expect(destinationCityListHandler.requests()).toHaveLength(1);
    expect(distanceGetHandler.requests()).toHaveLength(0);
  });

  /**
   * Teste 4: Deve retornar uma resposta de erro quando não for possível
   * utilizar a API de localização por um erro desconhecido.
   */
  test('case 4', async () => {
    const originCitySearchName = 'São Paulo, SP';
    const destinationCitySearchName = 'Recife, PE';

    const originCityListHandler = locationInterceptor
      .get('/cities')
      .with({ searchParams: { query: originCitySearchName } })
      .respond({
        status: 500,
        body: { message: 'Internal server error' },
      });

    const destinationCityListHandler = locationInterceptor
      .get('/cities')
      .with({ searchParams: { query: destinationCitySearchName } })
      .respond({
        status: 500,
        body: { message: 'Internal server error' },
      });

    const distanceGetHandler = locationInterceptor
      .get('/cities/distances')
      .respond({
        status: 500,
        body: { message: 'Internal server error' },
      });

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

    expect(originCityListHandler.requests()).toHaveLength(1);
    expect(destinationCityListHandler.requests()).toHaveLength(1);
    expect(distanceGetHandler.requests()).toHaveLength(0);
  });
});
