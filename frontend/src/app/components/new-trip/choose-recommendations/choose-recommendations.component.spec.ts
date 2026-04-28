import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseRecommendationsComponent } from './choose-recommendations.component';

describe('ChooseRecommendationsComponent', () => {
  let component: ChooseRecommendationsComponent;
  let fixture: ComponentFixture<ChooseRecommendationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseRecommendationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChooseRecommendationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
