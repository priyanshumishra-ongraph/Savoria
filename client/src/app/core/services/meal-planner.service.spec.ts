import { TestBed } from '@angular/core/testing';

import { MealPlanner } from './meal-planner';

describe('MealPlanner', () => {
  let service: MealPlanner;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MealPlanner);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
