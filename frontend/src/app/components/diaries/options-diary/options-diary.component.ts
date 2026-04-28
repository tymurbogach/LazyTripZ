import { Component, EventEmitter, Input, Output, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { trigger, transition, style, animate } from '@angular/animations';
import { Diary } from '../../../interfaces/response.interface';

@Component({
  selector: 'app-options-diary',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './options-diary.component.html',
  styleUrl: './options-diary.component.css',
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
    ]),
    trigger('expandCollapse', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.5)', maxHeight: '0' }),
        animate('0.3s cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'scale(1)', maxHeight: '500px' }))
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'scale(1)', maxHeight: '500px' }),
        animate('0.3s cubic-bezier(.4,0,.2,1)', style({ opacity: 0, transform: 'scale(0.5)', maxHeight: '0' }))
      ]),
    ])
  ]
})
export class OptionsDiaryComponent {
  @Input() diary!: Diary;
  @Output() editEvent = new EventEmitter<Diary>();
  @Output() deleteEvent = new EventEmitter<Diary>();

  expand: boolean = false;

  constructor(private elementRef: ElementRef) {}

  toogleOptions() {
    this.expand = !this.expand;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.expand = false;
    }
  }

  editDiary() {
    this.editEvent.emit(this.diary);
    this.expand = false;
  }

  deleteDiary() {
    this.deleteEvent.emit(this.diary);
    this.expand = false;
  }
} 