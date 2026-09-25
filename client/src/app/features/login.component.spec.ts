import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = {
      login: vi.fn().mockReturnValue(of({}))
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        RouterModule,
        LoginComponent
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call login on submit with valid credentials', () => {
    component.email = 'test@example.com';
    component.password = 'password';
    component.onSubmit();
    
    expect(mockAuthService.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should handle login error', () => {
    mockAuthService.login = vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));
    
    component.email = 'test@example.com';
    component.password = 'wrong';
    component.onSubmit();
    
    expect(component.error).toBe('Invalid credentials');
    expect(component.isSubmitting).toBe(false);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
