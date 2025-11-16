// Configuração da API
const API_BASE_URL = 'http://localhost:5000';

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
    statsContent: document.getElementById('statsContent'),
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
        btn.addEventListener('click', () => {
            const pageName = btn.getAttribute('data-page');
            showPage(pageName);
            // Carregar estatísticas quando a página for exibida
            if (pageName === 'stats') {
                loadStats();
            }
        });
    });

    // Submissão de formulários
    document.getElementById('addTaskForm').addEventListener('submit', handleAddTask);
    document.getElementById('editTaskForm').addEventListener('submit', handleEditTask);
    document.getElementById('addCategoryForm').addEventListener('submit', handleAddCategory);
    document.getElementById('editCategoryForm').addEventListener('submit', handleEditCategory);
    
    // Atualização da cor no picker
    document.getElementById('categoryColor').addEventListener('input', (e) => {
        document.getElementById('categoryColorValue').textContent = e.target.value;
    });
    document.getElementById('editCategoryColor').addEventListener('input', (e) => {
        document.getElementById('editCategoryColorValue').textContent = e.target.value;
    });

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
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
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
        const newCategoryInfo = await apiRequest('/categories', 'POST', categoryData);
        const fullNewCategory = await apiRequest(`/categories/${newCategoryInfo.id}`); // Fetch full object if needed
        state.categories.push(fullNewCategory);
        
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
    if (!confirm('Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.')) return;
    
    try {
        await apiRequest(`/categories/${categoryId}`, 'DELETE');
        state.categories = state.categories.filter(c => c.id !== categoryId);
        renderCategories();
        updateCategoryUI();
        await loadTasks(); // As tarefas associadas podem ter mudado
        showNotification('Categoria excluída com sucesso!', 'success');
    } catch (error) {
        console.error('Falha ao excluir categoria:', error);
    }
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
    if (form) form.reset();
    modal.style.display = 'none';
};

window.showAddTaskModal = () => openModal('addTaskModal');
window.showAddCategoryModal = () => openModal('addCategoryModal');

// ---- Funções de Estatísticas ---- //

