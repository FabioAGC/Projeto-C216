// Configuração da API
// Usar URLs relativas que serão proxiadas pelo nginx
const API_BASE_URL = '/api';

// Estado global da aplicação
const state = {
    tasks: [],
    categories: [],
    isLoading: {
        tasks: false,
        categories: false,
    }
};

// Elementos do DOM
const dom = {
    tasksList: document.getElementById('tasksList'),
    categoriesList: document.getElementById('categoriesList'),
    categoryFilter: document.getElementById('categoryFilter'),
    taskCategoriesCheckboxes: document.getElementById('taskCategories'),
    editTaskCategoriesCheckboxes: document.getElementById('editTaskCategories'),
    notificationContainer: document.getElementById('notification-container'),
    pages: document.querySelectorAll('.page'),
    navButtons: document.querySelectorAll('.nav-btn'),
    themeToggleButton: document.getElementById('theme-toggle'),
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    loadTheme(); // Carrega o tema salvo ou preferencial
    setupEventListeners();
    await loadInitialData();
}

async function loadInitialData() {
    await Promise.all([loadCategories(), loadTasks()]);
}

// ---- Funções de Renderização e UI ---- //

function renderTasks() {
    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = dom.categoryFilter.value;

    let filteredTasks = [...state.tasks];
    if (statusFilter) {
        filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
    }
    if (categoryFilter) {
        filteredTasks = filteredTasks.filter(task => 
            task.categories.some(cat => cat.id.toString() === categoryFilter)
        );
    }

    if (state.isLoading.tasks) {
        dom.tasksList.innerHTML = `<div class="loader-container"><div class="loader"></div></div>`;
        return;
    }

    if (filteredTasks.length === 0) {
        dom.tasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>Nenhuma tarefa encontrada</h3>
                <p>Crie uma nova tarefa ou ajuste os filtros.</p>
            </div>`;
        return;
    }

    dom.tasksList.innerHTML = filteredTasks.map(task => `
        <div class="task-card ${task.status}">
            <div class="task-title">${escapeHtml(task.title)}</div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
            ${task.categories.length > 0 ? `
                <div class="task-categories">
                    ${task.categories.map(cat => `
                        <span class="category-tag" style="background-color: ${cat.color};">${escapeHtml(cat.name)}</span>
                    `).join('')}
                </div>` : ''}
            <div class="task-actions">
                <button class="btn btn-success" onclick="toggleTaskStatus(${task.id})">
                    <i class="fas fa-${task.status === 'pending' ? 'check' : 'undo'}"></i> ${task.status === 'pending' ? 'Concluir' : 'Reabrir'}
                </button>
                <button class="btn btn-warning" onclick="editTask(${task.id})"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn btn-danger" onclick="deleteTask(${task.id})"><i class="fas fa-trash"></i> Excluir</button>
            </div>
        </div>
    `).join('');
}

function renderCategories() {
    if (state.isLoading.categories) {
        dom.categoriesList.innerHTML = `<div class="loader-container"><div class="loader"></div></div>`;
        return;
    }

    if (state.categories.length === 0) {
        dom.categoriesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tags"></i>
                <h3>Nenhuma categoria encontrada</h3>
                <p>Crie categorias para organizar suas tarefas.</p>
            </div>`;
        return;
    }

    dom.categoriesList.innerHTML = state.categories.map(category => `
        <div class="category-card">
            <div class="category-header">
                <div class="category-name">
                    <div class="category-color" style="background-color: ${category.color}"></div>
                    ${escapeHtml(category.name)}
                </div>
                <div class="category-actions">
                    <button class="btn btn-warning" onclick="editCategory(${category.id})"><i class="fas fa-edit"></i> Editar</button>
                    <button class="btn btn-danger" onclick="deleteCategory(${category.id})"><i class="fas fa-trash"></i> Excluir</button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateCategoryUI() {
    // Atualizar filtro
    dom.categoryFilter.innerHTML = '<option value="">Todas as categorias</option>' +
        state.categories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('');

    // Atualizar checkboxes nos modais
    const categoryHtml = state.categories.map(cat => `
        <div class="category-checkbox">
            <input type="checkbox" id="cat-add-${cat.id}" value="${cat.id}">
            <label for="cat-add-${cat.id}">
                <div class="category-checkbox-color" style="background-color: ${cat.color}"></div>
                ${escapeHtml(cat.name)}
            </label>
        </div>
    `).join('');
    const editCategoryHtml = state.categories.map(cat => `
        <div class="category-checkbox">
            <input type="checkbox" id="cat-edit-${cat.id}" value="${cat.id}">
            <label for="cat-edit-${cat.id}">
                <div class="category-checkbox-color" style="background-color: ${cat.color}"></div>
                ${escapeHtml(cat.name)}
            </label>
        </div>
    `).join('');
    
    dom.taskCategoriesCheckboxes.innerHTML = categoryHtml;
    dom.editTaskCategoriesCheckboxes.innerHTML = editCategoryHtml;
}


// ---- Funções de Event Listeners ---- //

function setupEventListeners() {
    // Navegação
    dom.navButtons.forEach(btn => {
        btn.addEventListener('click', () => showPage(btn.getAttribute('data-page')));
    });

    // Submissão de formulários
    document.getElementById('addTaskForm').addEventListener('submit', handleAddTask);
    document.getElementById('editTaskForm').addEventListener('submit', handleEditTask);
    document.getElementById('addCategoryForm').addEventListener('submit', handleAddCategory);
    document.getElementById('editCategoryForm').addEventListener('submit', handleEditCategory);
    
    // Atualizar color picker ao abrir modal
    const addCategoryColorPreview = document.querySelector('#addCategoryModal .color-preview');
    const editCategoryColorPreview = document.querySelector('#editCategoryModal .color-preview');
    if (addCategoryColorPreview) {
        addCategoryColorPreview.addEventListener('click', () => openColorPicker('categoryColor'));
    }
    if (editCategoryColorPreview) {
        editCategoryColorPreview.addEventListener('click', () => openColorPicker('editCategoryColor'));
    }

    // Fechar modais
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });

    // Listener para o botão de tema
    dom.themeToggleButton.addEventListener('click', toggleTheme);
}


// ---- Funções de Dados (API e Estado) ---- //

async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            let errorMessage = `Erro HTTP: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                const text = await response.text();
                if (text) errorMessage = text;
            }
            throw new Error(errorMessage);
        }
        return response.status === 204 ? null : await response.json();
    } catch (error) {
        showNotification(`Erro: ${error.message}`, 'error');
        throw error;
    }
}

