import { Injectable } from '@angular/core';
import { User } from 'src/entities/user';
import { map, Observable, of, catchError, EMPTY, Subscriber } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Auth } from 'src/entities/auth';
import { MessageService } from './message.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  url = 'http://localhost:8080/';
//  token = '';
  users: User[] = [
    new User('AlicaService','alica@alica.sk'),
    new User('BobService', 'bobik@kubik.sk', 1, new Date(),'tajne')];
  userSubscriber?: Subscriber<string>;

  constructor(private http: HttpClient,
              private messageService: MessageService,
              private router: Router) { }

  private set token(value: string) {
    if (value) {
      localStorage.setItem("filmsToken", value);
    } else {
      localStorage.removeItem("filmsToken");
    }
  }

  private get token(): string {
    const value = localStorage.getItem("filmsToken");
    return value || '';
  }

  private set username(value: string) {
    this.userSubscriber?.next(value);
    if (value) {
      localStorage.setItem("filmsUsername", value);
    } else {
      localStorage.removeItem("filmsUsername");
    }
  }

  private get username(): string {
    const value = localStorage.getItem("filmsUsername");
    return value || '';
  }

  getCurrentUsers$():Observable<string> {
    return new Observable(subcriber => {
      this.userSubscriber = subcriber;
      subcriber.next(this.username);
    });
  }

  getLocalUsers(): Observable<User[]> {
    return of(this.users);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.url + 'users').pipe(
      map(jsonObj => jsonObj.map(jsonUser => User.clone(jsonUser))),
      catchError(error => this.processError(error))
    );
  }

  getExtendedUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.url + 'users/' + this.token).pipe(
      map(jsonObj => jsonObj.map(jsonUser => User.clone(jsonUser))),
      catchError(error => this.processError(error))
    );
  }

  login(auth: Auth):Observable<boolean> {
    return this.http.post(this.url + 'login', auth, {responseType: "text"}).pipe(
      map(token => {
        this.token = token;
        this.username = auth.name;
        this.messageService.successMessage("Login of user " + auth.name + " was successful");
        return true;
      }),
      catchError(error => this.processError(error))
    );
  }

  logout() {
    this.http.get(this.url + 'logout/' + this.token).pipe(
      catchError(error => this.processError(error))
    ).subscribe(() => {
      this.token = '';
      this.username = '';
      this.router.navigateByUrl("/login");
    });
  }

  processError(error:any): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        // server je nedostupny
        this.messageService.errorMessage("Server is not available");
      }
      if (error.status >=400 && error.status<500) {
        const message = error.error.errorMessage || JSON.parse(error.error).errorMessage;
        if (error.status === 401 && message === "unknown token") {
          this.logout();
          this.messageService.errorMessage("Session expired, please log in again.");  
          return EMPTY;
        }
        this.messageService.errorMessage(message);
      }
      if (error.status >=500) {
        this.messageService.errorMessage("Server failed, contact system administrator");
        console.error(error);
      }
    }
    return EMPTY;
  }
}
