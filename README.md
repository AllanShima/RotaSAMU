# RotaSAMU

API back-end do **RotaSAMU**, um sistema de apoio ao atendimento de chamados de emergência. Atendentes registram chamados, motoristas atendem aos chamados, os dois lados conversam por mensagens e o sistema calcula rotas e simula a movimentação do veículo até o local da ocorrência.

## Funcionalidades

- **Atendentes e motoristas**: cadastro, login/logout (controle de status online/offline) e consulta de conversas.
- **Chamados de emergência**: registro com protocolo, endereço, condição do paciente e observações; consulta, conclusão e histórico de notificações.
- **Localização do veículo**: consulta da posição atual do veículo vinculado a um chamado.
- **Conversas**: chat entre um atendente e um motorista, criado automaticamente na primeira mensagem ou consulta.
- **Rotas (GPS)**: pré-visualização de rota entre dois pontos via [OSRM](https://project-osrm.org/) e simulação de deslocamento do veículo, com velocidade ajustável.
- **Documentação interativa** da API com Swagger UI.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Runtime | Node.js 22 (ES Modules) |
| Framework | [Fastify](https://fastify.dev/) 5 |
| Validação | [Zod](https://zod.dev/) 4 + `@fastify/type-provider-zod` |
| ORM | [Prisma](https://www.prisma.io/) 7 com `@prisma/adapter-pg` |
| Banco de dados | PostgreSQL 16 |
| Senhas | bcrypt |
| Documentação | `@fastify/swagger` + `@fastify/swagger-ui` |
| Infra local | Docker Compose (API, PostgreSQL e pgAdmin) |

## Estrutura do projeto

```
.
├── docker-compose.yml        # API + PostgreSQL + pgAdmin
└── api/
    ├── Dockerfile            # Multi-stage (base, build, deps, production)
    ├── prisma/
    │   ├── schema.prisma     # Modelos do banco
    │   ├── migrations/       # Migrações SQL
    │   └── generated/zod/    # Schemas Zod gerados a partir do Prisma
    ├── prisma.config.ts      # Configuração do Prisma (usa DATABASE_URL)
    └── src/
        ├── server.js         # Ponto de entrada (porta 3000)
        ├── app.js            # Configuração do Fastify, Swagger e rotas
        ├── config/           # Constantes
        ├── db/               # Cliente Prisma
        ├── utils/            # Erros e schemas compartilhados
        └── modules/
            ├── attendants/
            ├── drivers/
            ├── emergency-calls/
            ├── conversations/
            └── routing/      # Rotas OSRM e simulação de movimento
```

Cada módulo separa as rotas (`*.routes.js`) da lógica de negócio (`*.service.js`). Os imports usam aliases definidos em `package.json` (`#db/*`, `#modules/*`, `#utils/*`, `#config/*`, `#prisma/*`).

## Como executar

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose

### 1. Clonar o repositório

```bash
git clone https://github.com/UInfinitu/RotaSAMU.git
cd RotaSAMU
```

### 2. Criar o arquivo `.env`

Crie um arquivo `.env` na raiz do projeto (ao lado do `docker-compose.yml`). Ele não é versionado.

```env
# Banco de dados
DB_USER=rotasamu
DB_PASSWORD=troque-esta-senha
DB_NAME=rotasamu

# pgAdmin
PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=troque-esta-senha

# Opcionais (valores padrão abaixo)
API_PORT=3000
DB_PORT=5432
PGADMIN_PORT=5050
NODE_ENV=development
```

### 3. Subir os serviços

```bash
docker compose up --build
```

### 4. Aplicar as migrações

Com os containers rodando, em outro terminal:

```bash
docker compose exec api npx prisma migrate deploy
```

### 5. Acessar

| Serviço | URL |
| --- | --- |
| API | http://localhost:3000 |
| Documentação (Swagger UI) | http://localhost:3000/docs |
| pgAdmin | http://localhost:5050 |

As portas mudam se você definiu `API_PORT` ou `PGADMIN_PORT` no `.env`.

## Endpoints

A documentação completa, com os schemas de entrada, fica em `/docs`. Resumo:

### Atendentes (`/attendants`)

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/attendants/:id` | Busca um atendente |
| `POST` | `/attendants` | Cadastra um atendente (`email`, `password`, `phone`) |
| `POST` | `/attendants/login` | Login (`email`, `password`); marca o usuário como `ONLINE` |
| `POST` | `/attendants/logout` | Logout (`id`); marca o usuário como `OFFLINE` |
| `GET` | `/attendants/:id/conversations` | Lista as conversas do atendente |

### Motoristas (`/drivers`)

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/drivers` | Lista os motoristas |
| `GET` | `/drivers/:id` | Busca um motorista |
| `POST` | `/drivers` | Cadastra um motorista (`email`, `password`, `phone`) |
| `POST` | `/drivers/login` | Login; marca o usuário como `ONLINE` |
| `POST` | `/drivers/logout` | Logout; marca o usuário como `OFFLINE` |
| `GET` | `/drivers/:id/conversations` | Lista as conversas do motorista |

### Chamados de emergência (`/emergency-calls`)

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/emergency-calls` | Lista os chamados |
| `GET` | `/emergency-calls/:id` | Busca um chamado |
| `GET` | `/emergency-calls/get_location?id=` | Posição atual (`latitude`, `longitude`) do veículo vinculado ao chamado |
| `POST` | `/emergency-calls` | Registra um chamado |
| `PATCH` | `/emergency-calls/:id/conclude` | Marca o chamado como `FINISHED` |
| `GET` | `/emergency-calls/:id/notifications` | Lista as notificações do chamado, da mais recente para a mais antiga |

Campos de `POST /emergency-calls`: `protocol`, `address`, `returnLocation`, `whatHappened`, `patientCondition`, `apparentAge` (inteiro ou `null`), `patientCount`, `injuryCondition`, `observations` (texto ou `null`) e `attendantId`.

### Conversas (`/conversations`)

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/conversations?attendantId=&driverId=` | Retorna a conversa entre os dois, com as mensagens em ordem cronológica (cria se não existir) |
| `POST` | `/conversations/messages` | Envia uma mensagem (`attendantId`, `driverId`, `senderId`, `text`) |

### Rotas e simulação (`/routing`)

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/routing/preview?originLat=&originLng=&destLat=&destLng=` | Calcula a rota e retorna coordenadas, distância (m) e duração (s) |
| `POST` | `/routing/simulate` | Inicia a simulação de um veículo até o destino (`vehicleId`, `destLat`, `destLng`, `speedMultiplier` e `tickMs` opcionais) |
| `POST` | `/routing/simulate/:vehicleId/stop` | Interrompe a simulação |
| `GET` | `/routing/simulate/:vehicleId/status` | Informa se há simulação ativa (`{ "running": true }`) |

Na simulação, a posição do veículo é atualizada no banco a cada `tickMs` milissegundos (padrão: 1000). A duração simulada é a duração real da rota dividida por `speedMultiplier` (padrão: 6).

## Modelo de dados

```
User ──1:1── Vehicle ──< VehicleEmergencyCall >── EmergencyCall ──< Notification
 │                                                      │
 │                                                      └── attendant (User)
 └──< Conversation ──< Message
```

- **User**: `role` (`DRIVER` ou `ATTENDANT`) e `status` (`ONLINE` ou `OFFLINE`). Os motoristas têm um único veículo.
- **Vehicle**: placa única e posição (`latitude`, `longitude`).
- **EmergencyCall**: dados da ocorrência, com protocolo único.
- **VehicleEmergencyCall**: vínculo entre veículo e chamado, com status `NOT_STARTED`, `IN_PROGRESS` ou `FINISHED`.
- **Conversation** e **Message**: chat entre um atendente e um motorista.
- **Notification**: avisos associados a um chamado.

## Estado atual e limitações

- O login não emite token: ele valida as credenciais e marca o usuário como online. As rotas não exigem autenticação.
- Não há rotas para cadastrar veículos, vincular veículos a chamados ou criar notificações. Esses registros precisam ser inseridos diretamente no banco por enquanto.
- O cálculo de rotas usa o servidor público de demonstração do OSRM (`router.project-osrm.org`), que exige acesso à internet e tem limites de uso.
- Não há testes automatizados nem licença definida.
