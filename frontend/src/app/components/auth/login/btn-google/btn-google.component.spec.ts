import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BtnGoogleComponent } from './btn-google.component';

describe('BtnGoogleComponent', () => {
  let component: BtnGoogleComponent;
  let fixture: ComponentFixture<BtnGoogleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BtnGoogleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BtnGoogleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
