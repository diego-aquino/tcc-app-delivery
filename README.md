# Mocks de API - App de Entregas

Esta aplicação é uma calculadora simplificada de frete para entregas. Ela recebe
o nomes de duas cidades no mundo, o peso e o volume do item e retorna o valor do
frete de entrega. Para isso, a aplicação consulta uma API de localização para
obter os identificadores das cidades e depois requisita a distância em linha
reta entre elas, que é usada para calcular o valor do frete.

## 1. Acesso

Primeiramente, abra este projeto no Stackblitz utilizando o link a seguir:

https://stackblitz.com/github/diego-aquino/api-mocking-app-delivery?startScript=dev&file=README.md

Esse link abrirá um editor semelhante ao
[VS Code](https://code.visualstudio.com) no seu navegador, instalará as
dependências com `npm install` e iniciará o servidor com `npm run dev`.

No lado esquerdo, estará a estrutura de pastas do projeto, seguida de um editor
e terminal no centro e um mini-navegador no lado direito.

![Projeto aberto no Stackblitz](./docs/images/project-opened-on-stackblitz.png)

No canto superior esquerdo, clique em "Fork" para salvar o projeto no seu perfil
do Stackblitz. Você precisará fazer login.

![Botão para cópia do projeto no Stackblitz](./docs/images/stackblitz-fork.png)

## 2. Estrutura

Este projeto utiliza [Node.js](https://nodejs.org) com
[TypeScript](https://www.typescriptlang.org), [Fastify](https://fastify.dev),
[Axios](https://axios-http.com) e [Vitest](https://vitest.dev).

Alguns arquivos importantes:

- [`src/server/app.ts`](./src/server/app.ts): arquivo principal da aplicação
  onde o servidor está implementado.
- [`src/clients/location.ts`](./src/clients/location.ts): classe que faz as
  chamadas HTTP para a API de localização.
- [`src/utils/shipping.ts`](./src/utils/shipping.ts): implementação da lógica de
  cálculo do frete.
- [`tests/shipping.test.ts`](./tests/shipping.test.ts): arquivo com os testes do
  cálculo do frete.

A URL da API de localização está declarada no arquivo
[`.env.development`](./.env.development). Ela está disponível em duas versões:

| Versão | URL                                    |
| ------ | -------------------------------------- |
| v1     | https://v1-location-d8b1dd3.vercel.app |
| v2     | https://v2-location-d8b1dd3.vercel.app |

> [!TIP]
>
> Você pode acessar os links acima para ver a documentação de cada versão da
> API.

## 3. Atividade

### Parte 1: Criação de testes

Na primeira parte da atividade, você implementará uma suite de testes para esta
aplicação. Você deve utilizar **uma** das duas ferramentas de mocks de API
planejadas, [MSW](https://mswjs.io) ou
[Zimic](https://github.com/zimicjs/zimic), de acordo com a sua alocação para o
App de Delivery [nesta planilha](). A API de localização não deve ser acessada
durante os testes, que utilizarão os mocks para simular as respostas da API.

@TODO ADICIONAR LINK DA PLANILHA

Os testes devem ser implementados em
[`tests/shipping.test.ts`](./tests/shipping.test.ts). Esse arquivo já possui um
exemplo de teste e stubs dos quatro casos a serem implementados:

1. Deve retornar um frete gratuito quando as duas cidades estão no mesmo estado;
2. Deve retornar o valor correto do frete entre duas cidades que não estão no
   mesmo estado;
3. Deve retornar uma resposta de erro quando alguma cidade não foi encontrada;
4. Deve retornar uma resposta de erro quando não for possível utilizar a API de
   localização por um erro desconhecido.

Para executar os testes, utilize o comando `npm run test`. Ao realizar mudanças
na aplicação ou nos testes, a suite será executada automaticamente.

![Executando os testes no Stackblitz](./docs/images/stackblitz-tests.png)

> [!IMPORTANT]
>
> É esperado que a API de localização não seja acessada durante a execução
> testes, que utilizarão os mocks para simular as respostas da API.

Após implementar os casos descritos acima, salve o link de compartilhamento do
projeto. Você deverá enviá-lo no formulário de entrega. Confirme que o link está
com visibilidade pública.

![Compartilhando o projeto no Stackblitz](./docs/images/stackblitz-sharing.png)

### Parte 2: Adaptações após mudança na API de localização

Nessa segunda parte, vamos migrar o projeto para utilizar a versão 2 da API de
localização, que possui certas mudanças em relação à versão 1.

Antes de iniciar, crie uma cópia do projeto que você utilizou na parte 1. Para
isso, clique no botão "Fork" no canto superior. O objetivo é manter o projeto da
parte 1 inalterado e utilizar uma cópia dele para migrar para a versão 2 da API.

![Botão para cópia do projeto no Stackblitz](./docs/images/stackblitz-refork.png)

Na cópia criada, você deve alterar o arquivo
[`.env.development`](./.env.development) para utilizar a URL da versão 2 da API,
comentando a linha 4 e descomentando a linha 5.

`.env.development`:

```bash
NODE_ENV=development
PORT=3001

# LOCATION_API_URL=https://v1-location-d8b1dd3.vercel.app
LOCATION_API_URL=https://v2-location-d8b1dd3.vercel.app
```

Se o servidor ou o comando de testes estiverem rodando, você deve reiniciá-los
para que a nova URL seja lida.

Entre as versões 1 e 2 da API, as seguintes modificações foram realizadas:

- A rota `/cities/distances`, em que os identificadores das cidades origem e
  destino eram definidas por meio de parâmetros de query, foi modificada para
  `/cities/:originCityId}/distances/cities/:destinationCityId`, movendo os
  identificadores para parâmetros de rota;
- No retorno das cidades, os seguintes campos foram modificados:
  - `stateName` e `stateCode` agora fazem parte de um objeto `state`, nas
    propriedades `state.name` e `state.code`, respectivamente.
  - `countryName` e `countryCode` agora fazem parte de um objeto `country`, nas
    propriedades `country.name` e `country.code`, respectivamente.

Agora, você deve adaptar a aplicação, os testes e os mocks de API para lidar com
essas mudanças.

Após realizar as adaptações, salve o link de compartilhamento do projeto usado
nesta parte 2. Você também deverá enviá-lo no formulário de entrega ao final da
atividade, juntamente com o link da parte 1.

## 4. Entrega

Após finalizar as implementações nesta aplicação e no
[App de Compartilhamento](https://github.com/diego-aquino/api-mocking-app-sharing),
preencha o formulário de entrega com os links das partes 1 e 2.

@TODO ADICIONAR LINK DO FORMULÁRIO
