import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

enum IconBtn {
  show = 'visibility',
  hide = 'visibility_off'
}

@Component({
  selector: 'app-btn-show-passwd',
  imports: [MatIconModule],
  templateUrl: './btn-show-passwd.component.html',
  styleUrl: './btn-show-passwd.component.css'
})
export class BtnShowPasswdComponent implements OnInit {
  @Output() showPasswd: EventEmitter<boolean> = new EventEmitter();
  
  public isPasswdVisible: boolean = false;
  public currentIcon: IconBtn = IconBtn.hide;

  ngOnInit(): void {
      this.currentIcon = IconBtn.hide;
      this.isPasswdVisible = false;
      this.showPasswd.emit(this.isPasswdVisible);
  }

  toggleShowPasswd(): void {
    this.currentIcon = this.isPasswdVisible ? IconBtn.hide : IconBtn.show;
    this.isPasswdVisible =!this.isPasswdVisible;
    this.showPasswd.emit(this.isPasswdVisible);
  }
}
