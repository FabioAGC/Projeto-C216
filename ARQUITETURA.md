# Arquitetura da Aplicação

## Visão Geral
A aplicação é uma arquitetura de 3 camadas (3-tier) containerizada com Docker:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Nginx)       │◄──►│   (Flask)       │◄──►│   (PostgreSQL)  │
│   Port: 8080    │    │   Port: 5000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Componentes

### 1. Frontend (Nginx + HTML/CSS/JS)
- **Tecnologia**: HTML5, CSS3, JavaScript Vanilla
- **Servidor**: Nginx Alpine
- **Porta**: 8080
- **Funcionalidades**:
  - Interface responsiva com 3 telas principais
  - Comunicação com API via fetch()
  - Gerenciamento de estado local
  - Modais para formulários
  - Filtros e busca

### 2. Backend (Flask + SQLAlchemy)
- **Tecnologia**: Python 3.11, Flask, SQLAlchemy
- **Porta**: 5000
- **Funcionalidades**:
  - APIs REST completas
  - ORM para banco de dados
  - Validação de dados
  - CORS habilitado
  - Retry automático para conexão com DB

### 3. Database (PostgreSQL)
- **Tecnologia**: PostgreSQL 15
- **Porta**: 5432
- **Funcionalidades**:
  - Armazenamento persistente
  - Relacionamentos 1:N e N:M
  - Transações ACID
  - Volume persistente

## Estrutura do Banco de Dados

### Tabelas Principais

#### Users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tasks
```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  kanban_status VARCHAR(20) DEFAULT 'backlog', -- valores: backlog, planejamento, andamento, concluido
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Categories
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#007bff',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Task_Categories (Tabela Pivot)
```sql
CREATE TABLE task_categories (
    task_id INTEGER REFERENCES tasks(id),
    category_id INTEGER REFERENCES categories(id),
    PRIMARY KEY (task_id, category_id)
);
```

## APIs REST

### Endpoints de Tarefas
- `GET /tasks` - Listar todas as tarefas
- `GET /tasks/{id}` - Obter tarefa específica
- `POST /tasks` - Criar nova tarefa
- `PUT /tasks/{id}` - Atualizar tarefa
- `DELETE /tasks/{id}` - Excluir tarefa

Nota: `PUT /tasks/{id}` aceita também o campo `kanban_status` para atualizar a posição da tarefa no quadro Kanban.

### Endpoints de Categorias
- `GET /categories` - Listar todas as categorias
- `POST /categories` - Criar nova categoria
- `PUT /categories/{id}` - Atualizar categoria
- `DELETE /categories/{id}` - Excluir categoria

### Endpoints de Associação
- `POST /tasks/{taskId}/categories/{categoryId}` - Associar categoria
- `DELETE /tasks/{taskId}/categories/{categoryId}` - Desassociar categoria

### Endpoints de Usuários
- `GET /users/{userId}/tasks` - Tarefas do usuário
- `POST /users` - Criar usuário

### Endpoint de Estatísticas
- `GET /stats` - Retorna estatísticas agregadas (total de tarefas, pendentes, concluídas, estatísticas por categoria e taxa de conclusão)

## Fluxo de Dados

### 1. Criação de Tarefa
```
Frontend → POST /tasks → Backend → SQLAlchemy → PostgreSQL
         ← JSON Response ← Backend ← Query Result ← PostgreSQL
```

### 2. Listagem de Tarefas
```
Frontend → GET /tasks → Backend → SQLAlchemy → PostgreSQL
         ← JSON Array ← Backend ← Query Result ← PostgreSQL
```

### 3. Associação de Categoria
```
Frontend → POST /tasks/{id}/categories/{id} → Backend → SQLAlchemy → PostgreSQL
         ← Success Response ← Backend ← Insert Result ← PostgreSQL
```

## Containerização

### Docker Compose
```yaml
services:
  postgres:    # Banco de dados
  backend:     # API Flask
  frontend:    # Interface web
```

### Volumes
- `postgres_data`: Persistência dos dados do PostgreSQL
- `./backend:/app`: Desenvolvimento do backend
- `./frontend:/usr/share/nginx/html`: Desenvolvimento do frontend

### Rede
- `taskmanager_network`: Rede interna para comunicação entre containers

## Segurança

### Implementadas
- CORS configurado para frontend
- Validação de entrada nos endpoints
- Escape de HTML para prevenir XSS
- Parâmetros preparados para prevenir SQL Injection

### Recomendações Futuras
- Autenticação JWT
- Rate limiting
- HTTPS
- Validação mais robusta
- Logs de auditoria

## Performance

### Otimizações Atuais
- Índices automáticos do PostgreSQL
- Queries otimizadas com SQLAlchemy
- Cache do navegador para assets estáticos
- Compressão gzip do Nginx

### Recomendações Futuras
- Cache Redis
- Paginação de resultados
- Lazy loading
- CDN para assets

## Monitoramento

### Logs
- Logs do Docker Compose
- Logs do Flask (debug mode)
- Logs do PostgreSQL

### Métricas
- Status dos containers
- Uso de recursos
- Tempo de resposta da API

## Escalabilidade

### Horizontal
- Múltiplas instâncias do backend
- Load balancer
- Múltiplas réplicas do PostgreSQL

### Vertical
- Aumento de recursos dos containers
- Otimização de queries
- Cache de dados

## Desenvolvimento

### Estrutura de Arquivos
```
C216/
├── backend/
│   ├── app.py              # Aplicação Flask
│   ├── requirements.txt    # Dependências Python
│   └── Dockerfile         # Imagem do backend
├── frontend/
│   ├── index.html         # Página principal
│   ├── styles.css         # Estilos CSS
│   ├── script.js          # JavaScript
│   └── Dockerfile         # Imagem do frontend
├── docker-compose.yml     # Orquestração
└── README.md             # Documentação
```

### Comandos de Desenvolvimento
```bash
# Iniciar aplicação
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar aplicação
docker-compose down

# Rebuild
docker-compose up --build -d
```

