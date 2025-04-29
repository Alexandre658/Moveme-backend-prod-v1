# Sistema de Rastreamento de Veículos

Este projeto é uma API construída com Node.js que integra funcionalidades do Firebase (Firestore, Firebase Cloud Messaging), WebSocket via Socket.IO, e autenticação com uma API Key. A API permite operações de rastreamento de veículos, envio de notificações push, autenticação via código SMS e gerenciamento de horários de pico.

## Tecnologias Utilizadas

- **Node.js**: Plataforma para construir o servidor backend
- **Express**: Framework web para construir as rotas da API
- **Socket.IO**: Biblioteca para comunicação bidirecional e em tempo real via WebSocket
- **Firebase**: Utilizado para Firestore (banco de dados NoSQL) e Firebase Cloud Messaging (FCM) para notificações push
- **Swagger**: Documentação interativa da API
- **Axios**: Biblioteca HTTP para fazer requisições à API externa
- **Jest**: Ferramenta de testes para garantir a qualidade do código

## Estrutura do Projeto

```
src/
├── controllers/
│   └── peak_hour.controller.js  # Controlador do horário de pico
├── routes/
│   └── peak_hour.routes.js      # Rotas do horário de pico
├── services/
│   └── peak_hour_service.js     # Serviço de horário de pico
├── __tests__/
│   ├── peak_hour_service.test.js       # Testes do serviço de horário de pico
│   ├── peak_hour_routes.test.js        # Testes das rotas de horário de pico
│   └── peak_hour_integration.test.js   # Testes de integração de horário de pico
└── server.js                    # Configuração do servidor
```

## Configurações no Firebase

### Coleção `peak_hours`

Cada documento na coleção `peak_hours` contém:

```javascript
{
  country: string,      // País (ex: "Angola")
  province: string,     // Província (ex: "Luanda")
  municipality: string, // Município (ex: "Luanda")
  startTime: string,    // Horário de início (formato: "HH:mm")
  endTime: string,      // Horário de fim (formato: "HH:mm")
  pricePerHour: number, // Preço por hora durante o pico
  status: string        // Status da configuração ("ativo" ou "inativo")
}
```

### Coleção `vehicle_class`

Cada documento na coleção `vehicle_class` contém:

```javascript
{
  id: string,           // ID único da classe
  basePrice: number,    // Preço base da corrida
  basePriceMin: number, // Preço mínimo da corrida
  basePricePerKm: number, // Preço por quilômetro
  description: string,  // Descrição da classe
  designation: string,  // Designação da classe
  iconCategory: string, // Categoria do ícone
  iconMap: string,      // Ícone no mapa
  isDefault: boolean,   // Se é a classe padrão
  passengers: number,   // Número de passageiros
  percentage: number,   // Porcentagem do preço
  tarifaBase: number    // Tarifa base
}
```

### Coleção `races`

Cada documento na coleção `races` contém:

```javascript
{
  id: string,           // ID único da corrida
  startTime: timestamp, // Horário de início
  endTime: timestamp,   // Horário de fim
  status: number,       // Status da corrida
  finalPrice: number,   // Preço final
  isPeakHour: boolean, // Se está em horário de pico
  priceMultiplier: number, // Multiplicador de preço
  travelTimeMinutes: number, // Tempo de viagem em minutos
  vehicleClassId: string, // ID da classe do veículo
  country: string,      // País
  province: string,     // Província
  municipality: string  // Município
}
```

## API Endpoints

### Horário de Pico

#### GET /api/peak-hour/status
Retorna o status atual do horário de pico para uma localização específica.

**Parâmetros de Query:**
- `country` (obrigatório): País
- `province` (obrigatório): Província
- `municipality` (obrigatório): Município

**Resposta:**
```javascript
{
  isPeakHour: boolean,
  currentTime: string,
  config: {
    country: string,
    province: string,
    municipality: string,
    startTime: string,
    endTime: string,
    pricePerHour: number,
    status: string
  },
  allConfigs: object
}
```

