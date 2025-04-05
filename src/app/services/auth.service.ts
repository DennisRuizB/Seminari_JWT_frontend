import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = "http://localhost:9000/api/auth";
  constructor(private http: HttpClient) { }
  
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }
  loginWithGoogle(): void {
    window.location.href = `${this.apiUrl}/google`;
  }

  handleGoogleCallback(token: string): Observable<any> {
    localStorage.setItem('access_token', token);
    return of({ success: true, token: token });
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  logout(): void {
    localStorage.removeItem('access_token');
  }

  async refreshAccesToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        // Realiza la solicitud al backend para renovar el token
        const response: any = await this.http.post(`${this.apiUrl}/refreshToken`, { refreshToken }).toPromise();
  
        // Extrae el token del objeto de respuesta
        const accessToken = response?.accessToken; // Asegúrate de que el backend devuelva el token en `response.accessToken`
        if (accessToken) {
          localStorage.setItem('access_token', accessToken);
          console.log("AccessToken renovado exitosamente:", accessToken);
          return accessToken;
        } else {
          console.error('No se recibió un nuevo token en la respuesta.');
          return null;
        }
      } catch (error) {
        console.error('Error al renovar el token:', error);
        return null;
      }
    } else {
      console.error('No se encontró el refresh_token en el localStorage.');
      return null;
    }
  }


}

