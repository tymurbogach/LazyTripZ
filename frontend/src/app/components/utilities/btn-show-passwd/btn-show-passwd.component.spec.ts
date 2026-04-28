import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BtnShowPasswdComponent } from './btn-show-passwd.component';

describe('BtnShowPasswdComponent', () => {
  let component: BtnShowPasswdComponent;
  let fixture: ComponentFixture<BtnShowPasswdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BtnShowPasswdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BtnShowPasswdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