window.loadStats = async function() {
    dom.statsContent.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
    
    try {
        const stats = await apiRequest('/stats');
        renderStats(stats);
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        dom.statsContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao carregar estatísticas</h3>
                <p>${escapeHtml(error.message)}</p>
            </div>`;
    }
};

function renderStats(stats) {
    const totalTasks = stats.total_tasks || 0;
    const pendingTasks = stats.pending_tasks || 0;
    const completedTasks = stats.completed_tasks || 0;
    const completionRate = stats.completion_rate || 0;
    const recentTasks = stats.recent_tasks || 0;
    const totalCategories = stats.total_categories || 0;
    const categoriesStats = stats.categories_stats || [];

    // Calcular porcentagens para o gráfico
    const pendingPercent = totalTasks > 0 ? (pendingTasks / totalTasks * 100) : 0;
    const completedPercent = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0;

    dom.statsContent.innerHTML = `
        <div class="stats-grid">
            <!-- Cards de Resumo -->
            <div class="stat-card stat-card-primary">
                <div class="stat-icon">
                    <i class="fas fa-tasks"></i>
                </div>
                <div class="stat-content">
                    <h3 class="stat-value">${totalTasks}</h3>
                    <p class="stat-label">Total de Tarefas</p>
                </div>
            </div>

            <div class="stat-card stat-card-warning">
                <div class="stat-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-content">
                    <h3 class="stat-value">${pendingTasks}</h3>
                    <p class="stat-label">Tarefas Pendentes</p>
                </div>
            </div>

            <div class="stat-card stat-card-success">
                <div class="stat-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-content">
                    <h3 class="stat-value">${completedTasks}</h3>
                    <p class="stat-label">Tarefas Concluídas</p>
                </div>
            </div>

            <div class="stat-card stat-card-info">
                <div class="stat-icon">
                    <i class="fas fa-percentage"></i>
                </div>
                <div class="stat-content">
                    <h3 class="stat-value">${completionRate}%</h3>
                    <p class="stat-label">Taxa de Conclusão</p>
                </div>
            </div>

            <div class="stat-card stat-card-secondary">
                <div class="stat-icon">
                    <i class="fas fa-tags"></i>
                </div>
                <div class="stat-content">
                    <h3 class="stat-value">${totalCategories}</h3>
                    <p class="stat-label">Total de Categorias</p>
                </div>
            </div>

            <div class="stat-card stat-card-recent">
                <div class="stat-icon">
                    <i class="fas fa-calendar-week"></i>
                </div>
                <div class="stat-content">
                    <h3 class="stat-value">${recentTasks}</h3>
                    <p class="stat-label">Tarefas (7 dias)</p>
                </div>
            </div>
        </div>

        <!-- Gráfico de Status -->
        <div class="stats-chart-section">
            <h3 class="chart-title">
                <i class="fas fa-chart-pie"></i> Distribuição de Tarefas por Status
            </h3>
            <div class="chart-container">
                <div class="progress-chart">
                    <div class="progress-bar-wrapper">
                        <div class="progress-bar" style="width: 100%; background: linear-gradient(90deg, 
                            var(--warning-color) ${pendingPercent}%, 
                            var(--success-color) ${pendingPercent}% ${pendingPercent + completedPercent}%, 
                            transparent ${pendingPercent + completedPercent}%);">
                        </div>
                    </div>
                    <div class="chart-legend">
                        <div class="legend-item">
                            <span class="legend-color" style="background-color: var(--warning-color);"></span>
                            <span>Pendentes: ${pendingTasks} (${pendingPercent.toFixed(1)}%)</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background-color: var(--success-color);"></span>
                            <span>Concluídas: ${completedTasks} (${completedPercent.toFixed(1)}%)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Estatísticas por Categoria -->
        <div class="stats-chart-section">
            <h3 class="chart-title">
                <i class="fas fa-chart-bar"></i> Tarefas por Categoria
            </h3>
            <div class="categories-stats-list">
                ${categoriesStats.length > 0 ? categoriesStats.map(cat => {
                    const maxCount = Math.max(...categoriesStats.map(c => c.task_count), 1);
                    const percentage = maxCount > 0 ? (cat.task_count / maxCount * 100) : 0;
                    return `
                        <div class="category-stat-item">
                            <div class="category-stat-header">
                                <div class="category-stat-name">
                                    <span class="category-stat-color" style="background-color: ${cat.color};"></span>
                                    <span>${escapeHtml(cat.name)}</span>
                                </div>
                                <span class="category-stat-count">${cat.task_count} tarefa(s)</span>
                            </div>
                            <div class="category-stat-bar">
                                <div class="category-stat-bar-fill" 
                                     style="width: ${percentage}%; background-color: ${cat.color};">
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') : '<p class="no-data">Nenhuma categoria com tarefas encontrada.</p>'}
            </div>
        </div>
    `;
}

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

// ---- Funções de Gravação de Áudio ---- //

let mediaRecorder;
let audioChunks = [];
let recordedAudioBlob = null;
let timerInterval;
let seconds = 0;
let isRecording = false;

const WEBHOOK_URL = 'https://testessss.app.n8n.cloud/webhook/audio-to-transcribe';

const audioElements = {
    recordBtn: document.getElementById('record-btn'),
    recordingStatus: document.getElementById('recording-status'),
    timerEl: document.getElementById('timer'),
    audioPlaybackContainer: document.getElementById('audio-playback-container'),
    audioPlayer: document.getElementById('audio-player'),
    reRecordBtn: document.getElementById('re-record-btn'),
    submitAudioBtn: document.getElementById('submit-audio-btn'),
    transcriptSection: document.getElementById('transcript-section'),
    transcriptInput: document.getElementById('transcript-input'),
    objectiveInput: document.getElementById('objective-input'),
    transcribeAnotherBtn: document.getElementById('transcribe-another-btn'),
    createTaskBtn: document.getElementById('create-task-from-audio-btn'),
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingText: document.getElementById('loading-text'),
};

const formatTime = (time) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const secs = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
};

const showLoadingAudio = (message) => {
    audioElements.loadingText.textContent = message;
    audioElements.loadingOverlay.style.display = 'flex';
};

const hideLoadingAudio = () => {
    audioElements.loadingOverlay.style.display = 'none';
};

const updateTimer = () => {
    seconds++;
    audioElements.timerEl.textContent = formatTime(seconds);
};

const resetRecordingState = () => {
    isRecording = false;
    clearInterval(timerInterval);
    seconds = 0;
    audioElements.timerEl.textContent = '00:00';
    audioElements.recordBtn.textContent = '<i class="fas fa-circle"></i> Iniciar Gravação';
    audioElements.recordBtn.classList.remove('btn-danger');
    audioElements.recordBtn.classList.add('btn-primary');
    audioElements.recordingStatus.textContent = 'Pressione para gravar';
    audioElements.audioPlaybackContainer.style.display = 'none';
    audioElements.recordBtn.style.display = 'block';
    audioElements.transcriptInput.value = '';
    audioElements.objectiveInput.value = '';
};

const showAudioSection = () => {
    document.getElementById('audio-section').style.display = 'block';
    document.getElementById('transcript-section').style.display = 'none';
};

const showTranscriptSection = () => {
    document.getElementById('audio-section').style.display = 'none';
    document.getElementById('transcript-section').style.display = 'block';
};

// Event Listeners para Áudio
audioElements.recordBtn.addEventListener('click', async () => {
    if (isRecording) {
        mediaRecorder.stop();
    } else if (audioElements.recordBtn.textContent.includes('Gravar Novamente')) {
        resetRecordingState();
        showAudioSection();
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                recordedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioURL = URL.createObjectURL(recordedAudioBlob);
                audioElements.audioPlayer.src = audioURL;
                stream.getTracks().forEach(track => track.stop());

                audioElements.recordBtn.style.display = 'none';
                audioElements.recordingStatus.textContent = 'Gravação finalizada.';
                audioElements.audioPlaybackContainer.style.display = 'block';
                clearInterval(timerInterval);
            };

            mediaRecorder.start();
            isRecording = true;
            audioElements.recordBtn.textContent = '<i class="fas fa-stop"></i> Parar Gravação';
            audioElements.recordBtn.classList.remove('btn-primary');
            audioElements.recordBtn.classList.add('btn-danger');
            audioElements.recordingStatus.textContent = 'Gravando...';
            seconds = 0;
            audioElements.timerEl.textContent = '00:00';
            timerInterval = setInterval(updateTimer, 1000);
        } catch (error) {
            console.error('Erro ao acessar microfone:', error);
            alert('Não foi possível acessar o microfone. Permita o acesso.');
            audioElements.recordingStatus.textContent = 'Erro: Acesso ao microfone negado.';
        }
    }
});

