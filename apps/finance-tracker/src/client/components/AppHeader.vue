<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { setLocale, type SupportedLocale } from '@/i18n';
import { RouterLink } from 'vue-router';

const { t, locale } = useI18n();
const auth = useAuthStore();
const mobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
};

function toggleLocale() {
  const next: SupportedLocale = locale.value === 'en' ? 'he' : 'en';
  setLocale(next);
}
</script>

<template>
  <header class="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
    <div class="max-w-4xl mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-6">
          <h1 class="text-lg font-bold text-slate-100">{{ t('nav.appName') }}</h1>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex items-center gap-4">
            <RouterLink
              to="/"
              class="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
              active-class="!text-violet-400"
              >{{ t('nav.myWorkspace') }}</RouterLink
            >
            <RouterLink
              to="/cycles"
              class="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
              active-class="!text-violet-400"
              >{{ t('nav.completedCycles') }}</RouterLink
            >
            <RouterLink
              to="/shared"
              class="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
              active-class="!text-violet-400"
              >{{ t('nav.shared') }}</RouterLink
            >
          </nav>
        </div>

        <div class="flex items-center gap-4">
          <!-- Desktop User Info -->
          <span class="hidden md:inline text-sm text-slate-400">{{ auth.user?.displayName }}</span>
          <button
            class="hidden md:block text-xs font-medium px-2 py-1 rounded border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
            @click="toggleLocale"
          >
            {{ locale === 'en' ? 'HE' : 'EN' }}
          </button>
          <button
            class="hidden md:block text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
            @click="auth.logout()"
          >
            {{ t('nav.logout') }}
          </button>

          <!-- Mobile Hamburger Button -->
          <button
            class="md:hidden p-2 text-slate-400 hover:text-slate-200 transition-colors"
            :aria-label="t('nav.toggleMenu')"
            @click="toggleMobileMenu"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                v-if="!mobileMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Menu -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <nav
          v-if="mobileMenuOpen"
          class="md:hidden mt-3 pt-3 border-t border-slate-800 flex flex-col gap-3"
        >
          <RouterLink
            to="/"
            class="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors py-2 px-3 rounded-lg hover:bg-slate-800/50"
            active-class="!text-violet-400 bg-violet-500/10"
            @click="closeMobileMenu"
            >{{ t('nav.myWorkspace') }}</RouterLink
          >
          <RouterLink
            to="/shared"
            class="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors py-2 px-3 rounded-lg hover:bg-slate-800/50"
            active-class="!text-violet-400 bg-violet-500/10"
            @click="closeMobileMenu"
            >{{ t('nav.shared') }}</RouterLink
          >
          <RouterLink
            to="/cycles"
            class="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors py-2 px-3 rounded-lg hover:bg-slate-800/50"
            active-class="!text-violet-400 bg-violet-500/10"
            @click="closeMobileMenu"
            >{{ t('nav.completedCycles') }}</RouterLink
          >

          <div class="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
            <span class="text-sm text-slate-400">{{ auth.user?.displayName }}</span>
            <div class="flex items-center gap-2">
              <button
                class="text-xs font-medium px-2 py-1 rounded border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
                @click="toggleLocale"
              >
                {{ locale === 'en' ? 'HE' : 'EN' }}
              </button>
              <button
                class="text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors py-2 px-3 rounded-lg hover:bg-slate-800/50"
                @click="auth.logout()"
              >
                {{ t('nav.logout') }}
              </button>
            </div>
          </div>
        </nav>
      </Transition>
    </div>
  </header>
</template>
