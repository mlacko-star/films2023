import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FilmService  } from '../film.service';
import { Omdb } from 'src/entities/omdb';
import { Postava } from 'src/entities/postava';

@Component({
  selector: 'app-film-detail',
  templateUrl: './film-detail.component.html',
  styleUrls: ['./film-detail.component.css']
})
export class FilmDetailComponent implements OnChanges{

  @Input() imdbId?: string
  @Input() actors?: Postava[]

  
  omdbData: Omdb = {
    Title: '',
    Year: '',
    Released: '',
    Runtime: '',
    Genre: '',
    Director: '',
    Writer: '',
    Actors: '',
    Plot: '',
    Poster: '',
    Language: ''
  };
  
  
  leadActors = ' ';
  id = '';

  constructor(private filmService: FilmService){}

  ngOnChanges(changes: SimpleChanges): void {
    this.id=this.imdbId || ''

    this.filmService.getFilm(this.id).subscribe(data=>this.omdbData=data)

    if(this.actors){
      this.leadActors = 
        this.actors.filter(actors=> actors.dolezitost ==='hlavná postava')
          .map(p=>(p.herec.krstneMeno+' '+p.herec.priezvisko +' ('+p.postava +')'))
            .join(', ') 
    }
  }
}
