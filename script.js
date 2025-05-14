const taskInput = document.getElementById("task-input");
const dueDateInput = document.getElementById("due-date");
const recurrenceSelect = document.getElementById("recurrence");
const delegatedSelect = document.getElementById("delegated");
const taskList = document.getElementById("task-list");
const deletedTaskList = document.getElementById("deleted-task-list");
const searchBar = document.getElementById("search-bar");
const undoSection = document.getElementById("undo-section");

let tasks = [];
let deletedTasks = [];

let barChart, pieChart;

function initCharts() {
  const barCtx = document.getElementById('barChart').getContext('2d');
  const pieCtx = document.getElementById('pieChart').getContext('2d');

  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['Active', 'Completed', 'Delegated'],
      datasets: [{
        label: 'Task Count',
        data: [0, 0, 0],
        backgroundColor: ['#f1c40f', '#2ecc71', '#e74c3c'],
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  pieChart = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: ['Active', 'Completed', 'Delegated'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#f1c40f', '#2ecc71', '#e74c3c'],
      }]
    },
    options: {
      responsive: true
    }
  });
}

function addTask(text = null, dueDate = null, recurrence = "", completed = false, delegated = false) {
  const taskText = text || taskInput.value.trim();
  const taskDue = dueDate || dueDateInput.value;
  const taskRecurrence = recurrence || recurrenceSelect.value;
  const isDelegated = delegated || delegatedSelect.value === "true";

  if (!taskText) return;

  const li = document.createElement("li");
  const span = document.createElement("span");
  span.textContent = taskText;

  const small = document.createElement("small");
  if (taskDue) {
    small.textContent = `Due: ${taskDue} ${taskRecurrence ? "| " + taskRecurrence : ""}${isDelegated ? " | Delegated" : ""}`;
  }

  const actions = document.createElement("div");
  actions.className = "actions";

  const completeBtn = document.createElement("button");
  completeBtn.innerHTML = `<i class="fas fa-check-circle"></i>`;
  completeBtn.title = "Mark as complete";
  completeBtn.onclick = () => {
    li.classList.toggle("completed");
    details.style.display = li.classList.contains("completed") ? "none" : "block";
    saveTasks();
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.innerHTML = `<i class="fas fa-trash-alt"></i>`;
  deleteBtn.title = "Delete task";
  deleteBtn.onclick = () => {
    const confirmed = confirm("Are you sure you want to delete this task?");
    if (confirmed) {
      moveToTrash(li);
    }
  };

  actions.append(small, completeBtn, deleteBtn);

  const details = document.createElement("div");
  details.className = "task-details";

  const notesArea = document.createElement("textarea");
  notesArea.placeholder = "Add notes...";

  const subtaskInput = document.createElement("input");
  subtaskInput.placeholder = "Add subtask...";
  const addSubBtn = document.createElement("button");
  addSubBtn.textContent = "+";

  const subtaskList = document.createElement("ul");

  addSubBtn.onclick = () => {
    const text = subtaskInput.value.trim();
    if (!text) return;
    const item = document.createElement("li");
    item.className = "subtask-item";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    const span = document.createElement("span");
    span.textContent = text;
    item.append(cb, span);
    subtaskList.appendChild(item);
    subtaskInput.value = "";
    updateSubtaskProgress(details, subtaskList);
  };

  const subtaskDiv = document.createElement("div");
  subtaskDiv.className = "subtasks";
  subtaskDiv.append(subtaskInput, addSubBtn, subtaskList);

  details.append(notesArea, subtaskDiv);
  li.append(span, actions, details);

  tasks.push({ text: taskText, completed, delegated: isDelegated, dueDate: taskDue, recurrence: taskRecurrence, subtasks: [], notes: "" });
  taskList.appendChild(li);
  taskInput.value = "";
  dueDateInput.value = "";
  recurrenceSelect.value = "";
  delegatedSelect.value = "";

  saveTasks();
  updateCharts();
}

function moveToTrash(task) {
  deletedTasks.push(task);
  taskList.removeChild(task);
  showUndoButton(task);
  saveTasks();
}

function showUndoButton(task) {
  undoSection.innerHTML = `
    <button class="undo-btn" onclick="undoDelete()">Undo Last Delete</button>
  `;
  setTimeout(() => {
    undoSection.innerHTML = "";
  }, 10000);
}

function undoDelete() {
  if (!deletedTasks.length) return;
  const lastDeleted = deletedTasks.pop();
  taskList.appendChild(lastDeleted);
  undoSection.innerHTML = "";
  saveTasks();
  updateCharts();
}

function filterTasks() {
  const searchTerm = searchBar.value.toLowerCase();
  const tasks = document.querySelectorAll("#task-list li");
  tasks.forEach(task => {
    const taskText = task.querySelector("span").textContent.toLowerCase();
    if (taskText.includes(searchTerm)) {
      task.style.display = "block";
    } else {
      task.style.display = "none";
    }
  });
}

function updateSubtaskProgress(details, subtaskList) {
  const subtasks = subtaskList.querySelectorAll(".subtask-item input");
  const completedSubtasks = Array.from(subtasks).filter(cb => cb.checked).length;
  const progress = Math.round((completedSubtasks / subtasks.length) * 100);
  const progressBar = details.querySelector(".progress-bar > div");
  progressBar.style.width = `${progress}%`;
}

function updateCharts() {
  const active = tasks.filter(t => !t.completed).length;
  const completed = tasks.filter(t => t.completed).length;
  const delegated = tasks.filter(t => t.delegated).length;

  barChart.data.datasets[0].data = [active, completed, delegated];
  barChart.update();

  pieChart.data.datasets[0].data = [active, completed, delegated];
  pieChart.update();
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("deletedTasks", JSON.stringify(deletedTasks));
}

function loadTasks() {
  const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks = savedTasks;
  tasks.forEach(task => addTask(task.text, task.dueDate, task.recurrence, task.completed, task.delegated));
}

loadTasks();
initCharts();
