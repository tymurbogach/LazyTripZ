import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchGooglePlacesComponent } from './search-google-places.component';

describe('SearchGooglePlacesComponent', () => {
  let component: SearchGooglePlacesComponent;
  let fixture: ComponentFixture<SearchGooglePlacesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchGooglePlacesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchGooglePlacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
