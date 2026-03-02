import { describe, it, expect } from 'vitest';
import { createRateLimiters } from '../middleware/rateLimit.js';

describe('createRateLimiters', () => {
  it('returns object with all 5 limiters', () => {
    const limiters = createRateLimiters();
    expect(limiters).toHaveProperty('loginLimiter');
    expect(limiters).toHaveProperty('registerLimiter');
    expect(limiters).toHaveProperty('forgotPasswordLimiter');
    expect(limiters).toHaveProperty('resetPasswordLimiter');
    expect(limiters).toHaveProperty('userSearchLimiter');
  });

  it('in test env, limiters are passthrough middleware', () => {
    // NODE_ENV is 'test' during vitest, so limiters should be noop
    const limiters = createRateLimiters();
    const next = () => {};
    // Each limiter should be a simple function that calls next
    expect(typeof limiters.loginLimiter).toBe('function');
    expect(typeof limiters.registerLimiter).toBe('function');

    // Verify they call next (noop middleware)
    let called = false;
    const mockNext = () => {
      called = true;
    };
    limiters.loginLimiter({} as never, {} as never, mockNext);
    expect(called).toBe(true);
  });
});
