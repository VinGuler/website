<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { RouterLink } from 'vue-router';

const auth = useAuthStore();

const username = ref('');
const password = ref('');

async function handleSubmit() {
  await auth.login(username.value, password.value);
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[80vh]">
    <div
      class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/30 p-8"
    >
      <h2 class="text-2xl font-bold text-center text-slate-100 mb-6">Sign In</h2>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label for="username" class="block text-sm font-medium text-slate-300 mb-1"
            >Username</label
          >
          <input
            id="username"
            v-model="username"
            type="text"
            required
            autocomplete="username"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
            placeholder="Enter your username"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-slate-300 mb-1"
            >Password</label
          >
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
            placeholder="Enter your password"
          />
        </div>

        <p v-if="auth.error" class="text-sm text-rose-400">{{ auth.error }}</p>

        <button
          type="submit"
          :disabled="auth.loading"
          class="w-full py-2.5 px-4 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ auth.loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-400">
        Don't have an account?
        <RouterLink to="/register" class="text-violet-400 hover:text-violet-300 font-medium"
          >Create one</RouterLink
        >
      </p>
    </div>
  </div>
</template>
