// API Base URL
const API_BASE = '';

// Types
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// State
let todos: Todo[] = [];

// DOM Elements - only access if elements exist
const todoList = document.getElementById('todo-list') as HTMLDivElement | null;
const todoForm = document.getElementById('todo-form') as HTMLFormElement | null;
const todoInput = document.getElementById('todo-input') as HTMLInputElement | null;
const loadingEl = document.getElementById('loading') as HTMLDivElement | null;

// Load todos
async function loadTodos() {
  if (!loadingEl || !todoList) return;

  try {
    loadingEl.classList.remove('hidden');
    const response = await fetch(`${API_BASE}/api/todos`);
    const result = await response.json();

    if (result.success) {
      todos = result.data;
      renderTodos();
    } else {
      alert(`Failed to load todos: ${result.error}`);
    }
  } catch (error) {
    alert(`Error loading todos: ${error}`);
  } finally {
    loadingEl.classList.add('hidden');
  }
}

// Render todos
function renderTodos() {
  if (!todoList) return;

  if (todos.length === 0) {
    todoList.innerHTML = '<p class="placeholder">No todos yet. Add one above!</p>';
    return;
  }

  todoList.innerHTML = todos
    .map(
      (todo) => `
    <div class="todo-item ${todo.completed ? 'completed' : ''}">
      <input
        type="checkbox"
        ${todo.completed ? 'checked' : ''}
        onchange="toggleTodo(${todo.id})"
      >
      <span class="todo-text">${todo.text}</span>
      <button class="delete-btn" onclick="deleteTodo(${todo.id})">Delete</button>
    </div>
  `
    )
    .join('');
}

// Add todo
if (todoForm && todoInput) {
  todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const text = todoInput.value.trim();
    if (!text) return;

    try {
      const response = await fetch(`${API_BASE}/api/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const result = await response.json();

      if (result.success) {
        todos.push(result.data);
        renderTodos();
        todoInput.value = '';
      } else {
        alert(`Failed to add todo: ${result.error}`);
      }
    } catch (error) {
      alert(`Error adding todo: ${error}`);
    }
  });
}

// Toggle todo completion
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).toggleTodo = async (id: number) => {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;

  try {
    const response = await fetch(`${API_BASE}/api/todos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ completed: !todo.completed }),
    });

    const result = await response.json();

    if (result.success) {
      todo.completed = result.data.completed;
      renderTodos();
    } else {
      alert(`Failed to update todo: ${result.error}`);
    }
  } catch (error) {
    alert(`Error updating todo: ${error}`);
  }
};

// Delete todo
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).deleteTodo = async (id: number) => {
  try {
    const response = await fetch(`${API_BASE}/api/todos/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      todos = todos.filter((t) => t.id !== id);
      renderTodos();
    } else {
      alert(`Failed to delete todo: ${result.error}`);
    }
  } catch (error) {
    alert(`Error deleting todo: ${error}`);
  }
};

// Initialize only if DOM elements are present (not in test mode)
if (todoList && todoForm && todoInput && loadingEl) {
  loadTodos();
}
