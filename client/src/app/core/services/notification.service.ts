import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AppNotification } from '../models/notification';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  
  private socket: Socket | null = null;
  private apiUrl = `${environment.apiUrl}/notifications`;

  // Signals for state
  notifications = signal<AppNotification[]>([]);
  unreadCount = signal<number>(0);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.connectSocket();
          this.loadInitialData();
        } else {
          this.disconnectSocket();
          this.notifications.set([]);
          this.unreadCount.set(0);
        }
      });
    }
  }

  private connectSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }
    
    const token = this.authService.getToken();
    if (!token) return;

    // Connect to the root URL (where socket.io path defaults to /socket.io/)
    const socketUrl = environment.apiUrl.replace('/api', '');
    
    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('new_notification', (notification: AppNotification) => {
      // Add to front of list
      this.notifications.update(nots => [notification, ...nots]);
      this.unreadCount.update(count => count + 1);
      
      this.playNotificationSound();
      
      if (isPlatformBrowser(this.platformId)) {
        let actionStr = 'interacted with';
        switch (notification.type) {
          case 'review': actionStr = 'reviewed your recipe'; break;
          case 'save': actionStr = 'saved your recipe'; break;
          case 'reply': actionStr = 'replied to your review on'; break;
          case 'helpful': actionStr = 'found your review helpful on'; break;
        }
        
        this.snackBar.open(
          `${notification.senderName} ${actionStr}: ${notification.recipeTitle}`,
          'View',
          { duration: 4000, horizontalPosition: 'right', verticalPosition: 'bottom' }
        ).onAction().subscribe(() => {
          this.router.navigate(['/recipes/id', notification.recipeId]);
          this.markAsRead(notification._id);
        });
      }
    });
    
    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });
  }

  private playNotificationSound() {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      
      // Browsers often suspend audio contexts created outside of user gestures.
      // We must resume it if it's suspended.
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {
          console.warn('Audio playback blocked by browser autoplay policy. Please click anywhere on the page first.');
        });
      }
      
      // Create a bright, audible "ding" sound
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // Slide up to A6
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.02); // 100% volume
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio playback failed', e);
    }
  }

  private disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  currentPage = signal<number>(1);
  hasMore = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  private loadInitialData() {
    this.currentPage.set(1);
    this.http.get<{ notifications: AppNotification[], hasMore: boolean }>(`${this.apiUrl}?page=1&limit=10`).subscribe(res => {
      this.notifications.set(res.notifications);
      this.hasMore.set(res.hasMore);
    });
    this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`).subscribe(res => {
      this.unreadCount.set(res.count);
    });
  }

  loadMore() {
    if (!this.hasMore() || this.isLoading()) return;
    
    this.isLoading.set(true);
    const nextPage = this.currentPage() + 1;
    
    this.http.get<{ notifications: AppNotification[], hasMore: boolean }>(`${this.apiUrl}?page=${nextPage}&limit=10`).subscribe({
      next: (res) => {
        this.notifications.update(current => [...current, ...res.notifications]);
        this.hasMore.set(res.hasMore);
        this.currentPage.set(nextPage);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  markAsRead(id: string) {
    this.http.patch<AppNotification>(`${this.apiUrl}/${id}/read`, {}).subscribe(updated => {
      this.notifications.update(nots => 
        nots.map(n => n._id === id ? { ...n, read: true } : n)
      );
      this.unreadCount.update(c => Math.max(0, c - 1));
    });
  }

  markAllAsRead() {
    this.http.patch(`${this.apiUrl}/read-all`, {}).subscribe(() => {
      this.notifications.update(nots => nots.map(n => ({ ...n, read: true })));
      this.unreadCount.set(0);
    });
  }

  deleteNotification(id: string) {
    const notification = this.notifications().find(n => n._id === id);
    const wasUnread = notification && !notification.read;
    
    this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
      this.notifications.update(nots => nots.filter(n => n._id !== id));
      if (wasUnread) {
        this.unreadCount.update(c => Math.max(0, c - 1));
      }
    });
  }
}
