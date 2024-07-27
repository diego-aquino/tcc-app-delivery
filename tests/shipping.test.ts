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

describe('Shipping', () => {
  beforeAll(async () => {
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {});

  afterAll(async () => {
    await app.close();
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
    // Implemente aqui...
  });

  /**
   * Teste 2: Deve retornar o valor correto do frete entre duas cidades que não
   * estão no mesmo estado.
   */
  test('case 2', async () => {
    // Implemente aqui...
  });

  /**
   * Teste 3: Deve retornar uma resposta de erro quando alguma cidade não foi
   * encontrada.
   */
  test('case 3', async () => {
    // Implemente aqui...
  });

  /**
   * Teste 4: Deve retornar uma resposta de erro quando não for possível
   * utilizar a API de localização por um erro desconhecido.
   */
  test('case 4', async () => {
    // Implemente aqui...
  });
});
