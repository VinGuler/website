<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { RouterLink } from 'vue-router';

const { t } = useI18n();
const auth = useAuthStore();

const username = ref('');
const displayName = ref('');
const password = ref('');
const email = ref('');

async function handleSubmit() {
  await auth.register(username.value, displayName.value, password.value, email.value);
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[80vh]">
    <div
      class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/30 p-8"
    >
      <h2 class="text-2xl font-bold text-center text-slate-100 mb-6">
        {{ t('auth.createAccount') }}
      </h2>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label for="username" class="block text-sm font-medium text-slate-300 mb-1">{{
            t('auth.username')
          }}</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            minlength="3"
            maxlength="30"
            autocomplete="username"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
            :placeholder="t('auth.chooseUsername')"
          />
          <p class="mt-1 text-xs text-slate-500">{{ t('auth.usernameHint') }}</p>
        </div>

        <div>
          <label for="displayName" class="block text-sm font-medium text-slate-300 mb-1">{{
            t('auth.displayName')
          }}</label>
          <input
            id="displayName"
            v-model="displayName"
            type="text"
            required
            autocomplete="name"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
            :placeholder="t('auth.displayNamePlaceholder')"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-slate-300 mb-1">{{
            t('auth.email')
          }}</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
            :placeholder="t('auth.emailPlaceholder')"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-slate-300 mb-1">{{
            t('auth.password')
          }}</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
            :placeholder="t('auth.createPassword')"
          />
          <p class="mt-1 text-xs text-slate-500">{{ t('auth.passwordHintNew') }}</p>
        </div>

        <p v-if="auth.error" class="text-sm text-rose-400">{{ auth.error }}</p>

        <button
          type="submit"
          :disabled="auth.loading"
          class="w-full py-2.5 px-4 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ auth.loading ? t('auth.creatingAccount') : t('auth.createAccount') }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-400">
        {{ t('auth.hasAccount') }}
        <RouterLink to="/login" class="text-violet-400 hover:text-violet-300 font-medium">{{
          t('auth.signInLink')
        }}</RouterLink>
      </p>
    </div>
  </div>
</template>