audioElements.reRecordBtn.addEventListener('click', () => {
    resetRecordingState();
    showAudioSection();
});

audioElements.submitAudioBtn.addEventListener('click', async () => {
    if (!recordedAudioBlob) {
        alert('Por favor, grave o áudio primeiro.');
        return;
    }

    showLoadingAudio('Transcrevendo áudio...');

    const formData = new FormData();
    formData.append('audio_file', recordedAudioBlob, 'audio.webm');
    formData.append('objetivo', 'objetivo');

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Resposta do webhook:", result);

        audioElements.transcriptInput.value = result.Transcript || 'Nenhuma transcrição recebida.';
        showTranscriptSection();
        
        audioElements.audioPlaybackContainer.style.display = 'none';
        audioElements.recordBtn.style.display = 'block'; 
        audioElements.recordBtn.textContent = '<i class="fas fa-circle"></i> Gravar Novo Áudio'; 
        audioElements.recordBtn.classList.remove('btn-danger');
        audioElements.recordBtn.classList.add('btn-primary');
        audioElements.recordingStatus.textContent = 'Áudio transcrito!';
        audioElements.timerEl.textContent = '00:00';
        
    } catch (error) {
        console.error('Erro ao enviar áudio para webhook:', error);
        alert(`Falha na transcrição: ${error.message}`);
        resetRecordingState();
        showAudioSection();
    } finally {
        hideLoadingAudio();
    }
});

audioElements.transcribeAnotherBtn.addEventListener('click', () => {
    resetRecordingState();
    showAudioSection();
});

audioElements.createTaskBtn.addEventListener('click', async () => {
    const transcript = audioElements.transcriptInput.value.trim();
    const objective = audioElements.objectiveInput.value.trim();

    if (!transcript) {
        alert('A transcrição não pode estar vazia.');
        return;
    }

    if (!objective) {
        alert('O objetivo não pode estar vazio.');
        return;
    }

    try {
        const taskData = {
            title: objective,
            description: transcript,
            status: 'pending',
            user_id: 1
        };

        const newTask = await apiRequest('/tasks', 'POST', taskData);
        const fullNewTask = await apiRequest(`/tasks/${newTask.id}`);
        state.tasks.push(fullNewTask);

        renderTasks();
        showNotification('Tarefa criada a partir da transcrição!', 'success');
        resetRecordingState();
        showAudioSection();
        showPage('dashboard');
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
    }
});