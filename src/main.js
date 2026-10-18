
const $ = (selector) => document.querySelector(selector);

const taskList = $('#taskList');
const emptyState = $('#emptyState');
const emptyTitle = $('#emptyTitle');
const emptyText = $('#emptyText');
const searchInput = $('#searchInput');
const statusFilter = $('#statusFilter');
const clearCompletedBtn = $('#clearCompletedBtn');
const progressBar = $('#progressBar');
const progressLabel = $('#progressLabel');
const progressPercent = $('#progressPercent');
const totalCountEl = $('#totalCount');
const completedCountEl = $('#completedCount');
const pendingCountEl = $('#pendingCount');

const ICONS = {
  logo: ['M12 22c5.523 0 9-5 9-10S17.523 2 12 2 3 7 3 12s3.477 10 9 10z', 'M12 6v12', 'M6 12h12'],
  plus: ['M12 5v14', 'M5 12h14'],
  check: ['M20 6 9 17l-5-5'],
  edit: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6'],
  help: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3', 'M12 17h.01']
};

function icon(name, size = 16) {
  const svg = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'svg'
  );

  const attributes = {
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true'
  };

  Object.entries(attributes).forEach(([key, value]) => {
    svg.setAttribute(key, value);
  });

  (ICONS[name] || []).forEach((pathData) => {
    const path = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    );

    path.setAttribute('d', pathData);
    svg.appendChild(path);
  });

  return svg;
}

function addIcon(containerId, name, size) {
  const container = document.getElementById(containerId);

  if (container) {
    container.replaceChildren(icon(name, size));
  }
}

addIcon('headerLogoContainer', 'logo', 18);
addIcon('helpIconContainer', 'help', 15);
addIcon('addBtnIconContainer', 'plus', 14);

let tasks = [];

try {
  const savedTasks = JSON.parse(
    localStorage.getItem('craftflow_tasks')
  );

  tasks = Array.isArray(savedTasks) ? savedTasks : [];
} catch {
  tasks = [];
}

if (tasks.length === 0 && !localStorage.getItem('craftflow_tasks')) {
  tasks = [
    {
      id: 1,
      title: 'Sand primary oak structural pillars',
      description: 'Smooth the wood grain along the joints.',
      priority: 'High',
      completed: false
    },
    {
      id: 2,
      title: 'Sketch porcelain mug outlines',
      description: 'Draw the initial ceramic design.',
      priority: 'Low',
      completed: true
    },
    {
      id: 3,
      title: 'Apply translucent gloss glaze',
      description: 'Prepare the ceramic surface for glazing.',
      priority: 'Medium',
      completed: false
    }
  ];

  saveTasks();
}

let currentFilter =
  localStorage.getItem('craftflow_filter') || 'all';

let searchQuery = '';
let editingId = null;

