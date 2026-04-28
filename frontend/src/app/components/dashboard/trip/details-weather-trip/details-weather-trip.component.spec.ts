import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsWeatherTripComponent } from './details-weather-trip.component';

describe('DetailsWeatherTripComponent', () => {
  let component: DetailsWeatherTripComponent;
  let fixture: ComponentFixture<DetailsWeatherTripComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailsWeatherTripComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsWeatherTripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
