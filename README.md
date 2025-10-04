# Gerenciador de Tarefas

Uma aplicação web completa para gerenciamento de tarefas pessoais, desenvolvida com Python Flask, HTML/CSS e PostgreSQL, orquestrada com Docker.

## 🚀 Funcionalidades

### Dashboard Principal de Tarefas
- Visualização de todas as tarefas em formato de lista
- Componente para adicionar uma nova tarefa rapidamente
- Botões para marcar uma tarefa como "concluída", "editar" ou "deletar"
- Filtro para visualizar tarefas por categoria ou status

### Página de Detalhes e Edição de Tarefa
- Formulário pré-preenchido com as informações da tarefa selecionada
- Opção para alterar o status e associar/desassociar categorias
- Botão para salvar as alterações

### Gerenciamento de Categorias
- Exibição de todas as categorias existentes
- Formulário para criar uma nova categoria
- Opção para editar ou excluir categorias existentes

## 🛠️ Tecnologias Utilizadas

- **Backend**: Python 3.11 + Flask
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Banco de Dados**: PostgreSQL 15
- **Containerização**: Docker + Docker Compose
- **ORM**: SQLAlchemy
- **CORS**: Flask-CORS

## 📋 Pré-requisitos

- Docker
- Docker Compose

## 🚀 Como Executar

1. **Clone o repositório** (se aplicável):
   ```bash
   git clone <url-do-repositorio>
   cd C216
   ```

2. **Execute com Docker Compose**:
   ```bash
   docker-compose up --build
   ```

3. **Acesse a aplicação**:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:5000

## 📚 API Endpoints

### Tarefas (Tasks)
- `GET /tasks` - Listar todas as tarefas
- `GET /tasks/{id}` - Obter detalhes de uma tarefa específica
- `POST /tasks` - Criar uma nova tarefa
- `PUT /tasks/{id}` - Atualizar uma tarefa existente
- `DELETE /tasks/{id}` - Excluir uma tarefa

### Categorias (Categories)
- `GET /categories` - Listar todas as categorias
- `POST /categories` - Criar uma nova categoria
- `PUT /categories/{id}` - Atualizar uma categoria existente
- `DELETE /categories/{id}` - Excluir uma categoria

### Associações
- `POST /tasks/{taskId}/categories/{categoryId}` - Associar uma categoria a uma tarefa
- `DELETE /tasks/{taskId}/categories/{categoryId}` - Desassociar uma categoria de uma tarefa

### Usuários
- `GET /users/{userId}/tasks` - Listar todas as tarefas de um usuário específico
- `POST /users` - Criar um novo usuário

## 🗄️ Estrutura do Banco de Dados

### Tabela Users
- `id` (Primary Key)
- `name` (String)
- `email` (String, Unique)
- `created_at` (DateTime)

### Tabela Tasks
- `id` (Primary Key)
- `title` (String)
- `description` (Text)
- `status` (String: 'pending' ou 'completed')
- `user_id` (Foreign Key para Users)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### Tabela Categories
- `id` (Primary Key)
- `name` (String, Unique)
- `color` (String - código hexadecimal)
- `created_at` (DateTime)

### Tabela Task_Categories (Tabela Pivot)
- `task_id` (Foreign Key para Tasks)
- `category_id` (Foreign Key para Categories)

## 🔧 Estrutura do Projeto

```
C216/
├── backend/
│   ├── app.py              # Aplicação Flask principal
│   ├── requirements.txt    # Dependências Python
│   └── Dockerfile         # Imagem Docker do backend
├── frontend/
│   ├── index.html         # Página principal
│   ├── styles.css         # Estilos CSS
│   ├── script.js          # JavaScript da aplicação
│   └── Dockerfile         # Imagem Docker do frontend
├── database/              # Scripts de banco (se necessário)
├── docker-compose.yml     # Orquestração dos serviços
└── README.md             # Este arquivo
```

## 🎨 Interface do Usuário

A aplicação possui uma interface moderna e responsiva com:
- Design gradiente e glassmorphism
- Animações suaves
- Layout responsivo para mobile
- Modais para formulários
- Notificações de feedback
- Filtros e busca

## 🔄 Fluxo de Dados

1. **Frontend** faz requisições HTTP para o **Backend**
2. **Backend** processa as requisições e interage com o **PostgreSQL**
3. **PostgreSQL** armazena os dados das tarefas, categorias e usuários
4. **Backend** retorna respostas JSON para o **Frontend**
5. **Frontend** atualiza a interface baseado nas respostas

## 🐳 Serviços Docker

- **postgres**: Banco de dados PostgreSQL
- **backend**: API Flask
- **frontend**: Servidor Nginx servindo arquivos estáticos

## 📝 Exemplo de Uso

1. Acesse http://localhost:8080
2. Clique em "Nova Tarefa" para criar uma tarefa
3. Preencha o título, descrição e selecione categorias
4. Use os filtros para visualizar tarefas por status ou categoria
5. Clique em "Categorias" para gerenciar as categorias
6. Edite ou exclua tarefas e categorias conforme necessário

## 🚨 Solução de Problemas

### Erro de Conexão com o Banco
- Verifique se o container do PostgreSQL está rodando
- Confirme se as credenciais estão corretas no docker-compose.yml

### Erro de CORS
- O Flask-CORS está configurado para permitir requisições do frontend
- Verifique se as URLs estão corretas no script.js

### Porta já em uso
- Altere as portas no docker-compose.yml se necessário
- Use `docker-compose down` para parar os containers antes de subir novamente

## 📄 Licença

Este projeto foi desenvolvido como parte de um trabalho acadêmico.
