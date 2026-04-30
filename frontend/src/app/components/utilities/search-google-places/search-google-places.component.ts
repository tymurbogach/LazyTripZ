import { Component, EventEmitter, Output, OnDestroy, HostListener, ElementRef } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

interface NominatimResult {
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    county?: string;
    region?: string;
    country?: string;
  };
}

interface PlaceResult {
  city: string;
  province: string | null;
  country: string;
  displayName: string;
}

@Component({
  selector: 'app-search-google-places',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search-google-places.component.html',
  styleUrl: './search-google-places.component.css'
})
export class SearchGooglePlacesComponent implements OnDestroy {
  @Output() placeSelected = new EventEmitter<{ city: string; province: string | null; country: string }>();

  query: string = '';
  results: PlaceResult[] = [];
  isLoading: boolean = false;
  showDropdown: boolean = false;

  private searchSubject = new Subject<string>();

  constructor(private http: HttpClient, private elRef: ElementRef) {
    // Debounce a 500ms para respetar el límite de Nominatim (1 req/seg)
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 3) {
          this.isLoading = false;
          return of([]);
        }
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=8&accept-language=es`;
        return this.http.get<NominatimResult[]>(url).pipe(catchError(() => of([])));
      })
    ).subscribe(raw => {
      this.isLoading = false;
      this.results = this.parseResults(raw as NominatimResult[]);
      this.showDropdown = this.results.length > 0;
    });
  }

  onInput(value: string): void {
    this.query = value;
    if (value.length < 3) {
      this.showDropdown = false;
      this.results = [];
      this.isLoading = false;
      return;
    }
    this.isLoading = true;
    this.searchSubject.next(value);
  }

  // Cierra dropdown al hacer clic fuera del componente
  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  private parseResults(results: NominatimResult[]): PlaceResult[] {
    return results
      .filter(r => !!(r.address.city || r.address.town || r.address.village || r.address.municipality))
      .map(r => {
        const addr = r.address;
        const city = addr.city || addr.town || addr.village || addr.municipality || '';
        const province = addr.state || addr.county || addr.region || null;
        const country = addr.country || '';
        const displayName = [city, province, country].filter(Boolean).join(', ');
        return { city, province, country, displayName };
      })
      // Deduplicar por ciudad+país
      .filter((item, i, self) =>
        i === self.findIndex(t => t.city === item.city && t.country === item.country)
      )
      .slice(0, 5);
  }

  selectPlace(place: PlaceResult): void {
    this.query = place.displayName;
    this.showDropdown = false;
    this.results = [];
    this.placeSelected.emit({ city: place.city, province: place.province, country: place.country });
  }

  clearSelection(): void {
    this.query = '';
    this.showDropdown = false;
    this.results = [];
    this.isLoading = false;
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }
}
