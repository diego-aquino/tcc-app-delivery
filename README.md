# Mocks de API - App de Entregas

Esta aplicação é uma calculadora simplificada de frete para entregas. Ela recebe
o nomes de duas cidades no mundo, o peso e o volume do item e retorna o valor do
frete de entrega. Para isso, a aplicação consulta uma API de localização para
obter os identificadores das cidades e depois requisita a distância em linha
reta entre elas, que é usada para calcular o valor do frete.

## 1. Acesso

Primeiramente, abra este projeto no Stackblitz:

[![Abrir no Stackblitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/diego-aquino/api-mocking-app-delivery?startScript=dev&file=README.md)

Esse link abrirá um editor semelhante ao
[VS Code](https://code.visualstudio.com) no seu navegador, instalará as
dependências com `npm install` e iniciará o servidor com `npm run dev`.

No lado esquerdo, estará a estrutura de pastas do projeto, seguida de um editor
e terminal no centro e um mini-navegador no lado direito.

![Projeto aberto no Stackblitz](./docs/images/project-opened-on-stackblitz.png)

No canto superior esquerdo, clique em "Fork" para salvar o projeto no seu perfil
do Stackblitz. Será necessário fazer login.

![Botão para cópia do projeto no Stackblitz](./docs/images/stackblitz-fork.png)

## 2. Estrutura

Este projeto utiliza [Node.js](https://nodejs.org) com
[TypeScript](https://www.typescriptlang.org), [Fastify](https://fastify.dev),
[Axios](https://axios-http.com) e [Vitest](https://vitest.dev).

Arquivos importantes:

- [`src/server/app.ts`](./src/server/app.ts): arquivo principal da aplicação
  onde o servidor está implementado.
- [`src/clients/location.ts`](./src/clients/location.ts): classe que faz as
  chamadas HTTP para a API de localização.
- [`src/utils/shipping.ts`](./src/utils/shipping.ts): implementação da lógica de
  cálculo do frete.
- [`tests/shipping.test.ts`](./tests/shipping.test.ts): arquivo com os testes do
  cálculo do frete.

Comandos úteis:

- `npm run dev`: inicia o servidor em modo de desenvolvimento.
- `npm run test`: executa os testes da aplicação.
- `npm run types:check`: verifica se não há erros de tipagem no código.

A URL da API de localização está declarada no arquivo
[`.env.development`](./.env.development). Ela está disponível em duas versões:

| Versão | URL                                    |
| ------ | -------------------------------------- |
| v1     | https://v1-location-d8b1dd3.vercel.app |
| v2     | https://v2-location-d8b1dd3.vercel.app |

> [!TIP]
>
> Acesse os links acima para ver a documentação de cada versão da API.

## 3. Atividade

### Parte 1: Criação de testes

Na primeira parte da atividade, vamos implementar uma suite de testes para esta
aplicação. Você deve utilizar **uma** das duas ferramentas de mocks de API
planejadas, [MSW](https://mswjs.io) ou
[Zimic](https://github.com/zimicjs/zimic), de acordo com a sua alocação para o
App de Delivery [nesta planilha](). @TODO ADICIONAR LINK DA PLANILHA

Você deverá implementar **quatro** casos de teste no arquivo
[`tests/shipping.test.ts`](./tests/shipping.test.ts). A escolha de quais
aspectos da aplicação testar é livre, contanto que:

1. Todos os quatros testes utilizem mocks de API;
2. Pelo menos um caso de teste valide um fluxo de sucesso;
3. Pelo menos um caso de teste valide um fluxo de erro.

Para executar os testes, utilize o comando `npm run test`. Ao realizar mudanças
na aplicação ou nos testes, a suite será executada automaticamente.

![Executando os testes no Stackblitz](./docs/images/stackblitz-tests.png)

> [!IMPORTANT]
>
> Considerando os mocks de API, é esperado que a API de localização não seja
> acessada durante a execução testes. Os mocks simularão as respostas da API.

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

Agora, você deve adaptar os testes e os mocks de API para lidar com essas
mudanças. Para executar a suite, naturalmente é necessário também alterar a
aplicação para integrar à nova versão da API. Nesta atividade, o refatoramento
da aplicação não é obrigatório, embora seja recomendado para verificar se os
testes estão funcionando corretamente.

Após realizar as adaptações, salve o link de compartilhamento do projeto usado
nesta parte 2. Você também deverá enviá-lo no formulário de entrega ao final da
atividade, juntamente com o link da parte 1.

## 4. Entrega

Após finalizar as implementações nesta aplicação e no
[App de Compartilhamento](https://github.com/diego-aquino/api-mocking-app-sharing),
preencha o formulário de entrega com os links das partes 1 e 2.

https://forms.gle/FP8gzzaBniawu6EV8
