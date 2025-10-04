// Configuração da API
const API_BASE_URL = 'http://localhost:5000';

// Estado global da aplicação
let tasks = [];
let categories = [];
let currentTaskId = null;
let currentCategoryId = null;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        await loadCategories();
        await loadTasks();
        setupEventListeners();
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        showNotification('Erro ao carregar dados', 'error');
    }
}

function setupEventListeners() {
    // Navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            showPage(page);
        });
    });

    // Formulários
    document.getElementById('addTaskForm').addEventListener('submit', handleAddTask);
    document.getElementById('editTaskForm').addEventListener('submit', handleEditTask);
    document.getElementById('addCategoryForm').addEventListener('submit', handleAddCategory);
    document.getElementById('editCategoryForm').addEventListener('submit', handleEditCategory);

    // Fechar modais ao clicar fora
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
}

// Navegação entre páginas
function showPage(pageName) {
    // Esconder todas as páginas
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Remover classe active de todos os botões de navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar página selecionada
    document.getElementById(pageName).classList.add('active');
    
    // Adicionar classe active ao botão correspondente
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Carregar dados específicos da página
    if (pageName === 'dashboard') {
        loadTasks();
    } else if (pageName === 'categories') {
        loadCategories();
    }
}

// Carregar tarefas
async function loadTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`);
        if (!response.ok) throw new Error('Erro ao carregar tarefas');
        
        tasks = await response.json();
        renderTasks();
        updateCategoryFilter();
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
        showNotification('Erro ao carregar tarefas', 'error');
    }
}

// Carregar categorias
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Erro ao carregar categorias');
        
        categories = await response.json();
        renderCategories();
        updateCategoryCheckboxes();
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        showNotification('Erro ao carregar categorias', 'error');
    }
}

// Renderizar tarefas
function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;

    let filteredTasks = tasks;

    // Filtrar por status
    if (statusFilter) {
        filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
    }

    // Filtrar por categoria
    if (categoryFilter) {
        filteredTasks = filteredTasks.filter(task => 
            task.categories.some(cat => cat.id.toString() === categoryFilter)
        );
    }

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>Nenhuma tarefa encontrada</h3>
                <p>Adicione uma nova tarefa para começar</p>
            </div>
        `;
        return;
    }

    tasksList.innerHTML = filteredTasks.map(task => `
        <div class="task-card ${task.status}">
            <div class="task-header">
                <div>
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    <span class="task-status ${task.status}">${task.status === 'pending' ? 'Pendente' : 'Concluída'}</span>
                </div>
            </div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
            ${task.categories.length > 0 ? `
                <div class="task-categories">
                    ${task.categories.map(cat => `
                        <span class="category-tag" style="background-color: ${cat.color}">
                            ${escapeHtml(cat.name)}
                        </span>
                    `).join('')}
                </div>
            ` : ''}
            <div class="task-actions">
                <button class="btn btn-success" onclick="toggleTaskStatus(${task.id})">
                    <i class="fas fa-${task.status === 'pending' ? 'check' : 'undo'}"></i>
                    ${task.status === 'pending' ? 'Concluir' : 'Reabrir'}
                </button>
                <button class="btn btn-warning" onclick="editTask(${task.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-danger" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// Renderizar categorias
function renderCategories() {
    const categoriesList = document.getElementById('categoriesList');

    if (categories.length === 0) {
        categoriesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tags"></i>
                <h3>Nenhuma categoria encontrada</h3>
                <p>Adicione uma nova categoria para começar</p>
            </div>
        `;
        return;
    }

    categoriesList.innerHTML = categories.map(category => `
        <div class="category-card">
            <div class="category-header">
                <div class="category-name">
                    <div class="category-color" style="background-color: ${category.color}"></div>
                    ${escapeHtml(category.name)}
                </div>
                <div class="category-actions">
                    <button class="btn btn-warning" onclick="editCategory(${category.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-danger" onclick="deleteCategory(${category.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Atualizar filtro de categorias
function updateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<option value="">Todas as categorias</option>' +
        categories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('');
}

// Atualizar checkboxes de categorias
function updateCategoryCheckboxes() {
    const taskCategories = document.getElementById('taskCategories');
    const editTaskCategories = document.getElementById('editTaskCategories');
    
    const categoryHtml = categories.map(cat => `
        <div class="category-checkbox">
            <input type="checkbox" id="cat-${cat.id}" value="${cat.id}">
            <label for="cat-${cat.id}">
                <div class="category-checkbox-color" style="background-color: ${cat.color}"></div>
                ${escapeHtml(cat.name)}
            </label>
        </div>
    `).join('');

    if (taskCategories) taskCategories.innerHTML = categoryHtml;
    if (editTaskCategories) editTaskCategories.innerHTML = categoryHtml;
}

// Filtrar tarefas
function filterTasks() {
    renderTasks();
}

// Mostrar modal de adicionar tarefa
function showAddTaskModal() {
    document.getElementById('addTaskForm').reset();
    updateCategoryCheckboxes();
    document.getElementById('addTaskModal').style.display = 'block';
}

// Mostrar modal de editar tarefa
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    currentTaskId = taskId;
    document.getElementById('editTaskId').value = taskId;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editTaskStatus').value = task.status;

    // Marcar categorias selecionadas
    updateCategoryCheckboxes();
    setTimeout(() => {
        task.categories.forEach(cat => {
            const checkbox = document.querySelector(`#editTaskCategories input[value="${cat.id}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }, 100);

    document.getElementById('editTaskModal').style.display = 'block';
}