async function loadTasks() {
    state.isLoading.tasks = true;
    renderTasks();
    try {
        state.tasks = await apiRequest('/tasks');
    } finally {
        state.isLoading.tasks = false;
        renderTasks();
    }
}

async function loadCategories() {
    state.isLoading.categories = true;
    renderCategories();
    try {
        state.categories = await apiRequest('/categories');
        updateCategoryUI();
    } finally {
        state.isLoading.categories = false;
        renderCategories();
    }
}


// ---- Funções de Ação (Manipuladores de Eventos) ---- //

async function handleAddTask(e) {
    e.preventDefault();
    const form = e.target;
    const taskData = {
        title: form.querySelector('#taskTitle').value,
        description: form.querySelector('#taskDescription').value,
        status: form.querySelector('#taskStatus').value,
        user_id: 1 // Default user
    };
    
    try {
        const newTask = await apiRequest('/tasks', 'POST', taskData);
        const selectedCategories = getSelectedCategories(form, '#taskCategories');
        if (selectedCategories.length > 0) {
            await updateTaskCategories(newTask.id, [], selectedCategories);
        }
        
        const fullNewTask = await apiRequest(`/tasks/${newTask.id}`);
        state.tasks.push(fullNewTask);
        
        renderTasks();
        closeModal('addTaskModal');
        showNotification('Tarefa criada com sucesso!', 'success');
    } catch (error) {
        console.error('Falha ao criar tarefa:', error);
    }
}

async function handleEditTask(e) {
    e.preventDefault();
    const form = e.target;
    const taskId = form.querySelector('#editTaskId').value;
    const taskData = {
        title: form.querySelector('#editTaskTitle').value,
        description: form.querySelector('#editTaskDescription').value,
        status: form.querySelector('#editTaskStatus').value
    };

    try {
        await apiRequest(`/tasks/${taskId}`, 'PUT', taskData);
        
        const originalTask = state.tasks.find(t => t.id == taskId);
        const originalCategoryIds = originalTask.categories.map(c => c.id);
        const newCategoryIds = getSelectedCategories(form, '#editTaskCategories');
        
        await updateTaskCategories(taskId, originalCategoryIds, newCategoryIds);

        const updatedTask = await apiRequest(`/tasks/${taskId}`);
        const taskIndex = state.tasks.findIndex(t => t.id == taskId);
        if (taskIndex !== -1) {
            state.tasks[taskIndex] = updatedTask;
        }
        
        renderTasks();
        closeModal('editTaskModal');
        showNotification('Tarefa atualizada com sucesso!', 'success');
    } catch (error) {
        console.error('Falha ao editar tarefa:', error);
    }
}

