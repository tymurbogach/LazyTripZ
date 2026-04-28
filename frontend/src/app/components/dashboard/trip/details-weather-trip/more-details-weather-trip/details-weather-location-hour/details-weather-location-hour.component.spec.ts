import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsWeatherLocationHourComponent } from './details-weather-location-hour.component';

describe('DetailsWeatherLocationHourComponent', () => {
  let component: DetailsWeatherLocationHourComponent;
  let fixture: ComponentFixture<DetailsWeatherLocationHourComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailsWeatherLocationHourComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsWeatherLocationHourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
