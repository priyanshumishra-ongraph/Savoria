import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { AuthService } from "../services/auth.service";
import { throwError, catchError  } from "rxjs";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const platformId = inject(PLATFORM_ID);
    const token = authService.getToken();

    if(token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }
    
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            console.error('Interceptor caught error for URL:', req.url, 'Status:', error.status);
            if (error.status === 401) {
                if (isPlatformBrowser(platformId)) {
                    console.error('Triggering logout due to 401 on URL:', req.url);
                    authService.logout();
                } else {
                    console.error('Ignoring 401 on server to prevent SSR redirect loops.');
                }
            }
            return throwError(() => error);
        })
    );
};