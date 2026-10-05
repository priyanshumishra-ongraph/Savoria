import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MealPlannerComponent } from './meal-planner.component';

describe('MealPlannerComponent', () => {
  let component: MealPlannerComponent;
  let fixture: ComponentFixture<MealPlannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MealPlannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MealPlannerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
