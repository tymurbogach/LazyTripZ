import { TestBed } from '@angular/core/testing';

import { TripUserService } from './trip-user.service';

describe('TripUserService', () => {
  let service: TripUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TripUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
