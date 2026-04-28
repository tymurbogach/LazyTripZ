import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsWeatherLocationDayComponent } from './details-weather-location-day.component';

describe('DetailsWeatherLocationDayComponent', () => {
  let component: DetailsWeatherLocationDayComponent;
  let fixture: ComponentFixture<DetailsWeatherLocationDayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailsWeatherLocationDayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsWeatherLocationDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
