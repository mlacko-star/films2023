import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { Component, OnInit, AfterViewInit, ViewChild, EventEmitter  } from '@angular/core';
import { Film } from 'src/entities/film';
import { Observable, Subject, mergeAll, tap, switchMap, map, of } from 'rxjs';
import { UsersService } from 'src/services/users.service';
import { FilmsService } from '../films.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-films-list',
  templateUrl: './films-list.component.html',
  styleUrls: ['./films-list.component.css'],
  animations: [
    trigger('expand', [
      state('collapsed', style({height: '0px'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('0.5s')),
    ]),
  ],
})
export class FilmsListComponent implements OnInit, AfterViewInit{

  columnsToDisplay = ['id','nazov','rok'];
  films: Film[] = [];
  filmsDataSource: FilmsDataSource;
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  filterEmitter = new EventEmitter<string>();

  expandedElement: any
  
  
  constructor(private filmsService: FilmsService, private usersService: UsersService){
    this.filmsDataSource = new FilmsDataSource(filmsService);
  }

  ngOnInit(): void {
    if (this.usersService.isLoggedIn()) {
      this.columnsToDisplay = ['id','nazov','slovenskyNazov','rok','afi1998','afi2007'];
    }
    this.filmsService.getFilms().subscribe(resp => {
      this.films = resp.items;
      console.log('response: ', resp);
    });
  }

  ngAfterViewInit(): void {
    if (this.paginator && this.sort) {
      this.filmsDataSource.addEventsSources(this.paginator,this.sort, this.filterEmitter.asObservable());
    }
  }


  onFilter(event:any){
    this.filterEmitter.emit(event.target.value.trim().toLowerCase());
  }
}

class FilmsDataSource implements DataSource<Film> {
  futureObservables = new Subject<Observable<Query>>();
  paginator?: MatPaginator;
  orderBy?: string;
  descending?: boolean;
  search?: string; 
  pageSize = 10;

  constructor(private filmsService:FilmsService){}

  addEventsSources(paginator: MatPaginator, sort: MatSort, filter: Observable<string>){
    this.paginator = paginator;
    this.pageSize = paginator.pageSize;
    this.futureObservables.next(of(new Query(undefined,undefined,0,this.pageSize)));  // first query
    this.futureObservables.next(paginator.page.pipe(
      map(pageEvent =>{
        this.pageSize = pageEvent.pageSize;
        const indexFrom = pageEvent.pageIndex * pageEvent.pageSize;
        const indexTo = indexFrom + pageEvent.pageSize;
        return new Query(this.orderBy, this.descending, indexFrom, indexTo, this.search)
      })
    ));
    this.futureObservables.next(sort.sortChange.pipe(
      map(sortEvent => {
        if (sortEvent.direction === '') {
          this.orderBy = undefined;
          this.descending = undefined;
          return new Query();
        }
        this.descending = sortEvent.direction === 'desc';
        this.orderBy = sortEvent.active;
        if (sortEvent.active === 'afi1998') this.orderBy = 'poradieVRebricku.AFI 1998';
        if (sortEvent.active === 'afi2007') this.orderBy = 'poradieVRebricku.AFI 2007';
        return new Query(this.orderBy,this.descending, 0, this.pageSize, this.search);
      })
    ));
    this.futureObservables.next(filter.pipe(
      tap(event=> this.search = event),
      map(event => new Query(this.orderBy, this.descending, 0, this.pageSize, event)))
    );
  }

  connect(): Observable<Film[]>{
    return this.futureObservables.pipe(
      mergeAll(),
      tap(event => console.log("Event: ", event)),
      switchMap(query => this.filmsService.getFilms(query.orderby, 
                                                    query.descending, 
                                                    query.indexFrom, 
                                                    query.indexTo, 
                                                    query.search)),
      map(response => {
        if (this.paginator)
          this.paginator.length = response.totalCount;
        return response.items;
      })
    );
  }

  disconnect(collectionViewer: CollectionViewer): void {
  }
}

class Query {
  constructor(
    public orderby?: string,
    public descending?: boolean,
    public indexFrom = 0,
    public indexTo = 10,
    public search?: string 
  ){}
}