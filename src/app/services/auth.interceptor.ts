import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export function jwtInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  console.log("Dentro del interceptador");

  const token = localStorage.getItem('access_token');
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const authService = inject(AuthService);

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        console.log("Error 401 detectado, intentando renovar el token...");
        return from(authService.refreshAccesToken()).pipe(
          switchMap(() => {
            const newToken = localStorage.getItem('access_token');
            console.log("Token enviado en el encabezado Authorization:", newToken);

            if (newToken) {
              const clonedRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
              });
              return next(clonedRequest);
            } else {
              toastr.error(
                'No se pudo renovar el token. Por favor, inicie sesión nuevamente.',
                'Sesión Expirada',
                { timeOut: 3000, closeButton: true }
              );
              router.navigate(['/login']);
              return throwError(() => error);
            }
          }),
          catchError((refreshError) => {
            console.error('Error al intentar refrescar el token:', refreshError);

            // Manejo del caso en que el refresh_token ha expirado
            if (refreshError.error === "SESSION_NO_VALID") {
              toastr.error(
              'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
              'Sesión Expirada',
              { timeOut: 3000, closeButton: true }
              );

              // Limpia el contenido de la aplicación y muestra solo el componente de login
                location.reload(); // Recarga la página para limpiar el estado de la aplicación
            }

            return throwError(() => refreshError);
          })
        );
      }

      // Si no es un error 401, simplemente lanza el error
      return throwError(() => error);
    })
  );
}