import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { ref, computed } from 'vue';

// Mock auth store
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockForgotPassword = vi.fn().mockResolvedValue(true);
const mockResetPasswordWithToken = vi.fn().mockResolvedValue(true);
const mockError = ref<string | null>(null);
const mockLoading = ref(false);

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    login: mockLogin,
    register: mockRegister,
    forgotPassword: mockForgotPassword,
    resetPasswordWithToken: mockResetPasswordWithToken,
    error: mockError,
    loading: mockLoading,
    user: ref(null),
    isAuthenticated: computed(() => false),
  }),
}));

// Mock vue-i18n to return keys
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

// Mock vue-router
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRouteQuery = ref<Record<string, string>>({});
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useRoute: () => ({ query: mockRouteQuery.value }),
  RouterLink: {
    template: '<a><slot /></a>',
    props: ['to'],
  },
}));

// Import views after mocks
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import ForgotPasswordView from '../views/ForgotPasswordView.vue';
import ResetPasswordView from '../views/ResetPasswordView.vue';

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockError.value = null;
    mockLoading.value = false;
    setActivePinia(createPinia());
  });

  it('renders username and password inputs', () => {
    const wrapper = mount(LoginView);
    expect(wrapper.find('input#username').exists()).toBe(true);
    expect(wrapper.find('input#password').exists()).toBe(true);
  });

  it('calls auth.login on submit', async () => {
    const wrapper = mount(LoginView);
    await wrapper.find('input#username').setValue('alice');
    await wrapper.find('input#password').setValue('password123');
    await wrapper.find('form').trigger('submit');

    expect(mockLogin).toHaveBeenCalledWith('alice', 'password123');
  });

  it('shows error when present', async () => {
    mockError.value = 'Invalid credentials';
    const wrapper = mount(LoginView);

    expect(wrapper.text()).toContain('Invalid credentials');
  });
});

describe('RegisterView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockError.value = null;
    mockLoading.value = false;
    setActivePinia(createPinia());
  });

  it('renders all 4 inputs', () => {
    const wrapper = mount(RegisterView);
    expect(wrapper.find('input#username').exists()).toBe(true);
    expect(wrapper.find('input#displayName').exists()).toBe(true);
    expect(wrapper.find('input#email').exists()).toBe(true);
    expect(wrapper.find('input#password').exists()).toBe(true);
  });

  it('calls auth.register on submit', async () => {
    const wrapper = mount(RegisterView);
    await wrapper.find('input#username').setValue('alice');
    await wrapper.find('input#displayName').setValue('Alice');
    await wrapper.find('input#password').setValue('StrongPass1');
    await wrapper.find('input#email').setValue('alice@example.com');
    await wrapper.find('form').trigger('submit');

    expect(mockRegister).toHaveBeenCalledWith('alice', 'Alice', 'StrongPass1', 'alice@example.com');
  });

  it('shows error when present', async () => {
    mockError.value = 'Username taken';
    const wrapper = mount(RegisterView);

    expect(wrapper.text()).toContain('Username taken');
  });
});

describe('ForgotPasswordView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockError.value = null;
    mockLoading.value = false;
    setActivePinia(createPinia());
  });

  it('renders username input and form', () => {
    const wrapper = mount(ForgotPasswordView);
    expect(wrapper.find('input#username').exists()).toBe(true);
    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('calls auth.forgotPassword on submit', async () => {
    const wrapper = mount(ForgotPasswordView);
    await wrapper.find('input#username').setValue('alice');
    await wrapper.find('form').trigger('submit');

    expect(mockForgotPassword).toHaveBeenCalledWith('alice');
  });

  it('shows success message after submit', async () => {
    const wrapper = mount(ForgotPasswordView);
    await wrapper.find('input#username').setValue('alice');
    await wrapper.find('form').trigger('submit');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('auth.resetLinkSent');
  });
});

describe('ResetPasswordView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockError.value = null;
    mockLoading.value = false;
    mockRouteQuery.value = { token: 'valid-token' };
    setActivePinia(createPinia());
  });

  it('redirects to /forgot-password when no token in query', async () => {
    mockRouteQuery.value = {};
    mount(ResetPasswordView);
    // onMounted runs synchronously in test, should redirect
    expect(mockReplace).toHaveBeenCalledWith('/forgot-password');
  });

  it('renders password inputs when token is present', () => {
    const wrapper = mount(ResetPasswordView);
    expect(wrapper.find('input#newPassword').exists()).toBe(true);
    expect(wrapper.find('input#confirmPassword').exists()).toBe(true);
  });

  it('shows error when passwords do not match', async () => {
    const wrapper = mount(ResetPasswordView);
    await wrapper.find('input#newPassword').setValue('StrongPass1');
    await wrapper.find('input#confirmPassword').setValue('DifferentPass1');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain('auth.passwordsDoNotMatch');
    expect(mockResetPasswordWithToken).not.toHaveBeenCalled();
  });

  it('calls auth.resetPasswordWithToken on matching passwords', async () => {
    const wrapper = mount(ResetPasswordView);
    await wrapper.find('input#newPassword').setValue('StrongPass1');
    await wrapper.find('input#confirmPassword').setValue('StrongPass1');
    await wrapper.find('form').trigger('submit');

    expect(mockResetPasswordWithToken).toHaveBeenCalledWith('valid-token', 'StrongPass1');
  });

  it('shows success message after successful reset', async () => {
    const wrapper = mount(ResetPasswordView);
    await wrapper.find('input#newPassword').setValue('StrongPass1');
    await wrapper.find('input#confirmPassword').setValue('StrongPass1');
    await wrapper.find('form').trigger('submit');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('auth.resetSuccess');
  });
});
