<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { RouterLink } from 'vue-router';

const auth = useAuthStore();

const username = ref('');
const displayName = ref('');
const password = ref('');

async function handleSubmit() {
  await auth.register(username.value, displayName.value, password.value);
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[80vh]">
    <div
      class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/30 p-8"
    >
      <h2 class="text-2xl font-bold text-center text-slate-100 mb-6">Create Account</h2>

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
            minlength="3"
            maxlength="30"
            autocomplete="username"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
            placeholder="Choose a username"
          />
          <p class="mt-1 text-xs text-slate-500">3-30 characters</p>
        </div>

        <div>
          <label for="displayName" class="block text-sm font-medium text-slate-300 mb-1"
            >Display Name</label
          >
          <input
            id="displayName"
            v-model="displayName"
            type="text"
            required
            autocomplete="name"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
            placeholder="Your display name"
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
            minlength="6"
            autocomplete="new-password"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
            placeholder="Create a password"
          />
          <p class="mt-1 text-xs text-slate-500">6 or more characters</p>
        </div>

        <p v-if="auth.error" class="text-sm text-rose-400">{{ auth.error }}</p>

        <button
          type="submit"
          :disabled="auth.loading"
          class="w-full py-2.5 px-4 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ auth.loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-400">
        Already have an account?
        <RouterLink to="/login" class="text-violet-400 hover:text-violet-300 font-medium"
          >Sign in</RouterLink
        >
      </p>
    </div>
  </div>
</template>
