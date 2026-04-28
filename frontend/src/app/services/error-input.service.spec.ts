import { TestBed } from '@angular/core/testing';

import { ErrorInputService } from './error-input.service';

describe('ErrorInputService', () => {
  let service: ErrorInputService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorInputService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
