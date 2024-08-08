import { AfterContentInit, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { loadModules } from 'esri-loader';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit,AfterViewInit {
  title = 'esriMap';


    
  @ViewChild('mapViewNode', { static: true }) private mapViewEl!: ElementRef;
  view: any = null;

  async initializeMap() {
    try {
      console.log(this.mapViewEl)
      const [EsriMap, EsriMapView] = await loadModules([
        'esri/Map',
        'esri/views/MapView'
      ]);

      const mapProperties = {
        basemap: 'streets-navigation-vector'
      };

      const map = new EsriMap(mapProperties);

      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: [-118.805, 34.027],
        zoom: 13,
        map: map
      };

      this.view = new EsriMapView(mapViewProperties);

      return this.view;
    } catch (error) {
      console.log('EsriLoader: ', error);
    }
  }

  ngOnInit(): void {
      this.initializeMap()
  }

  ngAfterViewInit() {
    this.initializeMap();
  }

  ngOnDestroy() {
    if (this.view) {
      this.view.container = null;
    }
  }
}
  
  
  

