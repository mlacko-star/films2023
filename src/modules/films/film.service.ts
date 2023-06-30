import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { UsersService } from 'src/services/users.service';
import { Omdb } from 'src/entities/omdb';

@Injectable({
  providedIn: 'root'
})
export class FilmService {

  apiUrl = 'http://www.omdbapi.com/?apikey=8c8d8a8d&plot=full&i=';

  get token() {
    return this.usersService.token;
  }

  constructor(private http: HttpClient, private usersService: UsersService) { }

  
  getFilm(id: string){
    const url = this.apiUrl
    return this.http.get<Omdb>(url+id).pipe(
      catchError((err) => this.usersService.processError(err)));
  }
  
}