#### POST /api/peak-hour/config
Cria ou atualiza uma configuração de horário de pico.

**Corpo da Requisição:**
```javascript
{
  country: string,      // obrigatório
  province: string,     // obrigatório
  municipality: string, // obrigatório
  startTime: string,    // obrigatório
  endTime: string,      // obrigatório
  pricePerHour: number, // obrigatório
  status: string        // obrigatório
}
```

#### DELETE /api/peak-hour/config
Remove uma configuração de horário de pico.

**Parâmetros de Query:**
- `country` (obrigatório): País
- `province` (obrigatório): Província
- `municipality` (obrigatório): Município

### Classes de Veículo

#### GET /api/peak-hour/vehicle-classes
Retorna todas as classes de veículo disponíveis.

#### GET /api/peak-hour/vehicle-classes/:id
Retorna uma classe de veículo específica.

#### POST /api/peak-hour/vehicle-classes
Cria ou atualiza uma classe de veículo.

**Corpo da Requisição:**
```javascript
{
  id: string,           // obrigatório
  basePrice: number,    // obrigatório
  basePriceMin: number, // obrigatório
  basePricePerKm: number, // obrigatório
  description: string,  // obrigatório
  designation: string,  // obrigatório
  iconCategory: string, // obrigatório
  iconMap: string,      // obrigatório
  isDefault: boolean,   // obrigatório
  passengers: number,   // obrigatório
  percentage: number,   // obrigatório
  tarifaBase: number    // obrigatório
}
```

#### DELETE /api/peak-hour/vehicle-classes/:id
Remove uma classe de veículo.

## Cálculo de Preços

O preço final de uma corrida é calculado considerando:

1. Preço base da classe do veículo
2. Multiplicador de horário de pico (se aplicável)
3. Configurações específicas da localização

### Fórmula de Cálculo

```javascript
preçoFinal = preçoBase * multiplicadorHorárioPico
```

Onde:
- `preçoBase`: Vem da classe do veículo ou é fornecido na corrida
- `multiplicadorHorárioPico`: Calculado como `pricePerHour / 10` quando em horário de pico

## WebSocket

O sistema utiliza Socket.IO para comunicação em tempo real. Os eventos disponíveis são:

- `tracking_update`: Atualizações de rastreamento de veículos
- `ride_completed`: Notificação de corrida finalizada
- `peak_hour_status`: Atualizações de status de horário de pico
- `peak_hour_status_changed`: Notificação quando o status do horário de pico muda (ativo/inativo)

O sistema verifica automaticamente o status do horário de pico a cada minuto e notifica todos os clientes conectados quando o status muda.

## Testes

O sistema inclui três tipos de testes:

1. **Testes de Serviço**:
   - Testa as funcionalidades básicas dos serviços
   - Verifica cálculos de preço
   - Testa manipulação de configurações

2. **Testes de Rotas**:
   - Testa os endpoints da API
   - Verifica validações de entrada
   - Testa respostas de erro

3. **Testes de Integração**:
   - Testa a integração entre serviços e rotas
   - Verifica o fluxo completo de operações
   - Testa cenários de erro

## Exemplos de Uso

### Verificar Status de Horário de Pico

```bash
curl -X GET "http://localhost:3000/api/peak-hour/status?country=Angola&province=Luanda&municipality=Luanda"
```

### Criar Configuração de Horário de Pico

```bash
curl -X POST "http://localhost:3000/api/peak-hour/config" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "Angola",
    "province": "Luanda",
    "municipality": "Luanda",
    "startTime": "08:00",
    "endTime": "09:00",
    "pricePerHour": 15,
    "status": "ativo"
  }'
```

### Criar Classe de Veículo

