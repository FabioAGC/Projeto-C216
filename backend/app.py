from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import os
import time

app = Flask(__name__)
CORS(app)

# Configuração do banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres123@localhost:5432/taskmanager')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Modelos do banco de dados
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tasks = db.relationship('Task', backref='user', lazy=True)

class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    color = db.Column(db.String(7), default='#007bff')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)

class Note(db.Model):
    __tablename__ = 'notes'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    project = db.relationship('Project')

class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # pending, completed
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    categories = db.relationship('Category', secondary='task_categories', backref='tasks')

class TaskCategory(db.Model):
    __tablename__ = 'task_categories'
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), primary_key=True)

# Rotas da API

# Rotas para Tasks
@app.route('/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([{
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'status': task.status,
        'user_id': task.user_id,
        'created_at': task.created_at.isoformat(),
        'updated_at': task.updated_at.isoformat(),
        'categories': [{'id': cat.id, 'name': cat.name, 'color': cat.color} for cat in task.categories]
    } for task in tasks])

@app.route('/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    return jsonify({
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'status': task.status,
        'user_id': task.user_id,
        'created_at': task.created_at.isoformat(),
        'updated_at': task.updated_at.isoformat(),
        'categories': [{'id': cat.id, 'name': cat.name, 'color': cat.color} for cat in task.categories]
    })

@app.route('/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    task = Task(
        title=data['title'],
        description=data.get('description', ''),
        status=data.get('status', 'pending'),
        user_id=data.get('user_id', 1)  # Default user for now
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'id': task.id, 'message': 'Task created successfully'}), 201

@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    
    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    task.status = data.get('status', task.status)
    task.updated_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify({'message': 'Task updated successfully'})

@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted successfully'})

# Rotas para Categories
@app.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([{
        'id': cat.id,
        'name': cat.name,
        'color': cat.color,
        'created_at': cat.created_at.isoformat()
    } for cat in categories])

@app.route('/categories', methods=['POST'])
def create_category():
    data = request.get_json()
    category = Category(
        name=data['name'],
        color=data.get('color', '#007bff')
    )
    db.session.add(category)
    db.session.commit()
    return jsonify({
        'id': category.id,
        'name': category.name,
        'color': category.color,
        'created_at': category.created_at.isoformat(),
        'message': 'Category created successfully'
    }), 201

@app.route('/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    category = Category.query.get_or_404(category_id)
    data = request.get_json()
    
    category.name = data.get('name', category.name)
    category.color = data.get('color', category.color)
    
    db.session.commit()
    return jsonify({'message': 'Category updated successfully'})

@app.route('/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    category = Category.query.get_or_404(category_id)
    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Category deleted successfully'})

# Rotas para associação de categorias com tarefas
@app.route('/tasks/<int:task_id>/categories/<int:category_id>', methods=['POST'])
def associate_category_to_task(task_id, category_id):
    task = Task.query.get_or_404(task_id)
    category = Category.query.get_or_404(category_id)
    
    if category not in task.categories:
        task.categories.append(category)
        db.session.commit()
        return jsonify({'message': 'Category associated with task successfully'})
    else:
        return jsonify({'message': 'Category already associated with task'}), 400

@app.route('/tasks/<int:task_id>/categories/<int:category_id>', methods=['DELETE'])
def disassociate_category_from_task(task_id, category_id):
    task = Task.query.get_or_404(task_id)
    category = Category.query.get_or_404(category_id)
    
    if category in task.categories:
        task.categories.remove(category)
        db.session.commit()
        return jsonify({'message': 'Category disassociated from task successfully'})
    else:
        return jsonify({'message': 'Category not associated with task'}), 400

# Rota para listar tarefas de um usuário específico
@app.route('/users/<int:user_id>/tasks', methods=['GET'])
def get_user_tasks(user_id):
    tasks = Task.query.filter_by(user_id=user_id).all()
    return jsonify([{
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'status': task.status,
        'user_id': task.user_id,
        'created_at': task.created_at.isoformat(),
        'updated_at': task.updated_at.isoformat(),
        'categories': [{'id': cat.id, 'name': cat.name, 'color': cat.color} for cat in task.categories]
    } for task in tasks])

# Rota para criar usuário padrão
@app.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    user = User(
        name=data['name'],
        email=data['email']
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'id': user.id, 'message': 'User created successfully'}), 201

<<<<<<< HEAD
# Rota para estatísticas
@app.route('/stats', methods=['GET'])
def get_stats():
    total_tasks = Task.query.count()
    pending_tasks = Task.query.filter_by(status='pending').count()
    completed_tasks = Task.query.filter_by(status='completed').count()
    total_categories = Category.query.count()
    
    # Estatísticas por categoria
    categories_stats = []
    categories = Category.query.all()
    for category in categories:
        task_count = len(category.tasks)
        categories_stats.append({
            'id': category.id,
            'name': category.name,
            'color': category.color,
            'task_count': task_count
        })
    
    # Tarefas criadas nos últimos 7 dias
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_tasks = Task.query.filter(Task.created_at >= seven_days_ago).count()
    
    # Taxa de conclusão
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    return jsonify({
        'total_tasks': total_tasks,
        'pending_tasks': pending_tasks,
        'completed_tasks': completed_tasks,
        'total_categories': total_categories,
        'categories_stats': categories_stats,
        'recent_tasks': recent_tasks,
        'completion_rate': round(completion_rate, 2)
    })

=======
>>>>>>> e095f5d (Patch: erros de exclusão corrigdos)
def wait_for_db():
    """Aguarda o banco de dados estar disponível"""
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            with app.app_context():
                db.create_all()
                print("Banco de dados conectado com sucesso!")
                return True
        except Exception as e:
            retry_count += 1
            print(f"Tentativa {retry_count}/{max_retries} - Aguardando banco de dados...")
            time.sleep(2)
    
    print("Falha ao conectar com o banco de dados após 30 tentativas")
    return False

if __name__ == '__main__':
    if wait_for_db():
        with app.app_context():
            # Criar usuário padrão se não existir
            if not User.query.first():
                default_user = User(name='Usuário Padrão', email='user@example.com')
                db.session.add(default_user)
                db.session.commit()
                
            # Criar algumas categorias padrão
            if not Category.query.first():
                default_categories = [
                    Category(name='Trabalho', color='#007bff'),
                    Category(name='Pessoal', color='#28a745'),
                    Category(name='Urgente', color='#dc3545'),
                    Category(name='Estudo', color='#ffc107')
                ]
                for cat in default_categories:
                    db.session.add(cat)
                db.session.commit()
        
        app.run(host='0.0.0.0', port=5000, debug=True)
    else:
        print("Não foi possível iniciar a aplicação devido a problemas de conexão com o banco")