async function handleAddCategory(e) {
    e.preventDefault();
    const form = e.target;
    const categoryData = {
        name: form.querySelector('#categoryName').value,
        color: form.querySelector('#categoryColor').value
    };
    try {
        const newCategory = await apiRequest('/categories', 'POST', categoryData);
        state.categories.push(newCategory);
        
        renderCategories();
        updateCategoryUI();
        closeModal('addCategoryModal');
        showNotification('Categoria criada com sucesso!', 'success');
    } catch(error) {
         console.error('Falha ao criar categoria:', error);
    }
}

async function handleEditCategory(e) {
    e.preventDefault();
    const form = e.target;
    const categoryId = form.querySelector('#editCategoryId').value;
    const categoryData = {
        name: form.querySelector('#editCategoryName').value,
        color: form.querySelector('#editCategoryColor').value
    };
    
    try {
        await apiRequest(`/categories/${categoryId}`, 'PUT', categoryData);

        const categoryIndex = state.categories.findIndex(c => c.id == categoryId);
        if (categoryIndex !== -1) {
            state.categories[categoryIndex] = { ...state.categories[categoryIndex], ...categoryData };
        }
        
        renderCategories();
        updateCategoryUI();
        await loadTasks(); // Recarregar tarefas para refletir a mudança de cor/nome
        closeModal('editCategoryModal');
        showNotification('Categoria atualizada com sucesso!', 'success');
    } catch (error) {
        console.error('Falha ao editar categoria:', error);
    }
}

window.toggleTaskStatus = async function(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    
    try {
        await apiRequest(`/tasks/${taskId}`, 'PUT', { status: newStatus });
        task.status = newStatus;
        renderTasks();
        showNotification(`Tarefa marcada como ${newStatus === 'completed' ? 'concluída' : 'pendente'}.`, 'success');
    } catch (error) {
        console.error('Falha ao alterar status:', error);
    }
};

window.deleteTask = async function(taskId) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    
    try {
        await apiRequest(`/tasks/${taskId}`, 'DELETE');
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        renderTasks();
        showNotification('Tarefa excluída com sucesso!', 'success');
    } catch (error) {
        console.error('Falha ao excluir tarefa:', error);
    }
};

window.deleteCategory = async function(categoryId) {
    showDeleteConfirm(
        'Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.',
        async () => {
            try {
                await apiRequest(`/categories/${categoryId}`, 'DELETE');
                state.categories = state.categories.filter(c => c.id !== categoryId);
                renderCategories();
                updateCategoryUI();
                await loadTasks();
                showNotification('Categoria excluída com sucesso!', 'success');
            } catch (error) {
                console.error('Falha ao excluir categoria:', error);
            }
        }
    );
};

window.editTask = function(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const form = document.getElementById('editTaskForm');
    form.querySelector('#editTaskId').value = taskId;
    form.querySelector('#editTaskTitle').value = task.title;
    form.querySelector('#editTaskDescription').value = task.description || '';
    form.querySelector('#editTaskStatus').value = task.status;

    form.querySelectorAll('#editTaskCategories input[type="checkbox"]').forEach(cb => cb.checked = false);
    task.categories.forEach(cat => {
        const checkbox = form.querySelector(`#editTaskCategories input[value="${cat.id}"]`);
        if (checkbox) checkbox.checked = true;
    });

    openModal('editTaskModal');
};

window.editCategory = function(categoryId) {
    const category = state.categories.find(c => c.id === categoryId);
    if (!category) return;
    
    const form = document.getElementById('editCategoryForm');
    form.querySelector('#editCategoryId').value = categoryId;
    form.querySelector('#editCategoryName').value = category.name;
    form.querySelector('#editCategoryColor').value = category.color;
    form.querySelector('#editCategoryColorValue').textContent = category.color;
    document.querySelector('#editCategoryModal .color-preview').style.backgroundColor = category.color;

    openModal('editCategoryModal');
};

// ---- Funções Utilitárias ---- //

function showPage(pageName) {
    dom.pages.forEach(page => page.classList.toggle('active', page.id === pageName));
    dom.navButtons.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-page') === pageName));
}

window.filterTasks = renderTasks;

function getSelectedCategories(form, containerSelector) {
    return Array.from(form.querySelectorAll(`${containerSelector} input:checked`))
        .map(cb => parseInt(cb.value));
}

