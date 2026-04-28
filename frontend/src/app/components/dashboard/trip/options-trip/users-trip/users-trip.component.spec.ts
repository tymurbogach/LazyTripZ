import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersTripComponent } from './users-trip.component';

describe('UsersTripComponent', () => {
  let component: UsersTripComponent;
  let fixture: ComponentFixture<UsersTripComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersTripComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsersTripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
