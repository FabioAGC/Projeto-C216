# Exemplo de Uso da Aplicação

## 🚀 Como Testar a Aplicação

### 1. Acesse a Aplicação
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000

### 2. Teste as Funcionalidades

#### Dashboard de Tarefas
1. Acesse http://localhost:8080
2. Clique em "Nova Tarefa"
3. Preencha:
   - Título: "Estudar Python"
   - Descrição: "Revisar conceitos de Flask e SQLAlchemy"
   - Status: Pendente
   - Categorias: Selecione "Estudo"
4. Clique em "Salvar"

#### Gerenciamento de Categorias
1. Clique na aba "Categorias"
2. Clique em "Nova Categoria"
3. Preencha:
   - Nome: "Projetos"
   - Cor: Escolha uma cor
4. Clique em "Salvar"

#### Filtros e Ações
1. Volte ao Dashboard
2. Use os filtros para visualizar tarefas por status ou categoria
3. Teste as ações:
   - Marcar como concluída
   - Editar tarefa
   - Excluir tarefa

### 3. Teste a API Diretamente

#### Criar uma tarefa via API
```bash
curl -X POST http://localhost:5000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tarefa via API",
    "description": "Criada via curl",
    "status": "pending",
    "user_id": 1
  }'
```

#### Listar todas as tarefas
```bash
curl http://localhost:5000/tasks
```

#### Criar uma categoria via API
```bash
curl -X POST http://localhost:5000/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test",
    "color": "#ff6b6b"
  }'
```

#### Associar categoria à tarefa
```bash
curl -X POST http://localhost:5000/tasks/1/categories/1
```

### 4. Estrutura dos Dados

#### Tarefa (Task)
```json
{
  "id": 1,
  "title": "Estudar Python",
  "description": "Revisar conceitos de Flask",
  "status": "pending",
  "user_id": 1,
  "created_at": "2025-10-04T23:42:14.979363",
  "updated_at": "2025-10-04T23:42:14.979363",
  "categories": [
    {
      "id": 4,
      "name": "Estudo",
      "color": "#ffc107"
    }
  ]
}
```

#### Categoria (Category)
```json
{
  "id": 1,
  "name": "Trabalho",
  "color": "#007bff",
  "created_at": "2025-10-04T23:42:14.979363"
}
```

### 5. Funcionalidades Implementadas

✅ **Dashboard Principal**
- Visualização de tarefas em lista
- Adicionar nova tarefa
- Marcar como concluída/pendente
- Editar tarefa
- Excluir tarefa
- Filtros por status e categoria

✅ **Gerenciamento de Categorias**
- Listar categorias
- Criar nova categoria
- Editar categoria
- Excluir categoria

✅ **APIs REST Completas**
- CRUD completo para tarefas
- CRUD completo para categorias
- Associação/desassociação de categorias
- Listagem de tarefas por usuário

✅ **Banco de Dados**
- PostgreSQL configurado
- Tabelas: Users, Tasks, Categories, Task_Categories
- Relacionamentos 1:N e N:M implementados

✅ **Interface Responsiva**
- Design moderno com gradientes
- Animações suaves
- Modais para formulários
- Notificações de feedback
- Layout responsivo para mobile

### 6. Comandos Úteis

#### Parar a aplicação
```bash
docker-compose down
```

#### Ver logs
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

#### Reiniciar com rebuild
```bash
docker-compose down
docker-compose up --build -d
```

#### Acessar banco de dados
```bash
docker exec -it c216-postgres-1 psql -U postgres -d taskmanager
```

### 7. Próximos Passos Sugeridos

1. **Autenticação**: Implementar login/logout
2. **Validação**: Adicionar validações mais robustas
3. **Testes**: Criar testes automatizados
4. **Deploy**: Configurar para produção
5. **Monitoramento**: Adicionar logs e métricas