function saveTasks() {
  localStorage.setItem('craftflow_tasks', JSON.stringify(tasks));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

// Create the form because it is not in the supplied HTML.
const modal = document.createElement('div');

modal.id = 'modal';
modal.className =
  'fixed inset-0 z-50 hidden items-center justify-center bg-black/50 p-4';

modal.innerHTML = `
  <section
    class="w-full max-w-lg rounded-2xl bg-white p-6 text-[#344E41] shadow-xl"
    role="dialog"
    aria-modal="true"
    aria-labelledby="formHeading"
  >
    <div class="mb-5 flex items-center justify-between gap-3">
      <h2 id="formHeading" class="text-xl font-bold">
        New Craft Step
      </h2>
      <button
        type="button"
        id="closeModalBtn"
        class="rounded-lg px-3 py-2 text-xl hover:bg-[#EAEBDD]"
        aria-label="Close form"
      >&times;</button>
    </div>

    <form id="taskForm" class="space-y-4">
      <div>
        <label for="taskTitle" class="mb-1 block text-sm font-semibold">
          Craft step title
        </label>
        <input
          id="taskTitle"
          name="title"
          type="text"
          maxlength="100"
          required
          placeholder="Enter your craft step"
          class="w-full rounded-lg border border-[#DCCDBB] p-3 outline-none focus:ring-2 focus:ring-[#A3B18A]"
        />
        <p id="titleError" class="mt-1 hidden text-sm text-red-600">
          Please enter a title.
        </p>
        <p id="titleCount" class="mt-1 text-xs text-gray-500">0/100</p>
      </div>

      <div>
        <label for="taskDescription" class="mb-1 block text-sm font-semibold">
          Description
        </label>
        <textarea
          id="taskDescription"
          name="description"
          rows="3"
          maxlength="300"
          placeholder="Describe the work to do"
          class="w-full rounded-lg border border-[#DCCDBB] p-3 outline-none focus:ring-2 focus:ring-[#A3B18A]"
        ></textarea>
        <p id="descriptionCount" class="mt-1 text-xs text-gray-500">0/300</p>
      </div>

      <div>
        <label for="taskPriority" class="mb-1 block text-sm font-semibold">
          Priority
        </label>
        <select
          id="taskPriority"
          name="priority"
          class="w-full rounded-lg border border-[#DCCDBB] bg-white p-3"
        >
          <option value="Low">Low</option>
          <option value="Medium" selected>Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button
          type="button"
          id="cancelModalBtn"
          class="rounded-lg border border-[#DCCDBB] px-4 py-2 font-semibold hover:bg-[#F1E9DE]"
        >Cancel</button>
        <button
          type="submit"
          class="rounded-lg bg-[#344E41] px-5 py-2 font-semibold text-white hover:bg-[#283D33]"
        >Save Craft Step</button>
      </div>
    </form>
  </section>
`;

document.body.appendChild(modal);

const taskForm = $('#taskForm');
const titleInput = $('#taskTitle');
const descriptionInput = $('#taskDescription');
const priorityInput = $('#taskPriority');
const titleError = $('#titleError');
const titleCount = $('#titleCount');
const descriptionCount = $('#descriptionCount');

function openCraftForm(task = null) {
  editingId = task ? task.id : null;

  taskForm.reset();

  titleError.classList.add('hidden');
  titleCount.textContent = '0/100';
  descriptionCount.textContent = '0/300';

  $('#formHeading').textContent = task
    ? 'Edit Craft Step'
    : 'New Craft Step';

  taskForm.querySelector('[type="submit"]').textContent = task
    ? 'Save Changes'
    : 'Save Craft Step';

  if (task) {
    titleInput.value = task.title;
    descriptionInput.value = task.description || '';
    priorityInput.value = task.priority || 'Medium';
  }

  titleCount.textContent = `${titleInput.value.length}/100`;
  descriptionCount.textContent =
    `${descriptionInput.value.length}/300`;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  titleInput.focus();
}

function closeCraftForm() {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  editingId = null;
}

function showMessage(message) {
  let toast = $('#craftflowToast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'craftflowToast';
    toast.className =
      'fixed bottom-5 right-5 z-[60] rounded-xl bg-[#344E41] px-5 py-3 text-sm font-semibold text-white shadow-lg';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.remove('hidden');

  clearTimeout(showMessage.timer);

  showMessage.timer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2500);
}

function getVisibleTasks() {
  return tasks.filter((task) => {
    const matchesFilter =
      currentFilter === 'all' ||
      (currentFilter === 'active' && !task.completed) ||
      (currentFilter === 'completed' && task.completed);

    const query = searchQuery.toLowerCase();

    const matchesSearch =
      task.title.toLowerCase().includes(query) ||
      (task.description || '').toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();

  taskList.replaceChildren();

  visibleTasks.forEach((task) => {
    const card = document.createElement('article');

    card.className =
      'rounded-2xl border border-[#DCCDBB] bg-white p-5 shadow-sm';

    const priorityClass = {
      High: 'bg-red-100 text-red-700',
      Medium: 'bg-amber-100 text-amber-800',
      Low: 'bg-green-100 text-green-800'
    }[task.priority] || 'bg-gray-100 text-gray-700';

    card.innerHTML = `
      <div class="mb-4 flex items-start justify-between gap-3">
        <span class="rounded-full px-3 py-1 text-xs font-bold ${priorityClass}">
          ${escapeHTML(task.priority || 'Medium')} priority
        </span>

        <span class="text-xs font-semibold ${
          task.completed ? 'text-green-700' : 'text-amber-700'
        }">
          ${task.completed ? 'Completed' : 'In Production'}
        </span>
      </div>

      <h3 class="mb-2 text-lg font-bold ${
        task.completed ? 'line-through opacity-60' : ''
      }">${escapeHTML(task.title)}</h3>

      <p class="mb-5 min-h-10 whitespace-pre-wrap text-sm leading-6 text-gray-600">${
        escapeHTML(task.description || 'No description provided.')
      }</p>

      <div class="flex flex-wrap gap-2 border-t border-[#EAEBDD] pt-4">
        <button
          type="button"
          data-action="toggle"
          data-id="${task.id}"
          class="rounded-lg bg-[#EAEBDD] px-3 py-2 text-sm font-semibold hover:bg-[#DCE5D0]"
        >${task.completed ? 'Mark Pending' : 'Complete'}</button>

        <button
          type="button"
          data-action="edit"
          data-id="${task.id}"
          class="rounded-lg border border-[#DCCDBB] px-3 py-2 text-sm font-semibold hover:bg-[#F1E9DE]"
        >Edit</button>

        <button
          type="button"
          data-action="delete"
          data-id="${task.id}"
          class="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
        >Delete</button>
      </div>
    `;

    taskList.appendChild(card);
  });

  const isEmpty = visibleTasks.length === 0;

  emptyState.classList.toggle('hidden', !isEmpty);
  emptyState.classList.toggle('flex', isEmpty);

  if (isEmpty) {
    emptyTitle.textContent = tasks.length
      ? 'No matching craft steps'
      : 'Workspace blueprint clear';

    emptyText.textContent = tasks.length
      ? 'Try another search or filter.'
      : 'Click New Craft Step to add your first craft step.';
  }

  updateDashboard();
}

function updateDashboard() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  totalCountEl.textContent = total;
  completedCountEl.textContent = completed;
  pendingCountEl.textContent = pending;

  progressPercent.textContent = `${percent}%`;
  progressLabel.textContent = total
    ? `${completed} of ${total} steps completed`
    : 'No project milestones tracked';

  progressBar.style.width = `${percent}%`;

  const progressRegion = progressBar.parentElement;

  if (progressRegion) {
    progressRegion.setAttribute('aria-valuenow', percent);
  }

  clearCompletedBtn.disabled = completed === 0;
}

function updateCounts() {
  titleCount.textContent = `${titleInput.value.length}/100`;
  descriptionCount.textContent =
    `${descriptionInput.value.length}/300`;
}

$('#headerAddBtn').addEventListener('click', () => openCraftForm());
$('#openAddBtn').addEventListener('click', () => openCraftForm());

$('#closeModalBtn').addEventListener('click', closeCraftForm);
$('#cancelModalBtn').addEventListener('click', closeCraftForm);

modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeCraftForm();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeCraftForm();
  }

  if (
    event.key.toLowerCase() === 'n' &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.metaKey &&
    !['INPUT', 'TEXTAREA', 'SELECT'].includes(
      document.activeElement.tagName
    ) &&
    modal.classList.contains('hidden')
  ) {
    event.preventDefault();
    openCraftForm();
  }
});

