import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('currentUser$ should emit null initially when no token in localStorage', () => {
    let user: any = 'not-called';
    service.currentUser$.subscribe(u => user = u);
    expect(user).toBeNull();
  });

  it('login() should set token and emit user', fakeAsync(() => {
    const mockResponse = {
      _id: '123', name: 'Test', email: 'test@test.com', role: 'user', token: 'abc123'
    };

    let emittedUser: any;
    service.currentUser$.subscribe(u => emittedUser = u);

    service.login({ email: 'test@test.com', password: 'pass' }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/auth/login'));
    req.flush(mockResponse);
    tick();

    expect(localStorage.getItem('token')).toBe('abc123');
    expect(emittedUser?.email).toBe('test@test.com');
  }));

  it('logout() should clear session and navigate to /login', fakeAsync(() => {
    localStorage.setItem('token', 'sometoken');
    localStorage.setItem('user', JSON.stringify({ _id: '1', name: 'A', email: 'a@a.com', role: 'user' }));
    spyOn(router, 'navigate');

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('validateSession() should clear session and redirect on 401 — THIS WAS THE BUG', fakeAsync(() => {
    // Simulate stale token in localStorage (e.g. from old port 3000 session)
    localStorage.setItem('token', 'stale-token');
    localStorage.setItem('user', JSON.stringify({ _id: '1', name: 'A', email: 'a@a.com', role: 'user' }));
    spyOn(router, 'navigate');

    // Re-create the service so the constructor runs with the stale token
    service = new (AuthService as any)();

    tick(0); // flush the setTimeout

    // The /me call fires
    const req = httpMock.expectOne(r => r.url.includes('/auth/me'));
    req.flush({ message: 'Not authorized' }, { status: 401, statusText: 'Unauthorized' });
    tick();

    // Session MUST be cleared
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('getToken() should return token from localStorage', () => {
    localStorage.setItem('token', 'mytoken');
    expect(service.getToken()).toBe('mytoken');
  });
});