```bash
curl -X POST "http://localhost:3000/api/peak-hour/vehicle-classes" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "carro1",
    "basePrice": 80,
    "basePriceMin": 50,
    "basePricePerKm": 10,
    "description": "Carro padrão",
    "designation": "Standard",
    "iconCategory": "car",
    "iconMap": "car.png",
    "isDefault": true,
    "passengers": 4,
    "percentage": 100,
    "tarifaBase": 5
  }'
```

## Requisitos

- Node.js v14+
- Firebase Project (Firestore e Firebase Cloud Messaging ativados)
- Chave de API para proteger as rotas

## Configuração do Ambiente

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure as variáveis de ambiente no arquivo `.env`
4. Execute os testes: `npm test`
5. Inicie o servidor: `npm start`

## Otimização de Desempenho

O sistema utiliza listeners em tempo real do Firestore para manter as configurações de horário de pico e classes de veículos atualizadas localmente, reduzindo significativamente o número de leituras no Firebase:

- **Configurações de Horário de Pico**: Carregadas uma única vez na inicialização do servidor, com um listener em tempo real que detecta mudanças e reflete na memória local.
- **Classes de Veículos**: Também carregadas uma única vez na inicialização do servidor, com um listener em tempo real para mudanças.
- **Verificação de Status**: O sistema verifica o status do horário de pico a cada minuto usando os dados armazenados localmente, notificando os clientes via Socket.IO quando o status muda.

## Atualização Automática de Preços

O sistema atualiza automaticamente os preços na base de dados quando o horário de pico começa ou termina:

- **Detecção de Mudança**: O temporizador verifica a cada minuto se o horário de pico começou ou terminou para cada configuração ativa.
- **Atualização na Base de Dados**: Quando uma mudança é detectada, o sistema atualiza automaticamente os preços de todas as corridas ativas naquela localização.
- **Notificação em Tempo Real**: Os clientes são notificados via Socket.IO sobre a mudança de status e o resultado da atualização.
- **Cálculo de Preços**: O preço final é calculado com base no multiplicador definido na configuração de horário de pico.

### Exemplo de Atualização

Quando o horário de pico começa:
1. O sistema detecta a mudança de status
2. Busca todas as corridas ativas na localização
3. Atualiza o preço final de cada corrida aplicando o multiplicador
4. Notifica os clientes sobre a mudança

Quando o horário de pico termina:
1. O sistema detecta a mudança de status
2. Busca todas as corridas ativas na localização
3. Restaura o preço original de cada corrida
4. Notifica os clientes sobre a mudança

### Eventos Socket.IO

O sistema emite os seguintes eventos via Socket.IO:

- **peak_hour_status_changed**: Emitido quando o status do horário de pico muda, contendo:
  - Informações da localização (país, província, município)
  - Status atual (ativo/inativo)
  - Timestamp da mudança
  - Resultado da atualização na base de dados

## API Endpoints

### Horário de Pico

#### GET /api/peak-hour/status
Retorna o status atual do horário de pico para uma localização específica.

**Parâmetros de Query:**
- `country` (obrigatório): País
- `province` (obrigatório): Província
- `municipality` (obrigatório): Município

**Resposta:**
```javascript
{
  isPeakHour: boolean,
  currentTime: string,
  config: {
    country: string,
    province: string,
    municipality: string,
    startTime: string,
    endTime: string,
    pricePerHour: number,
    status: string
  },
  allConfigs: object
}
```

#### POST /api/peak-hour/config
Cria ou atualiza uma configuração de horário de pico.

**Corpo da Requisição:**
```javascript
{
  country: string,      // obrigatório
  province: string,     // obrigatório
  municipality: string, // obrigatório
  startTime: string,    // obrigatório
  endTime: string,      // obrigatório
  pricePerHour: number, // obrigatório
  status: string        // obrigatório
}
```

#### DELETE /api/peak-hour/config
Remove uma configuração de horário de pico.

**Parâmetros de Query:**
- `country` (obrigatório): País
- `province` (obrigatório): Província
- `municipality` (obrigatório): Município

