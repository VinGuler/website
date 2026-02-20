<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { RouterLink } from 'vue-router';

const { t } = useI18n();
const auth = useAuthStore();

const username = ref('');
const sent = ref(false);

async function handleSubmit() {
  const result = await auth.forgotPassword(username.value);
  if (result) {
    sent.value = true;
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[80vh]">
    <div
      class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/30 p-8"
    >
      <h2 class="text-2xl font-bold text-center text-slate-100 mb-6">
        {{ t('auth.forgotPasswordTitle') }}
      </h2>

      <div v-if="sent" class="space-y-4">
        <div class="p-4 bg-emerald-900/30 border border-emerald-700/50 rounded-lg">
          <p class="text-emerald-400 text-sm text-center">
            {{ t('auth.resetLinkSent') }}
          </p>
        </div>
        <RouterLink
          to="/login"
          class="block w-full py-2.5 px-4 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors text-center"
        >
          {{ t('auth.backToSignIn') }}
        </RouterLink>
      </div>

      <div v-else>
        <p class="text-sm text-slate-400 mb-6">{{ t('auth.forgotPasswordDesc') }}</p>

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
              :placeholder="t('auth.usernamePlaceholder')"
            />
          </div>

          <p v-if="auth.error" class="text-sm text-rose-400">{{ auth.error }}</p>

          <button
            type="submit"
            :disabled="auth.loading"
            class="w-full py-2.5 px-4 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ auth.loading ? t('auth.sendingResetLink') : t('auth.sendResetLink') }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-slate-400">
          {{ t('auth.rememberPassword') }}
          <RouterLink to="/login" class="text-violet-400 hover:text-violet-300 font-medium">{{
            t('auth.signInLink')
          }}</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
