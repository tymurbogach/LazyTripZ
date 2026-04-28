import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Trip } from '../../../../../interfaces/response.interface';
import { TripUserService } from '../../../../../services/trip-user.service';
import { SearchUsersComponent } from './search-users/search-users.component';
import { DialogService } from '../../../../../services/dialog.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../../../../services/auth.service';

@Component({
  selector: 'app-users-trip',
  imports: [CommonModule, MatIconModule, SearchUsersComponent],
  templateUrl: './users-trip.component.html',
  styleUrl: './users-trip.component.css',
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
export class UsersTripComponent implements OnInit {
  trip!: Trip;
  users: any[] = [];
  permission: boolean = false;
  selectedUser: any = null;
  currentUserId: number | null = null;

  @Output() permissionChanged = new EventEmitter<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<UsersTripComponent>,
    private tripUserService: TripUserService,
    private dialogService: DialogService,
    private authService: AuthService
  ) {
    this.trip = { ...data.trip };
    this.permission = data.permission;
  }

  ngOnInit(): void {
    this.authService.profile().subscribe({
      next: (response) => {
        this.currentUserId = response.data.id;
        this.getUsers();
      },
      error: () => {
        this.getUsers();
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  getMyPermission(): void {
    this.tripUserService.getPermissionTrip(this.trip.id).subscribe({
      next: (response) => {
        this.permission = response.data === 'admin';
      },
      error: () => {
        this.permission = false;
      }
    });
  }

  // Función para obtener los usuarios del viaje
  getUsers(): void {
    this.tripUserService.getUsersTrips(this.trip.id).subscribe({
      next: (response) => {
        // Ordenar: primero los admin, luego el resto
        this.users = response.data.sort((a: any, b: any) => {
          if (a.pivot.permission === 'admin' && b.pivot.permission !== 'admin') return -1;
          if (a.pivot.permission !== 'admin' && b.pivot.permission === 'admin') return 1;
          return 0;
        });
      },
      error: () => {
        this.dialogService.error('Error al cargar los usuarios del viaje');
      }
    });
  }

  // Función para seleccionar un usuario
  selectUser(user: any): void {
    if (this.selectedUser === user) {
      this.selectedUser = null; 
    } else {
      this.selectedUser = user;
    }
  }

  // Función para verificar si es último admin y por tanto asignar como admin a otro usuario
  checkLastAdmin(user: any): boolean {
    // Verifico si el usuario que se quiere eliminar es el último admin
    const admins = this.users.filter(u => u.pivot.permission === 'admin');
    const isLastAdmin = admins.length === 1 && admins[0].id === user.id;

    if (isLastAdmin) { 
      // Busco el primer usuario distinto al que se va a eliminar
      const otherUser = this.users.find(u => u.id !== user.id);
      if (otherUser) {
        // Asigno el permiso de admin al primer usuario distinto
        this.tripUserService.updateUserTrip(this.trip.id, otherUser.id, 'admin').subscribe({
          next: () => {
            if (user.id === this.currentUserId) {
              this.getMyPermission();
              this.permissionChanged.emit();
            }
            return true;
          },
          error: () => {
            return false;
          }
        })
      }
    } 
    return true;
  }

  // Función para cambiar el permiso de un usuario
  updateUserPermission(user: any): void {
    if (!this.permission) {
      this.dialogService.info('¡No tienes permiso para eso!');
      return;
    }

    let newPermission = user.pivot.permission === 'admin' ? 'user' : 'admin';

    if (newPermission === 'user' && !this.checkLastAdmin(user)) {
      this.dialogService.error('Fallo al cambiar el permiso');
      return;
    }
   
    this.tripUserService.updateUserTrip(this.trip.id, user.id, newPermission).subscribe({
      next: () => {
        if (user.id === this.currentUserId) {
          this.getMyPermission();
          this.permissionChanged.emit();
        }
        this.getUsers();
        this.selectedUser = null;
      },
      error: () => {
        this.dialogService.error('Error al cambiar el permiso del usuario');
      }
    });
  }

  // Función para eliminar un usuario del viaje
  async removeUser(user: any): Promise<void> {
    if (this.users.length === 1) {
      this.dialogService.info('El viaje debe tener al menos un usuario');
      return;
    }

    if (!this.checkLastAdmin(user)) {
      this.dialogService.error('Error al eliminar el último administrador del viaje');
      return;
    }

    if (user.id === this.currentUserId) {
      const confirm = await this.dialogService.confirm('¿Seguro que quieres irte?');
      if (!confirm) return;

      this.tripUserService.removeUserTrip(this.trip.id, user.id).subscribe({
        next: () => {
            this.dialogService.success('¡Adiós!');
            this.dialogRef.close('refresh');
            this.getUsers();
            this.selectedUser = null;
        },
        error: () => {
          this.dialogService.error('Error al intentar salirte del viaje');
        }
      });

    } else {
      this.tripUserService.removeUserTrip(this.trip.id, user.id).subscribe({
        next:  () => {
          this.getUsers();
          this.selectedUser = null;
        },
        error: () => {
          this.dialogService.error('Error al eliminar el usuario del viaje');
        }
      });
    }
  }

  async exitTrip(): Promise<void> {
    const confirm = await this.dialogService.confirm('¿Seguro que quieres irte?');
    if (!confirm) return;

    this.tripUserService.exitUserTrip(this.trip.id).subscribe({
      next: () => {
        this.dialogService.success('¡Adiós!');
        this.dialogRef.close('refresh');
      },
      error: () => {
        this.dialogService.error('Error al intentar salirte del viaje');
      }
    });
  }
}
