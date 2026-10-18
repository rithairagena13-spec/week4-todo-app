
const $ = selector => document.querySelector(selector);

const taskList = $('#taskList');
const emptyState = $('#emptyState');
const emptyText = $('#emptyText');
const searchInput = $('#searchInput');
const progressBar = $('#progressBar');
const progressLabel = $('#progressLabel');
const progressPercent = $('#progressPercent');
const totalCountEl = $('#totalCount');
const completedCountEl = $('#completedCount');
const pendingCountEl = $('#pendingCount');
const clearCompletedBtn = $('#clearCompletedBtn');
const modal = $('#modal');
const taskForm = $('#taskForm');
const taskTitle = $('#taskTitle');
const taskDescription = $('#taskDescription');
const titleError = $('#titleError');
const titleCount = $('#titleCount');
const descriptionCount = $('#descriptionCount');
const saveTaskBtn = $('#saveTaskBtn');

const filterButtons = [...document.querySelectorAll('[data-filter]')];

const PRIORITY_STYLES = {
    High: {
        label: 'Assembly',
        badge: 'bg-rose-50 text-rose-700 border-rose-100/70',
        dot: 'bg-rose-500'
    },
    Medium: {
        label: 'Detailing',
        badge: 'bg-amber-50 text-amber-700 border-amber-100/70',
        dot: 'bg-amber-500'
    },
    Low: {
        label: 'Sourcing',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-100/70',
        dot: 'bg-emerald-500'
    }
};

const PRIORITY_SORT_ORDER = {
    High: 3,
    Medium: 2,
    Low: 1
};

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem('craftflow_tasks');

        if (savedTasks !== null) {
            const parsedTasks = JSON.parse(savedTasks);

            if (Array.isArray(parsedTasks)) {
                return parsedTasks
                    .filter(task => task && typeof task === 'object' && task.title)
                    .map(task => ({
                        ...task,
                        id: task.id ?? `${Date.now()}-${Math.random()}`,
                        title: String(task.title),
                        description: String(task.description ?? ''),
                        priority: PRIORITY_STYLES[task.priority] ? task.priority : 'Medium',
                        completed: Boolean(task.completed)
                    }));
            }
        }
    } catch (error) {
        console.error('Unable to load saved tasks:', error);
    }

    return [];
}

let tasks = loadTasks();
let currentFilter = 'all';
let searchQuery = '';
let editingTaskId = null;

function saveTasks() {
    try {
        localStorage.setItem('craftflow_tasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Unable to save tasks:', error);
        showMessage('Unable to save changes in this browser.', true);
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

function showMessage(message, isError = false) {
    let toast = $('#craftflowToast');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'craftflowToast';
        toast.setAttribute('role', 'status');
        toast.className = 'fixed bottom-5 right-5 z-[100] rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `fixed bottom-5 right-5 z-[100] rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg ${
        isError ? 'bg-rose-600' : 'bg-emerald-700'
    }`;

    clearTimeout(toast.hideTimeout);

    toast.hideTimeout = setTimeout(() => {
        toast.remove();
    }, 3000);
}

function getFilteredAndSortedTasks() {
    let matchedTasks = [...tasks];

    if (currentFilter === 'active') {
        matchedTasks = matchedTasks.filter(task => !task.completed);
    }

    if (currentFilter === 'completed') {
        matchedTasks = matchedTasks.filter(task => task.completed);
    }

    const cleanQuery = searchQuery.trim().toLowerCase();

    if (cleanQuery) {
        matchedTasks = matchedTasks.filter(task =>
            task.title.toLowerCase().includes(cleanQuery) ||
            task.description.toLowerCase().includes(cleanQuery)
        );
    }

    return matchedTasks.sort(
        (a, b) =>
            (PRIORITY_SORT_ORDER[b.priority] || 0) -
            (PRIORITY_SORT_ORDER[a.priority] || 0)
    );
}

function buildCraftCardNode(task) {
    const card = document.createElement('article');
    const style = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium;

    card.className = `rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
        task.completed
            ? 'border-emerald-200 bg-emerald-50/50'
            : 'border-slate-200 bg-white'
    }`;

    card.innerHTML = `
        <div class="flex items-start gap-3">
            <button
                type="button"
                data-action="toggle"
                data-id="${escapeHTML(task.id)}"
                class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    task.completed
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 text-transparent hover:border-emerald-600'
                }"
                aria-label="${task.completed ? 'Mark as active' : 'Mark as completed'}"
            >
                ${task.completed ? '✓' : ''}
            </button>

            <div class="min-w-0 flex-1">
                <div class="mb-2 flex flex-wrap items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full ${style.dot}"></span>

                    <h3 class="break-words text-base font-bold ${
                        task.completed
                            ? 'text-slate-500 line-through'
                            : 'text-slate-900'
                    }">
                        ${escapeHTML(task.title)}
                    </h3>
                </div>

                <span class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${style.badge}">
                    ${style.label}
                </span>

                ${
                    task.description
                        ? `<p class="mt-3 break-words text-sm leading-6 text-slate-600">${escapeHTML(task.description)}</p>`
                        : ''
                }

                <p class="mt-3 text-xs font-medium ${
                    task.completed ? 'text-emerald-700' : 'text-slate-400'
                }">
                    ${task.completed ? 'Completed' : 'In progress'}
                </p>
            </div>

            <div class="flex shrink-0 items-center gap-1">
                 <button
        type="button"
        data-action="edit"
        data-id="${escapeHTML(task.id)}"
        class="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition"
        aria-label="Edit task"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-5 w-5"
            aria-hidden="true"
        >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
    </button>

              <button
    type="button"
    data-action="delete"
    data-id="${escapeHTML(task.id)}"
    class="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
    aria-label="Delete task"
