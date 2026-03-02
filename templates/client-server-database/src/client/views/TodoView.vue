<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTodoStore } from '@/stores/todos';

const store = useTodoStore();
const newTodoText = ref('');

onMounted(() => {
  store.fetchTodos();
});

async function handleAdd() {
  const text = newTodoText.value.trim();
  if (!text) return;
  await store.addTodo(text);
  newTodoText.value = '';
}
</script>

<template>
  <div class="todo-view">
    <form class="add-form" @submit.prevent="handleAdd">
      <input
        v-model="newTodoText"
        type="text"
        placeholder="What needs to be done?"
        aria-label="New todo text"
      />
      <button type="submit">Add</button>
    </form>

    <p v-if="store.error" class="error">{{ store.error }}</p>
    <p v-if="store.loading" class="loading">Loading...</p>

    <ul v-if="store.todos.length" class="todo-list">
      <li v-for="todo in store.todos" :key="todo.id" :class="{ completed: todo.completed }">
        <label>
          <input type="checkbox" :checked="todo.completed" @change="store.toggleTodo(todo.id)" />
          <span>{{ todo.text }}</span>
        </label>
        <button class="delete-btn" aria-label="Delete" @click="store.deleteTodo(todo.id)">
          &times;
        </button>
      </li>
    </ul>
    <p v-else-if="!store.loading" class="empty">No todos yet. Add one above!</p>
  </div>
</template>

<style scoped>
.todo-view {
  max-width: 480px;
  margin: 0 auto;
}

.add-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.add-form input {
  flex: 1;
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.add-form button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  background: #4a90d9;
  color: white;
}

.add-form button:hover {
  background: #357abd;
}

.error {
  color: #d32f2f;
  text-align: center;
}

.loading,
.empty {
  text-align: center;
  color: #888;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
}

.todo-list li label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.todo-list li.completed span {
  text-decoration: line-through;
  color: #999;
}

.delete-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #999;
  cursor: pointer;
  padding: 0 0.25rem;
}

.delete-btn:hover {
  color: #d32f2f;
}
</style>
