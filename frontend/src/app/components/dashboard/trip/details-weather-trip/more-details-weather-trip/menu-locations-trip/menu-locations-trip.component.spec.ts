import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuLocationsTripComponent } from './menu-locations-trip.component';

describe('MenuLocationsTripComponent', () => {
  let component: MenuLocationsTripComponent;
  let fixture: ComponentFixture<MenuLocationsTripComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuLocationsTripComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuLocationsTripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