// Mostrar modal de adicionar categoria
function showAddCategoryModal() {
    document.getElementById('addCategoryForm').reset();
    document.getElementById('addCategoryModal').style.display = 'block';
}

// Mostrar modal de editar categoria
function editCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    currentCategoryId = categoryId;
    document.getElementById('editCategoryId').value = categoryId;
    document.getElementById('editCategoryName').value = category.name;
    document.getElementById('editCategoryColor').value = category.color;

    document.getElementById('editCategoryModal').style.display = 'block';
}

// Fechar modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Adicionar tarefa
async function handleAddTask(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const selectedCategories = Array.from(document.querySelectorAll('#taskCategories input:checked'))
        .map(cb => parseInt(cb.value));

    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        status: document.getElementById('taskStatus').value,
        user_id: 1
    };

    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) throw new Error('Erro ao criar tarefa');

        const result = await response.json();
        
        // Associar categorias
        for (const categoryId of selectedCategories) {
            await fetch(`${API_BASE_URL}/tasks/${result.id}/categories/${categoryId}`, {
                method: 'POST'
            });
        }

        closeModal('addTaskModal');
        await loadTasks();
        showNotification('Tarefa criada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
        showNotification('Erro ao criar tarefa', 'error');
    }
}

// Editar tarefa
async function handleEditTask(event) {
    event.preventDefault();
    
    const taskId = document.getElementById('editTaskId').value;
    const selectedCategories = Array.from(document.querySelectorAll('#editTaskCategories input:checked'))
        .map(cb => parseInt(cb.value));

    const taskData = {
        title: document.getElementById('editTaskTitle').value,
        description: document.getElementById('editTaskDescription').value,
        status: document.getElementById('editTaskStatus').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) throw new Error('Erro ao atualizar tarefa');

        // Atualizar categorias
        const task = tasks.find(t => t.id == taskId);
        if (task) {
            // Remover todas as categorias existentes
            for (const cat of task.categories) {
                await fetch(`${API_BASE_URL}/tasks/${taskId}/categories/${cat.id}`, {
                    method: 'DELETE'
                });
            }
            
            // Adicionar novas categorias
            for (const categoryId of selectedCategories) {
                await fetch(`${API_BASE_URL}/tasks/${taskId}/categories/${categoryId}`, {
                    method: 'POST'
                });
            }
        }

        closeModal('editTaskModal');
        await loadTasks();
        showNotification('Tarefa atualizada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        showNotification('Erro ao atualizar tarefa', 'error');
    }
}

// Adicionar categoria
async function handleAddCategory(event) {
    event.preventDefault();
    
    const categoryData = {
        name: document.getElementById('categoryName').value,
        color: document.getElementById('categoryColor').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(categoryData)
        });

        if (!response.ok) throw new Error('Erro ao criar categoria');

        closeModal('addCategoryModal');
        await loadCategories();
        showNotification('Categoria criada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        showNotification('Erro ao criar categoria', 'error');
    }
}

// Editar categoria
async function handleEditCategory(event) {
    event.preventDefault();
    
    const categoryId = document.getElementById('editCategoryId').value;
    const categoryData = {
        name: document.getElementById('editCategoryName').value,
        color: document.getElementById('editCategoryColor').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(categoryData)
        });

        if (!response.ok) throw new Error('Erro ao atualizar categoria');

        closeModal('editCategoryModal');
        await loadCategories();
        showNotification('Categoria atualizada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        showNotification('Erro ao atualizar categoria', 'error');
    }
}

// Alternar status da tarefa
async function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'pending' ? 'completed' : 'pending';

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Erro ao atualizar status da tarefa');

        await loadTasks();
        showNotification(`Tarefa marcada como ${newStatus === 'pending' ? 'pendente' : 'concluída'}!`, 'success');
    } catch (error) {
        console.error('Erro ao atualizar status da tarefa:', error);
        showNotification('Erro ao atualizar status da tarefa', 'error');
    }
}

// Excluir tarefa
async function deleteTask(taskId) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erro ao excluir tarefa');

        await loadTasks();
        showNotification('Tarefa excluída com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        showNotification('Erro ao excluir tarefa', 'error');
    }
}

// Excluir categoria
async function deleteCategory(categoryId) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erro ao excluir categoria');

        await loadCategories();
        showNotification('Categoria excluída com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        showNotification('Erro ao excluir categoria', 'error');
    }
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    // Adicionar estilos se não existirem
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                animation: slideInRight 0.3s ease;
            }
            .notification-success { background: #27ae60; }
            .notification-error { background: #e74c3c; }
            .notification-info { background: #3498db; }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Remover notificação após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
