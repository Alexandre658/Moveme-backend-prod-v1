# Documentação do Controlador de Requisições

## Visão Geral
O Controlador de Requisições (`request.controller.js`) é responsável por gerenciar solicitações de corridas, atribuições de motoristas e o ciclo de vida das viagens no aplicativo MoveMe. Ele gerencia todo o fluxo desde a criação da solicitação até a conclusão da viagem.

## Dependências
- Firebase Admin SDK (`firebaseConfig.js`)
- Classe Driver (`Driver.js`)
- Serviço de Tarifas (`fare_service.js`)
- Serviço de Transações (`transaction_Service.js`)
- Vários serviços utilitários (rastreamento, notificação, firebase)

## Funções Principais

### 1. Criação de Requisição
**Função:** `createRequest(req, res)`
- Cria uma nova solicitação de corrida
- **Parâmetros Obrigatórios:**
  - `driverId`: ID do motorista
  - `requestId`: Identificador único da requisição
  - `documentId`: Referência ao documento da corrida
  - `driverDetails`: Informações do motorista
- **Resposta:** Retorna os dados da requisição criada

### 2. Aceitação de Requisição
**Função:** `acceptRequest(req, res)`
- Gerencia a aceitação de uma solicitação de corrida pelo motorista
- **Parâmetros Obrigatórios:**
  - `requestId`: ID da requisição
  - `driverId`: ID do motorista que está aceitando
- **Funcionalidades:**
  - Atualiza o status da corrida
  - Envia notificação push para o cliente
  - Atualiza informações da viagem do motorista

### 3. Recusa de Requisição
**Função:** `denyRequest(req, res)`
- Gerencia a rejeição de uma solicitação de corrida
- **Parâmetros Obrigatórios:**
  - `requestId`: ID da requisição a ser recusada
- **Resposta:** Confirma a recusa da requisição

### 4. Cancelamento de Corrida
**Função:** `cancelRace(req, res)`
- Cancela uma solicitação de corrida existente
- **Parâmetros Obrigatórios:**
  - `requestId`: ID da requisição a ser cancelada
- **Resposta:** Confirma o cancelamento da corrida

### 5. Gerenciamento de Viagem

#### Início da Viagem
**Função:** `startTheRaceRequest(req, res)`
- Inicia uma viagem e começa o registro da rota
- **Parâmetros Obrigatórios:**
  - `requestId`: ID da requisição
  - `vehicleId`: ID do veículo
- **Funcionalidades:**
  - Inicia o registro da viagem
  - Atualiza o status da requisição

#### Chegada do Motorista
**Função:** `arrivedRequest(req, res)`
- Notifica quando o motorista chega ao local de embarque
- **Parâmetros Obrigatórios:**
  - `requestId`: ID da requisição
- **Resposta:** Confirma a chegada do motorista

#### Finalização da Viagem
**Função:** `finishRequest(req, res)`
- Finaliza uma viagem e processa o pagamento
- **Parâmetros Obrigatórios:**
  - `requestId`: ID da requisição
  - `correctPosition`: Coordenadas da posição final
  - `token`: Token de autenticação
- **Funcionalidades:**
  - Calcula a tarifa
  - Processa o pagamento do motorista
  - Atualiza o status da viagem
  - Envia notificação de conclusão
  - Limpa as mensagens do chat

## Funções Utilitárias

### Registro de Rota
**Função:** `startTripRecording(driverId, requestId)`
- Registra pontos da rota da viagem
- Armazena dados de localização a cada 60 segundos
- Cria documento da viagem no Firebase

### Geração de Polilinha
**Função:** `getPolylineBetweenPoints(origin, destination)`
- Gera polilinha da rota entre dois pontos
- Utiliza API do Google Maps (principal)
- Usa API OSRM como alternativa se o Google Maps falhar

### Gerenciamento de Chat
**Função:** `deleteChatMessages(userDriver, userCliente)`
- Limpa mensagens do chat entre motorista e cliente
- Executado após a conclusão da viagem

## Códigos de Status
- 200: Sucesso
- 400: Requisição Inválida (parâmetros ausentes)
- 404: Requisição não encontrada
- 500: Erro do servidor

## Tratamento de Erros
Todas as funções incluem blocos try-catch e respostas de erro apropriadas. Cenários comuns de erro:
- Parâmetros obrigatórios ausentes
- Coordenadas inválidas
- Falhas em operações do banco de dados
- Erros de integração com API

## Atualizações em Tempo Real
O controlador utiliza um array `clients` para emitir atualizações em tempo real para:
- Respostas de requisições
- Chegada do motorista
- Conclusão da viagem
- Alterações de status da corrida

## Considerações de Segurança
- Validação de token para operações sensíveis
- Validação de coordenadas
- Controle de acesso ao banco de dados através do Firebase
- Processamento seguro de pagamentos

## Boas Práticas
1. Sempre validar parâmetros de entrada
2. Tratar todos os possíveis cenários de erro
3. Manter atualizações de status consistentes
4. Limpar recursos após a conclusão da viagem
5. Enviar notificações apropriadas aos usuários 