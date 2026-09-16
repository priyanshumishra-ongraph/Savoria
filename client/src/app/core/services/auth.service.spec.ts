import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockRouter: any;

  beforeEach(() => {
    mockRouter = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: mockRouter },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Clear localStorage before tests
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login user and save token', () => {
    const mockResponse = {
      token: 'test-token',
      _id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      isActive: true
    };

    service.login({ email: 'test@example.com', password: 'password' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(localStorage.getItem('token')).toBe('test-token');
    service.currentUser$.subscribe(user => {
      expect(user?.name).toBe('Test User');
    });
  });

  it('should logout user, clear token, and navigate to login', () => {
    localStorage.setItem('token', 'old-token');
    // Force a mock user into the behavior subject
    (service as any).currentUserSubject.next({ name: 'User' });
    
    service.logout();
    
    expect(localStorage.getItem('token')).toBeNull();
    service.currentUser$.subscribe(user => {
      expect(user).toBeNull();
    });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should register user and save token', () => {
    const mockResponse = {
      token: 'register-token',
      _id: '2',
      name: 'New User',
      email: 'new@example.com',
      role: 'user',
      isActive: true
    };

    service.register({ name: 'New', email: 'new@example.com', password: 'password' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    
  });
});
