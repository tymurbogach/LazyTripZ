import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { TripLocation } from '../../../../../../interfaces/response.interface';

@Component({
  selector: 'app-menu-locations-trip',
  imports: [MatIconModule, NgClass, RouterLink],
  templateUrl: './menu-locations-trip.component.html',
  styleUrl: './menu-locations-trip.component.css'
})
export class MenuLocationsTripComponent implements OnInit {
  @Input() locations?: TripLocation[] = [];
  @Input() tripId?: number;
  @Input() currentLocation?: string;
  
  public expand: boolean = false;

  ngOnInit() {
    this.expand = false;
  }

  public expandMenu() {
    this.expand = !this.expand;
  }
}
