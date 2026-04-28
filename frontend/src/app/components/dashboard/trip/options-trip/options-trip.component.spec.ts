import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionsTripComponent } from './options-trip.component';

describe('OptionsTripComponent', () => {
  let component: OptionsTripComponent;
  let fixture: ComponentFixture<OptionsTripComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptionsTripComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptionsTripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
