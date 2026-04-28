import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, forwardRef, ChangeDetectorRef } from '@angular/core';
import { FormsModule, FormGroup, FormControl, ReactiveFormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { BtnShowPasswdComponent } from '../btn-show-passwd/btn-show-passwd.component';

import { InputType } from '../../../enum/input.enum';
import { AuthService } from '../../../services/auth.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-input',
  imports: [ FormsModule, ReactiveFormsModule, CommonModule, MatIconModule, BtnShowPasswdComponent, SpinnerComponent ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './input.component.html',
  styleUrl: './input.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-5px)'}),
        animate('0.5s ease-in-out', style({ opacity: 1, transform: 'translateY(0px)'}))
      ]),
    ])
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ]
})
export class InputComponent implements OnInit {
  @Input() label?: string;
  @Input() name?: string = '';
  @Input() type?: InputType = InputType.text;
  @Input() formControl?: FormControl;
  @Input() formGroup?: FormGroup;
  @Input() isRequired: boolean = true;
  @Input() isReadonly?: boolean = false;
  @Input() isPassword?: boolean = false;
  @Input() errorMessage?: string | null = null;
  @Input() value: string = '';

  @Output() valueChange: EventEmitter<string> = new EventEmitter();
  @Output() focus: EventEmitter<string> = new EventEmitter();
  @Output() usernameValidated: EventEmitter<boolean> = new EventEmitter();
  @Output() emailValidated: EventEmitter<boolean> = new EventEmitter();

  public hasFocus: boolean = false;
  public checkError: string | null = null;
  public check: boolean = false;
  public isChecking: boolean = false;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.isRequired) {
      this.label = this.label + ' *';
    }
    if (this.isPassword) {
      this.type = InputType.password;
    }
    this.hasFocus = false;
    this.checkError = null;
    this.check = false;
    this.isChecking = false;
  }

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: string): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onInputChange(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    this.value = inputValue;
    
    if (!this.formControl?.valid) {
      this.check = false;
      return;
    }
    
    if (this.name === 'username' || this.name === 'email') {
      const validationEmitter: Record<string, EventEmitter<boolean>> = {
        username: this.usernameValidated,
        email: this.emailValidated
      }

      this.isChecking = true;

      this.authService.checkField(this.name, this.value).subscribe({
        next: () => {
          this.isChecking = false;
          this.valueChange.emit(this.value);
          this.checkError = null;
          this.check = true;
          validationEmitter[this.name!].emit(true);
          this.cdr.detectChanges();
        },
        error: (response: any) => {
          this.isChecking = false;
          this.checkError = response.error.message;
          this.check = false;
          validationEmitter[this.name!].emit(false);
          this.cdr.detectChanges();
        }
      });
    }
  }

  onFocus() {
    this.hasFocus = true;
    this.checkError = null;
    this.focus.emit(this.name);
  }

  onBlur() {
    this.hasFocus = false;
  }

  showPasswd(show: boolean): void {
    this.type = show? InputType.text : InputType.password;
  }
}