titleInput.addEventListener('input', () => {
  titleError.classList.add('hidden');
  updateCounts();
});

descriptionInput.addEventListener('input', updateCounts);

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();

  if (!title) {
    titleError.classList.remove('hidden');
    titleInput.focus();
    return;
  }

  const description = descriptionInput.value.trim();
  const priority = priorityInput.value;

  if (editingId !== null) {
    tasks = tasks.map((task) =>
      task.id === editingId
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
      completed: false
    });

    showMessage('New craft step added successfully.');
  }

  saveTasks();
  closeCraftForm();
  renderTasks();
});

taskList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');

  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  const task = tasks.find((item) => item.id === id);

  if (!task) return;

  if (action === 'toggle') {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    showMessage(
      task.completed ? 'Craft step completed.' : 'Craft step marked pending.'
    );
  }

  if (action === 'edit') {
    openCraftForm(task);
  }

  if (action === 'delete') {
    if (confirm(`Delete "${task.title}"?`)) {
      tasks = tasks.filter((item) => item.id !== id);
      saveTasks();
      renderTasks();
      showMessage('Craft step deleted.');
    }
  }
});

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim();
  renderTasks();
});

statusFilter.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-filter]');

  if (!button) return;

  currentFilter = button.dataset.filter;
  localStorage.setItem('craftflow_filter', currentFilter);

  statusFilter.querySelectorAll('button[data-filter]').forEach((item) => {
    item.classList.toggle(
      'bg-white',
      item.dataset.filter === currentFilter
    );

    item.setAttribute(
      'aria-pressed',
      String(item.dataset.filter === currentFilter)
    );
  });

  renderTasks();
});

clearCompletedBtn.addEventListener('click', () => {
  const completedCount = tasks.filter((task) => task.completed).length;

  if (!completedCount) return;

  if (confirm(`Delete all ${completedCount} completed craft steps?`)) {
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    renderTasks();
    showMessage('Completed craft steps cleared.');
  }
});

$('#helpBtn').addEventListener('click', () => {
  alert(
    'CraftFlow helps you organize craft steps. Add a step, choose its priority, mark it completed, search your tasks, or filter by status.'
  );
});

if (!['all', 'active', 'completed'].includes(currentFilter)) {
  currentFilter = 'all';
}

statusFilter.querySelectorAll('button[data-filter]').forEach((button) => {
  button.classList.toggle(
    'bg-white',
    button.dataset.filter === currentFilter
  );

  button.setAttribute(
    'aria-pressed',
    String(button.dataset.filter === currentFilter)
  );
});

renderTasks();
