
const $ = (selector) => document.querySelector(selector);

const taskList = $('#taskList');
const emptyState = $('#emptyState');
const searchInput = $('#searchInput');
const statusFilter = $('#statusFilter');
const clearCompletedBtn = $('#clearCompletedBtn');
const progressBar = $('#progressBar');
const progressLabel = $('#progressLabel');
const progressPercent = $('#progressPercent');
const totalCount = $('#totalCount');
const completedCount = $('#completedCount');
const pendingCount = $('#pendingCount');

const icons = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 8-9 16-9 0 8-3 16-9 16Z"/><path d="M8 16c2-3 5-5 9-7"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="m18 6-12 12M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>'
};

function icon(name, size = 20) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ''}</svg>`;
}

function addIcon(containerId, name, size = 20) {
    const container = document.getElementById(containerId);

    if (container) {
        container.innerHTML = icon(name, size);
    }
}

addIcon('headerLogoContainer', 'leaf', 24);
addIcon('helpIconContainer', 'search', 18);
addIcon('addBtnIconContainer', 'plus', 18);

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem('craftflow_tasks');

        if (savedTasks !== null) {
            const parsedTasks = JSON.parse(savedTasks);

            if (Array.isArray(parsedTasks)) {
                return parsedTasks
                    .filter(task => task && typeof task === 'object')
                    .map(task => ({
                        id: task.id ?? Date.now() + Math.random(),
                        title: String(task.title ?? ''),
                        description: String(task.description ?? ''),
                        priority: ['low', 'medium', 'high'].includes(task.priority)
                            ? task.priority
                            : 'medium',
                        completed: Boolean(task.completed),
                        createdAt: task.createdAt || new Date().toISOString()
                    }))
                    .filter(task => task.title.trim() !== '');
            }
        }
    } catch (error) {
        console.error('Could not load saved craft steps:', error);
    }

    return [
        {
            id: 1,
            title: 'Choose a craft project',
            description: 'Decide what you want to create.',
            priority: 'high',
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            title: 'Gather materials',
            description: 'Prepare the materials needed for your project.',
            priority: 'medium',
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: 3,
            title: 'Organize your workspace',
            description: 'Keep your tools and materials organized.',
            priority: 'low',
            completed: true,
            createdAt: new Date().toISOString()
        }
    ];
}

let tasks = loadTasks();
let currentFilter = 'all';
let editingTaskId = null;

if (!localStorage.getItem('craftflow_tasks')) {
    saveTasks();
}

function saveTasks() {
    try {
        localStorage.setItem('craftflow_tasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Could not save craft steps:', error);
        showMessage('Your changes could not be saved in this browser.', 'error');
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function showMessage(message, type = 'success') {
    let toast = $('#craftflowToast');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'craftflowToast';
        toast.className = 'fixed bottom-5 right-5 z-[100] max-w-sm rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg';
        toast.setAttribute('role', 'status');
        document.body.appendChild(toast);
    }

    toast.className = `fixed bottom-5 right-5 z-[100] max-w-sm rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
        type === 'error' ? 'bg-red-600' : 'bg-green-700'
    }`;

    toast.textContent = message;
    toast.hidden = false;

    if (toast._hideTimeout) {
        clearTimeout(toast._hideTimeout);
    }

    toast._hideTimeout = setTimeout(() => {
        toast.hidden = true;
    }, 3000);
}

function createCraftForm() {
    if ($('#craftflowModal')) return;

    const modal = document.createElement('div');
    modal.id = 'craftflowModal';
    modal.className = 'fixed inset-0 z-50 hidden items-center justify-center bg-black/50 p-4';
    modal.innerHTML = `
        <section class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="craftflowFormTitle">
            <div class="mb-5 flex items-center justify-between gap-4">
                <h2 id="craftflowFormTitle" class="text-2xl font-bold text-slate-800">Add craft step</h2>
                <button id="closeCraftForm" type="button" class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-green-600" aria-label="Close form">
                    ${icon('close')}
                </button>
            </div>

            <form id="craftflowForm" class="space-y-4">
                <div>
                    <label for="taskTitle" class="mb-1 block text-sm font-semibold text-slate-700">Craft step title</label>
                    <input id="taskTitle" name="title" type="text" maxlength="80" required placeholder="What do you need to do?" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100">
                    <div class="mt-1 flex items-center justify-between gap-3">
                        <p id="titleError" class="hidden text-sm text-red-600">Please enter a title.</p>
                        <p id="titleCount" class="ml-auto text-xs text-slate-500">0/80</p>
                    </div>
                </div>

                <div>
                    <label for="taskDescription" class="mb-1 block text-sm font-semibold text-slate-700">Description</label>
                    <textarea id="taskDescription" name="description" rows="3" maxlength="250" placeholder="Add a few details (optional)" class="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"></textarea>
                    <p id="descriptionCount" class="mt-1 text-right text-xs text-slate-500">0/250</p>
                </div>

                <div>
                    <label for="taskPriority" class="mb-1 block text-sm font-semibold text-slate-700">Priority</label>
                    <select id="taskPriority" name="priority" class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100">
                        <option value="low">Low priority</option>
                        <option value="medium" selected>Medium priority</option>
                        <option value="high">High priority</option>
                    </select>
                </div>

                <div class="flex justify-end gap-3 pt-2">
                    <button id="cancelCraftForm" type="button" class="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
                    <button id="saveCraftStep" type="submit" class="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500">Add step</button>
                </div>
            </form>
        </section>
    `;

    document.body.appendChild(modal);

    $('#closeCraftForm').addEventListener('click', closeCraftForm);
    $('#cancelCraftForm').addEventListener('click', closeCraftForm);

    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeCraftForm();
        }
    });

    $('#taskTitle').addEventListener('input', () => {
        $('#titleCount').textContent = `${$('#taskTitle').value.length}/80`;
        $('#titleError').classList.add('hidden');
    });

    $('#taskDescription').addEventListener('input', () => {
        $('#descriptionCount').textContent = `${$('#taskDescription').value.length}/250`;
    });

    $('#craftflowForm').addEventListener('submit', handleFormSubmit);
}

function openCraftForm(task = null) {
    createCraftForm();

    editingTaskId = task ? task.id : null;

    const modal = $('#craftflowModal');
    const title = $('#craftflowFormTitle');
    const titleInput = $('#taskTitle');
    const descriptionInput = $('#taskDescription');
    const priorityInput = $('#taskPriority');
    const saveButton = $('#saveCraftStep');

    title.textContent = task ? 'Edit craft step' : 'Add craft step';
    saveButton.textContent = task ? 'Save changes' : 'Add step';

    titleInput.value = task ? task.title : '';
    descriptionInput.value = task ? task.description : '';
    priorityInput.value = task ? task.priority : 'medium';

    $('#titleCount').textContent = `${titleInput.value.length}/80`;
    $('#descriptionCount').textContent = `${descriptionInput.value.length}/250`;
    $('#titleError').classList.add('hidden');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    titleInput.focus();
}

function closeCraftForm() {
    const modal = $('#craftflowModal');

    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');
    editingTaskId = null;
}

function handleFormSubmit(event) {
    event.preventDefault();

    const titleInput = $('#taskTitle');
    const descriptionInput = $('#taskDescription');
    const priorityInput = $('#taskPriority');
    const title = titleInput.value.trim();

    if (!title) {
        $('#titleError').classList.remove('hidden');
        titleInput.focus();
        return;
    }

    const description = descriptionInput.value.trim();
    const priority = priorityInput.value;
    const now = new Date().toISOString();

    if (editingTaskId !== null) {
        tasks = tasks.map(task => task.id === editingTaskId
            ? { ...task, title, description, priority }
            : task
        );

        showMessage('Craft step updated successfully.');
    } else {
        tasks.unshift({
            id: Date.now(),
            title,
            description,
            priority,
            completed: false,
            createdAt: now
        });

        showMessage('Craft step added successfully.');
    }

    saveTasks();
    renderTasks();
    closeCraftForm();
}

function getVisibleTasks() {
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    return tasks.filter(task => {
        const matchesFilter =
            currentFilter === 'all' ||
            (currentFilter === 'active' && !task.completed) ||
            (currentFilter === 'completed' && task.completed);

        const matchesSearch =
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm);

        return matchesFilter && matchesSearch;
    });
}

function renderTasks() {
    if (!taskList) return;

    const visibleTasks = getVisibleTasks();

    taskList.innerHTML = '';

    if (visibleTasks.length === 0) {
        if (emptyState) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
        }
    } else {
        if (emptyState) {
            emptyState.classList.add('hidden');
            emptyState.classList.remove('flex');
        }
    }

    visibleTasks.forEach(task => {
        const card = document.createElement('article');

        const priorityStyles = {
            low: 'bg-blue-100 text-blue-700',
            medium: 'bg-amber-100 text-amber-700',
            high: 'bg-red-100 text-red-700'
        };

        const priorityClass = priorityStyles[task.priority] || priorityStyles.medium;

        card.className = `rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
            task.completed ? 'border-green-200 bg-green-50/50' : 'border-slate-200 bg-white'
        }`;

        card.innerHTML = `
            <div class="flex items-start gap-3">
                <button type="button" data-action="toggle" data-id="${escapeHTML(task.id)}" class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    task.completed
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-slate-300 text-transparent hover:border-green-600'
                }" aria-label="${task.completed ? 'Mark as incomplete' : 'Mark as completed'}">
                    ${icon('check', 15)}
                </button>

                <div class="min-w-0 flex-1">
                    <div class="mb-2 flex flex-wrap items-center gap-2">
                        <h3 class="break-words text-lg font-bold ${
                            task.completed ? 'text-slate-500 line-through' : 'text-slate-800'
                        }">${escapeHTML(task.title)}</h3>
                        <span class="rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClass}">
                            ${escapeHTML(task.priority)} priority
                        </span>
                    </div>

                    ${
                        task.description
                            ? `<p class="break-words text-sm leading-6 text-slate-600">${escapeHTML(task.description)}</p>`
                            : ''
                    }

                    <p class="mt-3 text-xs font-medium ${
                        task.completed ? 'text-green-700' : 'text-slate-400'
                    }">${task.completed ? 'Completed' : 'In progress'}</p>
                </div>

                <div class="flex shrink-0 items-center gap-1">
                    <button type="button" data-action="edit" data-id="${escapeHTML(task.id)}" class="rounded-lg p-2 text-slate-500 hover:bg-green-50 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500" aria-label="Edit ${escapeHTML(task.title)}">
                        ${icon('edit', 18)}
                    </button>
                    <button type="button" data-action="delete" data-id="${escapeHTML(task.id)}" class="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label="Delete ${escapeHTML(task.title)}">
                        ${icon('trash', 18)}
                    </button>
                </div>
            </div>
        `;

        taskList.appendChild(card);
    });

    updateDashboard();
}

function updateDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    if (totalCount) totalCount.textContent = total;
    if (completedCount) completedCount.textContent = completed;
    if (pendingCount) pendingCount.textContent = pending;
    if (progressPercent) progressPercent.textContent = `${percentage}%`;
    if (progressLabel) progressLabel.textContent = `${completed} of ${total} steps completed`;

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);
    }

    if (clearCompletedBtn) {
        clearCompletedBtn.disabled = completed === 0;
        clearCompletedBtn.classList.toggle('opacity-50', completed === 0);
        clearCompletedBtn.classList.toggle('cursor-not-allowed', completed === 0);
    }
}

if (taskList) {
    taskList.addEventListener('click', event => {
        const button = event.target.closest('button[data-action]');

        if (!button) return;

        const taskId = button.dataset.id;
        const task = tasks.find(item => String(item.id) === taskId);

        if (!task) return;

        if (button.dataset.action === 'toggle') {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
            showMessage(task.completed ? 'Craft step completed!' : 'Craft step marked as in progress.');
        }

        if (button.dataset.action === 'edit') {
            openCraftForm(task);
        }

        if (button.dataset.action === 'delete') {
            const confirmed = window.confirm(`Delete "${task.title}"?`);

            if (!confirmed) return;

            tasks = tasks.filter(item => String(item.id) !== taskId);
            saveTasks();
            renderTasks();
            showMessage('Craft step deleted.');
        }
    });
}

$('#headerAddBtn')?.addEventListener('click', () => openCraftForm());
$('#openAddBtn')?.addEventListener('click', () => openCraftForm());

if (searchInput) {
    searchInput.addEventListener('input', renderTasks);
}

if (statusFilter) {
    statusFilter.addEventListener('click', event => {
        const button = event.target.closest('[data-filter]');

        if (!button) return;

        currentFilter = button.dataset.filter;

        statusFilter.querySelectorAll('[data-filter]').forEach(filterButton => {
            const selected = filterButton === button;

            filterButton.classList.toggle('bg-green-700', selected);
            filterButton.classList.toggle('text-white', selected);
            filterButton.classList.toggle('bg-slate-100', !selected);
            filterButton.classList.toggle('text-slate-600', !selected);
            filterButton.setAttribute('aria-pressed', String(selected));
        });

        renderTasks();
    });
}

if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', () => {
        const completedTasks = tasks.filter(task => task.completed).length;

        if (completedTasks === 0) return;

        const confirmed = window.confirm('Clear all completed craft steps?');

        if (!confirmed) return;

        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        showMessage('Completed craft steps cleared.');
    });
}

$('#helpBtn')?.addEventListener('click', () => {
    window.alert(
        'CraftFlow Help\n\n' +
        '• Use "New Craft Step" to add a task.\n' +
        '• Select the circle to mark a task complete.\n' +
        '• Use the edit icon to update a task.\n' +
        '• Use the delete icon to remove a task.\n' +
        '• Search or use the filters to find tasks.\n' +
        '• Your tasks are saved in this browser.'
    );
});

document.addEventListener('keydown', event => {
    const modal = $('#craftflowModal');
    const modalIsOpen = modal && !modal.classList.contains('hidden');
    const activeTag = document.activeElement?.tagName;
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag);

    if (event.key === 'Escape' && modalIsOpen) {
        closeCraftForm();
    }

   
if (
    event.key.toLowerCase() === 'n' &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !typing &&
    !modalIsOpen
) {
    event.preventDefault();
    openCraftForm();
}

});

renderTasks();