>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-5 w-5"
        aria-hidden="true"
    >
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 14H6L5 6" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
    </svg>
</button>
            </div>
        </div>
    `;

    return card;
}

function render() {
    if (!taskList) return;

    taskList.innerHTML = '';

    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const percentage = total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    if (totalCountEl) totalCountEl.textContent = String(total);
    if (completedCountEl) completedCountEl.textContent = String(completed);
    if (pendingCountEl) pendingCountEl.textContent = String(pending);
    if (progressPercent) progressPercent.textContent = `${percentage}%`;

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', String(percentage));
    }

    if (progressLabel) {
        progressLabel.textContent = total > 0
            ? `${pending} creative milestone${pending === 1 ? '' : 's'} remaining`
            : 'Studio log empty';
    }

    filterButtons.forEach(button => {
        const selected = button.dataset.filter === currentFilter;

        button.className = selected
            ? 'rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs border border-slate-200/50 cursor-pointer'
            : 'rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition cursor-pointer';

        button.setAttribute('aria-pressed', String(selected));
    });

    const visibleTasks = getFilteredAndSortedTasks();

    if (clearCompletedBtn) {
        clearCompletedBtn.disabled = completed === 0;
        clearCompletedBtn.classList.toggle('opacity-50', completed === 0);
        clearCompletedBtn.classList.toggle('cursor-not-allowed', completed === 0);
    }

    if (visibleTasks.length === 0) {
        if (emptyState) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
        }

        if (emptyText) {
            emptyText.textContent = searchQuery.trim()
                ? 'No tasks match your search.'
                : `No tasks match the "${currentFilter}" filter.`;
        }

        return;
    }

    if (emptyState) {
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');
    }

    visibleTasks.forEach(task => {
        taskList.appendChild(buildCraftCardNode(task));
    });
}

function openModal(task = null) {
    if (!modal || !taskForm) {
        showMessage('The task form was not found in index.html.', true);
        return;
    }

    editingTaskId = task ? task.id : null;

    taskForm.reset();

    if (task) {
        taskTitle.value = task.title;
        taskDescription.value = task.description;

        const selectedPriority = taskForm.querySelector(
            `input[name="priority"][value="${task.priority}"]`
        );

        if (selectedPriority) {
            selectedPriority.checked = true;
        }
    } else {
        const defaultPriority = taskForm.querySelector(
            'input[name="priority"][value="Medium"]'
        );

        if (defaultPriority) {
            defaultPriority.checked = true;
        }
    }

    const modalTitle = $('#modalTitle');

    if (modalTitle) {
        modalTitle.textContent = task ? 'Edit Blueprint Step' : 'Add Blueprint Step';
    }

    if (saveTaskBtn) {
        saveTaskBtn.textContent = task ? 'Save Changes' : 'Commit Step';
    }

    if (titleError) titleError.classList.add('hidden');

    updateCharacterCounts();

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    taskTitle.focus();
}

function closeModal() {
    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');
    editingTaskId = null;
}

function updateCharacterCounts() {
    if (titleCount && taskTitle) {
        titleCount.textContent = `${taskTitle.value.length}/100`;
    }

    if (descriptionCount && taskDescription) {
        descriptionCount.textContent = `${taskDescription.value.length}/250`;
    }
}

function handleTaskSubmit(event) {
    event.preventDefault();

    const title = taskTitle.value.trim();
    const description = taskDescription.value.trim();
    const selectedPriority = taskForm.querySelector(
        'input[name="priority"]:checked'
    );

    if (!title) {
        if (titleError) titleError.classList.remove('hidden');
        taskTitle.focus();
        return;
    }

    if (!selectedPriority) {
        showMessage('Please select a production stage.', true);
        return;
    }

    const priority = selectedPriority.value;

    if (editingTaskId !== null) {
        tasks = tasks.map(task =>
            String(task.id) === String(editingTaskId)
                ? { ...task, title, description, priority }
                : task
        );

        showMessage('Craft step updated.');
    } else {
        tasks.push({
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            title,
            description,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        });

        showMessage('Craft step added.');
    }

    saveTasks();
    render();
    closeModal();
}

if (taskForm) {
    taskForm.addEventListener('submit', handleTaskSubmit);
}

if (taskTitle) {
    taskTitle.addEventListener('input', () => {
        updateCharacterCounts();

        if (titleError && taskTitle.value.trim()) {
            titleError.classList.add('hidden');
        }
    });
}

if (taskDescription) {
    taskDescription.addEventListener('input', updateCharacterCounts);
}

$('#closeModalBtn')?.addEventListener('click', closeModal);
$('#cancelTaskBtn')?.addEventListener('click', closeModal);
$('#headerAddBtn')?.addEventListener('click', () => openModal());
$('#openAddBtn')?.addEventListener('click', () => openModal());

if (modal) {
    modal.addEventListener('click', event => {
        if (event.target === modal) closeModal();
    });
}

if (taskList) {
    taskList.addEventListener('click', event => {
        const button = event.target.closest('button[data-action]');

        if (!button) return;

        const task = tasks.find(
            item => String(item.id) === button.dataset.id
        );

        if (!task) return;

        if (button.dataset.action === 'toggle') {
            task.completed = !task.completed;
            saveTasks();
            render();
            showMessage(task.completed ? 'Craft step completed.' : 'Craft step reopened.');
        }

        if (button.dataset.action === 'edit') {
            openModal(task);
        }

        if (button.dataset.action === 'delete') {
            if (!window.confirm(`Delete "${task.title}"?`)) return;

            tasks = tasks.filter(
                item => String(item.id) !== String(task.id)
            );

            saveTasks();
            render();
            showMessage('Craft step deleted.');
        }
    });
}

if (searchInput) {
    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value;
        render();
    });
}

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentFilter = button.dataset.filter;
        render();
    });
});

if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', () => {
        const completed = tasks.filter(task => task.completed).length;

        if (completed === 0) return;

        if (!window.confirm('Clear all completed craft steps?')) return;

        tasks = tasks.filter(task => !task.completed);

        saveTasks();
        render();
        showMessage('Completed craft steps cleared.');
    });
}

$('#helpBtn')?.addEventListener('click', () => {
    window.alert(
        'CraftFlow Help\n\n' +
        '• Add a craft step using the New Craft Step button.\n' +
        '• Choose a production stage.\n' +
        '• Use the circle to complete a task.\n' +
        '• Use the edit button to update a task.\n' +
        '• Use the delete button to remove a task.\n' +
        '• Search and filter your craft steps.\n' +
        '• Tasks are saved in this browser.'
    );
});

document.addEventListener('keydown', event => {
    const modalIsOpen = modal && !modal.classList.contains('hidden');
    const activeTag = document.activeElement?.tagName;
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag);

    if (event.key === 'Escape' && modalIsOpen) {
        closeModal();
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
        openModal();
    }
});

render();
