import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoreDetailsWeatherTripComponent } from './more-details-weather-trip.component';

describe('MoreDetailsWeatherTripComponent', () => {
  let component: MoreDetailsWeatherTripComponent;
  let fixture: ComponentFixture<MoreDetailsWeatherTripComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoreDetailsWeatherTripComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoreDetailsWeatherTripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
