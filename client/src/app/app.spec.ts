import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app';
import { provideRouter, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let routerEventsSubject: Subject<any>;
  let routerMock: any;

  beforeEach(async () => {
    routerEventsSubject = new Subject<any>();
    
    routerMock = {
      events: routerEventsSubject.asObservable(),
      url: '/home'
    };

    // Mock window.scrollTo
    window.scrollTo = vi.fn();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        provideHttpClient(), { provide: ActivatedRoute, useValue: {} }
      ]
    })
    // Override component to ignore unknown elements (app-navbar, app-footer)
    .overrideComponent(AppComponent, {
      set: {
        schemas: [NO_ERRORS_SCHEMA]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Triggers ngOnInit
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should scroll to top when navigating to a new path', () => {
    // Simulate navigation end to a new path
    const navEvent = new NavigationEnd(1, '/recipes', '/recipes');
    routerEventsSubject.next(navEvent);

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 });
    expect((component as any).previousPath).toBe('/recipes');
  });

  it('should not scroll to top if only query parameters change', () => {
    // Initial navigation
    routerEventsSubject.next(new NavigationEnd(1, '/recipes', '/recipes'));
    
    // Clear the mock to track the next call
    (window.scrollTo as any).mockClear();

    // Navigate to same path with query param
    routerEventsSubject.next(new NavigationEnd(2, '/recipes?category=Dinner', '/recipes?category=Dinner'));
    
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect((component as any).previousPath).toBe('/recipes');
  });
});
