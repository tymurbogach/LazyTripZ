import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { debounceTime, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../../../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TripUserService } from '../../../../../../services/trip-user.service';
import { DialogService } from '../../../../../../services/dialog.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-search-users',
  imports: [MatIconModule, CommonModule, FormsModule],
  templateUrl: './search-users.component.html',
  styleUrl: './search-users.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.5)' }),
        animate('0.2s ease-in-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'scale(1)' }),
        animate('0.2s ease-in-out', style({ opacity: 0, transform: 'scale(0.5)' }))
      ]),
    ])
  ]
})
export class SearchUsersComponent implements OnInit {
  searchTerm: string = '';
  userSuggestions: any[] = [];
  highlightedIndex: number = -1;
  selectedSuggestion: any = null;
  private searchSubject = new Subject<string>();

  @Input() trip!: any;

  @Output() userAdded = new EventEmitter<void>();

  constructor(
    private userService: UserService,
    private tripUserService: TripUserService,
    private dialogService: DialogService
  ) { }

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      switchMap(term => this.userService.searchUsers(term, this.trip.id))
    ).subscribe(response => {
      this.userSuggestions = response.data || [];
    });

  }

  onSearchUser() {
    if (this.searchTerm.length > 0) {
      this.searchSubject.next(this.searchTerm);
    } else {
      this.userSuggestions = [];
    }
  }

  selectSuggestion(user: any) {
    this.selectedSuggestion = user;
    this.searchTerm = user.name;
    this.userSuggestions = [];
  }

  addUser(user?: any) {
    this.tripUserService.addUserTrip(this.trip.id, user?.id).subscribe({
      next: (response) => {
        this.userSuggestions = [];
        this.searchTerm = '';
        this.userAdded.emit();
      },
      error: (error) => {
        this.dialogService.error('Error al agregar el usuario al viaje');
      }
    })
  }
}
