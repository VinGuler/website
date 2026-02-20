<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { RouterLink } from 'vue-router';

const { t } = useI18n();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const token = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const localError = ref<string | null>(null);
const success = ref(false);

onMounted(() => {
  const tokenParam = route.query.token;
  if (!tokenParam || typeof tokenParam !== 'string') {
    router.replace('/forgot-password');
    return;
  }
  token.value = tokenParam;
});

async function handleSubmit() {
  localError.value = null;

  if (newPassword.value !== confirmPassword.value) {
    localError.value = t('auth.passwordsDoNotMatch');
    return;
  }

  const result = await auth.resetPasswordWithToken(token.value, newPassword.value);
  if (result) {
    success.value = true;
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[80vh]">
    <div
      class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/30 p-8"
    >
      <h2 class="text-2xl font-bold text-center text-slate-100 mb-6">
        {{ t('auth.resetPasswordWithToken') }}
      </h2>

      <div v-if="success" class="space-y-4">
        <div class="p-4 bg-emerald-900/30 border border-emerald-700/50 rounded-lg">
          <p class="text-emerald-400 text-center">
            {{ t('auth.resetSuccess') }}
          </p>
        </div>
        <RouterLink
          to="/login"
          class="block w-full py-2.5 px-4 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors text-center"
        >
          {{ t('auth.goToSignIn') }}
        </RouterLink>
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label for="newPassword" class="block text-sm font-medium text-slate-300 mb-1">{{
            t('auth.newPassword')
          }}</label>
          <input
            id="newPassword"
            v-model="newPassword"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
            :placeholder="t('auth.newPasswordPlaceholder')"
          />
          <p class="mt-1 text-xs text-slate-500">{{ t('auth.passwordHintNew') }}</p>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-slate-300 mb-1">{{
            t('auth.confirmPassword')
          }}</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
            :placeholder="t('auth.confirmPasswordPlaceholder')"
          />
        </div>

        <p v-if="localError || auth.error" class="text-sm text-rose-400">
          {{ localError || auth.error }}
        </p>

        <button
          type="submit"
          :disabled="auth.loading"
          class="w-full py-2.5 px-4 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ auth.loading ? t('auth.resettingPassword') : t('auth.resetPasswordWithToken') }}
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
</template>
