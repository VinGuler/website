import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@workspace/login/views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@workspace/login/views/RegisterView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@workspace/login/views/ForgotPasswordView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@workspace/login/views/ResetPasswordView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      name: 'board',
      component: () => import('@/views/BoardView.vue'),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.isChecked) await auth.checkSession();

  const requiresAuth = to.meta.requiresAuth !== false;
  if (requiresAuth && !auth.isAuthenticated) return { name: 'login' };
  if (!requiresAuth && auth.isAuthenticated) return { name: 'board' };
});

export default router;
