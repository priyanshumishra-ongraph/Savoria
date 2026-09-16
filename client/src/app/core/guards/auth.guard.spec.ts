import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { of, firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('authGuard', () => {
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockAuthService = {
      currentUser$: of(null)
    };
    mockRouter = {
      createUrlTree: vi.fn((commands: string[]) => {
        return commands as any; // return simple mock UrlTree
      })
    };
  });

  const runGuard = (platformId: Object) => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: PLATFORM_ID, useValue: platformId }
      ]
    });
    return TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
  };

  it('should allow access if not in browser (SSR)', () => {
    const result = runGuard('server');
    expect(result).toBe(true);
  });

  it('should allow access if user is logged in', async () => {
    mockAuthService.currentUser$ = of({ name: 'User' });
    const result = runGuard('browser');
    const res = await firstValueFrom(result as any);
    expect(res).toBe(true);
  });

  it('should redirect to /login if user is not logged in', async () => {
    mockAuthService.currentUser$ = of(null);
    const result = runGuard('browser');
    const res = await firstValueFrom(result as any);
    expect(res).toEqual(['/login']);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