async function updateTaskCategories(taskId, originalIds, newIds) {
    const toAdd = newIds.filter(id => !originalIds.includes(id));
    const toRemove = originalIds.filter(id => !newIds.includes(id));
    
    const promises = [
        ...toAdd.map(catId => apiRequest(`/tasks/${taskId}/categories/${catId}`, 'POST')),
        ...toRemove.map(catId => apiRequest(`/tasks/${taskId}/categories/${catId}`, 'DELETE'))
    ];
    await Promise.all(promises);
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';
    const firstInput = modal.querySelector('input[type="text"]');
    if (firstInput) {
        firstInput.focus();
    }
}
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
        // Restaurar valores dos hidden inputs
        const categoryColorInput = form.querySelector('#categoryColor');
        const editCategoryColorInput = form.querySelector('#editCategoryColor');
        if (categoryColorInput) categoryColorInput.value = '#3498db';
        if (editCategoryColorInput) editCategoryColorInput.value = '#3498db';
    }
    modal.style.display = 'none';
};

window.showAddTaskModal = () => openModal('addTaskModal');
window.showAddCategoryModal = () => {
    // Resetar cores para o padrão
    document.getElementById('categoryColor').value = '#3498db';
    document.getElementById('categoryColorValue').textContent = '#3498db';
    document.querySelector('#addCategoryModal .color-preview').style.backgroundColor = '#3498db';
    openModal('addCategoryModal');
};

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${escapeHtml(message)}</span>`;
    dom.notificationContainer.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.4s ease-out reverse';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ---- Funções de Gerenciamento de Tema ---- //

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        dom.themeToggleButton.innerHTML = '<i class="fas fa-sun"></i>'; // Ícone de Sol
    } else {
        document.body.classList.remove('dark-mode');
        dom.themeToggleButton.innerHTML = '<i class="fas fa-moon"></i>'; // Ícone de Lua
    }
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (systemPrefersDark) {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }
}

// ---- Funções de Color Picker Customizado ---- //

let currentColorInputId = null;
let currentColorValue = '#3498db';

window.openColorPicker = function(inputId) {
    currentColorInputId = inputId;
    const inputElement = document.getElementById(inputId);
    currentColorValue = inputElement.value;
    
    document.getElementById('colorPickerInput').value = currentColorValue;
    document.getElementById('colorPickerValue').textContent = currentColorValue;
    
    // Atualizar visual dos presets
    document.querySelectorAll('.color-preset').forEach(preset => {
        preset.classList.remove('selected');
        if (preset.style.backgroundColor === rgbToHex(currentColorValue)) {
            preset.classList.add('selected');
        }
    });
    
    openModal('colorPickerModal');
};

window.selectColorPreset = function(color) {
    currentColorValue = color;
    document.getElementById('colorPickerInput').value = color;
    document.getElementById('colorPickerValue').textContent = color;
    
    document.querySelectorAll('.color-preset').forEach(preset => {
        preset.classList.remove('selected');
        if (preset.style.backgroundColor === color) {
            preset.classList.add('selected');
        }
    });
};

window.confirmColorSelection = function() {
    if (currentColorInputId) {
        const hiddenInput = document.getElementById(currentColorInputId);
        hiddenInput.value = currentColorValue;
        
        const valueSpanId = currentColorInputId === 'categoryColor' ? 'categoryColorValue' : 'editCategoryColorValue';
        document.getElementById(valueSpanId).textContent = currentColorValue;
        
        // Atualizar o color-preview visual
        const previewId = currentColorInputId === 'categoryColor' ? '#addCategoryModal .color-preview' : '#editCategoryModal .color-preview';
        const previewElement = document.querySelector(previewId);
        if (previewElement) {
            previewElement.style.backgroundColor = currentColorValue;
        }
    }
    closeColorPickerModal();
};

window.closeColorPickerModal = function() {
    closeModal('colorPickerModal');
};

// Atualizar cor em tempo real no input
document.addEventListener('DOMContentLoaded', function() {
    const colorInput = document.getElementById('colorPickerInput');
    if (colorInput) {
        colorInput.addEventListener('input', (e) => {
            currentColorValue = e.target.value;
            document.getElementById('colorPickerValue').textContent = e.target.value;
        });
    }
});

function rgbToHex(c) {
    if (c.startsWith('#')) return c;
    const rgb = c.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (rgb) {
        return "#" + ((1 << 24) + (parseInt(rgb[1]) << 16) + (parseInt(rgb[2]) << 8) + parseInt(rgb[3])).toString(16).slice(1);
    }
    return c;
}

// ---- Funções de Confirmação de Exclusão Customizada ---- //

let pendingDeleteCallback = null;

window.showDeleteConfirm = function(message, callback) {
    document.getElementById('deleteConfirmMessage').textContent = message;
    pendingDeleteCallback = callback;
    openModal('deleteConfirmModal');
};

window.confirmDelete = function() {
    if (pendingDeleteCallback) {
        pendingDeleteCallback();
    }
    closeDeleteConfirmModal();
};

window.closeDeleteConfirmModal = function() {
    closeModal('deleteConfirmModal');
    pendingDeleteCallback = null;
};