### Classes de Veículo

#### GET /api/peak-hour/vehicle-classes
Retorna todas as classes de veículo disponíveis.

#### GET /api/peak-hour/vehicle-classes/:id
Retorna uma classe de veículo específica.

#### POST /api/peak-hour/vehicle-classes
Cria ou atualiza uma classe de veículo.

**Corpo da Requisição:**
```javascript
{
  id: string,           // obrigatório
  basePrice: number,    // obrigatório
  basePriceMin: number, // obrigatório
  basePricePerKm: number, // obrigatório
  description: string,  // obrigatório
  designation: string,  // obrigatório
  iconCategory: string, // obrigatório
  iconMap: string,      // obrigatório
  isDefault: boolean,   // obrigatório
  passengers: number,   // obrigatório
  percentage: number,   // obrigatório
  tarifaBase: number    // obrigatório
}
```

#### DELETE /api/peak-hour/vehicle-classes/:id
Remove uma classe de veículo.

## Cálculo de Preços

O preço final de uma corrida é calculado considerando:

1. Preço base da classe do veículo
2. Multiplicador de horário de pico (se aplicável)
3. Configurações específicas da localização

### Fórmula de Cálculo

```javascript
preçoFinal = preçoBase * multiplicadorHorárioPico
```

Onde:
- `preçoBase`: Vem da classe do veículo ou é fornecido na corrida
- `multiplicadorHorárioPico`: Calculado como `pricePerHour / 10` quando em horário de pico

## WebSocket

O sistema utiliza Socket.IO para comunicação em tempo real. Os eventos disponíveis são:

- `tracking_update`: Atualizações de rastreamento de veículos
- `ride_completed`: Notificação de corrida finalizada
- `peak_hour_status`: Atualizações de status de horário de pico
- `peak_hour_status_changed`: Notificação quando o status do horário de pico muda (ativo/inativo)

O sistema verifica automaticamente o status do horário de pico a cada minuto e notifica todos os clientes conectados quando o status muda.

## Testes

O sistema inclui três tipos de testes:

1. **Testes de Serviço**:
   - Testa as funcionalidades básicas dos serviços
   - Verifica cálculos de preço
   - Testa manipulação de configurações

2. **Testes de Rotas**:
   - Testa os endpoints da API
   - Verifica validações de entrada
   - Testa respostas de erro

3. **Testes de Integração**:
   - Testa a integração entre serviços e rotas
   - Verifica o fluxo completo de operações
   - Testa cenários de erro

## Exemplos de Uso

### Verificar Status de Horário de Pico

```bash
curl -X GET "http://localhost:3000/api/peak-hour/status?country=Angola&province=Luanda&municipality=Luanda"
```

### Criar Configuração de Horário de Pico

```bash
curl -X POST "http://localhost:3000/api/peak-hour/config" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "Angola",
    "province": "Luanda",
    "municipality": "Luanda",
    "startTime": "08:00",
    "endTime": "09:00",
    "pricePerHour": 15,
    "status": "ativo"
  }'
```

### Criar Classe de Veículo

```bash
curl -X POST "http://localhost:3000/api/peak-hour/vehicle-classes" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "carro1",
    "basePrice": 80,
    "basePriceMin": 50,
    "basePricePerKm": 10,
    "description": "Carro padrão",
    "designation": "Standard",
    "iconCategory": "car",
    "iconMap": "car.png",
    "isDefault": true,
    "passengers": 4,
    "percentage": 100,
    "tarifaBase": 5
  }'
```

## Requisitos

- Node.js v14+
- Firebase Project (Firestore e Firebase Cloud Messaging ativados)
- Chave de API para proteger as rotas

## Configuração do Ambiente

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure as variáveis de ambiente no arquivo `.env`
4. Execute os testes: `npm test`
5. Inicie o servidor: `npm start` 