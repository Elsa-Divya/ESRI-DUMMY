import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { loadModules } from 'esri-loader';



@Component({
  selector: 'app-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.css']
})
export class EsriMapComponent implements OnInit, OnDestroy {
  @ViewChild('mapViewNode', { static: true }) private mapViewEl!: ElementRef;
  view: any = null;
  sketch: any = null;
  graphicsLayer: any = null;
  graphic: any = null;
  textGraphics: any;
  markers: Map<string, { graphic: any; text: string }> = new Map();
  enableComment: boolean = false;
  textGraphicsLayer: any = null; 
  markerToTextMap = new Map();
  sketchLayer: any;
  pointLayer: any;
  textLayer: any;
  textSketchViewModel: any;
  // use this counter for new map notes title purposes
  count = 0;
  // Used to expand comment input text box
  textExpand: any;

  async initializeMap() {
    try {
      const [Map, MapView, Graphic, GraphicsLayer, Sketch, SketchViewModel, Expand,MapNotesLayer] = await loadModules([
        'esri/Map',
        'esri/views/MapView',
        'esri/Graphic',
        'esri/layers/GraphicsLayer',
        'esri/widgets/Sketch',
        'esri/widgets/Sketch/SketchViewModel',
        'esri/widgets/Expand',
        'esri/layers/MapNotesLayer',
        
      ]);

      this.graphicsLayer = new GraphicsLayer();
      this.graphic = new Graphic();
      this.textGraphicsLayer = new GraphicsLayer();


      const map = new Map({
        basemap: 'streets-navigation-vector',
        layers: [this.graphicsLayer,this.textGraphicsLayer]
      });

      const view = new MapView({
        container: this.mapViewEl.nativeElement,
        map: map,
        center: [-118.805, 34.027],
        zoom: 13
      });

      // add a MapNotesLayer for the sketches and map notes
      this.sketchLayer = new MapNotesLayer();
      this.pointLayer = this.sketchLayer.pointLayer;
      view.map.add(this.sketchLayer);

      this.sketch = new Sketch({
        layer: this.graphicsLayer,
        view: view,
        creationMode: 'update'
      });
      
      view.ui.add(this.sketch, 'top-right');
      // TO ADD INPUT BOX AT THE BOTTOM
      // this.textExpand = new Expand({
      //   view: view,
      //   content: document.getElementById("textInputDiv")
      // });
      // view.ui.add(this.textExpand, "bottom-left");
      // Add event listener to detect click  map
      view.on('click', (event: any) => {
        if (this.enableComment) {
          //this.textExpand.expand();
          this.addButton(event.mapPoint);
        }
      });
      this.view = view;
      this.view.when(async() => {
        this.textLayer = this.sketchLayer.textLayer;
        //this.textSketchViewModel = await this.createSketchViewModels(this.textLayer)
        this.appendAddTextButton();
        
      });

    } catch (error) {
      console.log('EsriLoader: ', error);
    }
  }

    /**
     * ADDING CUSTOM COMMENT ICON BUTTON IN WIDGET
     */
    appendAddTextButton() {
      const buttonContainer = document.querySelector('.esri-sketch__panel');
      const addTextButton = document.createElement('button');
      addTextButton.id = 'textButton';
      addTextButton.className = 'action-button esri-icon-comment';
      addTextButton.onclick = () => {
        this.enableComment = true;
        //this.textSketchViewModel.create("point"); // USED TO CREATE POINTS
        //this.setActiveButton(addTextButton); // TO SET INITIAL TEXT IN THE MAP
      }; 
  
      // Append the button to the existing toolbar
      buttonContainer?.appendChild(addTextButton);
    }
  
  /**
   * A BUTTON WILL BE CREATED TO ENABLE ADDING TEXT IN INPUT
   * @param point 
   */
    addButton(point: any) {
      loadModules(['esri/Graphic', 'esri/geometry/Point']).then(([Graphic, Point]) => {
        const screenPoint = this.view.toScreen(point);
        const button = document.createElement('button');
        button.style.position = 'absolute';
        button.style.left = `${screenPoint.x}px`;
        button.style.top = `${screenPoint.y}px`;
        button.textContent = 'Add Text';
        button.addEventListener('click', () => this.addTextInput(screenPoint, point, button));
  
        document.body.appendChild(button);
      });
    }
  
  /**
   * TO CREATE INPUT BOX TO ACCEPT COMMENT
   * @param screenPoint 
   * @param mapPoint 
   * @param button 
   */
    addTextInput(screenPoint: any, mapPoint: any, button?: any) {
      if (button) {
        document.body.removeChild(button);
      }
  
      const input = document.createElement('input');
      input.type = 'text';
      input.style.position = 'absolute';
      input.style.left = `${screenPoint.x}px`;
      input.style.top = `${screenPoint.y}px`;
      input.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
          this.addText(mapPoint, input.value);
          document.body.removeChild(input);
          //this.addMarker(mapPoint,input.value)
        }
      });
  
      document.body.appendChild(input);
      input.focus();
    }
  
  /**
   * APPEND COMMENT TO MAP VIEW
   * @param mapPoint 
   * @param text 
   */
  
    addText(mapPoint:any, text:any) {
      loadModules(['esri/Graphic']).then(([Graphic]) => {
        const textSymbol = {
          type: 'text',
          color: [255, 255, 255],
          haloColor: [1,68,33],
          haloSize: '2px',
          text: text,
          xoffset: 0,
          yoffset: -15,
          font: {
            size: 14,
            family: 'Arial Unicode MS'
          }
        };
  
        this.textGraphics = new Graphic({
          geometry: mapPoint,
          symbol: textSymbol
        });
        
        this.graphicsLayer.add(this.textGraphics);
        this.enableComment = false;
         // Store the association between the marker and the text graphic
        // const objectId = this.graphicsLayer.graphics.items[this.graphicsLayer.graphics.items.length - 1].attributes.objectId;
        // this.markerToTextMap.set(objectId, textGraphic);
      });
    }
  
  /**
   * TO ADD MARKER IF NEED.(DIFFICULT TO DETELE BOTH MARKER AND TEXT TOGETHER SINCE THEY ARE IN DIFFERENT LAYERS)
   * @param point 
   * @param text 
   */
    addMarker(point: any,text:string) {
      loadModules(['esri/Graphic']).then(([Graphic]) => {
        const markerSymbol = {
          type: 'simple-marker',
          color: 'red',
          size: '8px',
          outline: {
            color: 'white',
            width: 1
          }
        };
        const pointGraphic = new Graphic({
          geometry: point,
          symbol: markerSymbol
        });
        this.graphicsLayer.add(pointGraphic);
        this.enableComment = false;
        this.graphicsLayer.on('delete', (e: any) => {
          console.log('delete', e)
          this.graphicsLayer.remove(this.textGraphics)
        });
        
       
      });
    }
  
    async ngOnInit() {
      await this.initializeMap();
    }
  
    ngOnDestroy() {
      if (this.view) {
        this.view.container = null;
      }
    }

  /**
   * 
   * EXPERIMENT FOR REPLICA
   */
  // private async createSketchViewModels(layer: any): Promise<any> {
  //   const [SketchViewModel] = await loadModules(['esri/widgets/Sketch/SketchViewModel']);
    
  //   const sketchVM = new SketchViewModel({
  //     view: this.view,
  //     layer: layer,
  //     updateOnGraphicClick: true,
  //   });

  //   sketchVM.on("create", await this.addGraphic.bind(this));


  //   return sketchVM; // Return the SketchViewModel instance
  // }
  
  // async addGraphic(event: any) {
  //   const [TextSymbol] = await loadModules(['esri/symbols/TextSymbol']);
  //   const [Graphic] = await loadModules(['esri/Graphic']);
  //   if (event.state === "complete") {
  //     switch (event.tool) {
  //       case "point":
  //         this.count++;
  //         let elemental = document.getElementsByClassName("active");

  //         if (elemental[0].id == "pointButton") {
  //           this.pointLayer.remove(event.graphic);
  //           const newPointGraphic = new Graphic({
  //             geometry: event.graphic.geometry,
  //             symbol: {
  //               type: "simple-marker",
  //               style: "circle",
  //               size: 10,
  //               color: [78,90],
  //               outline: {
  //                 color: [155, 89, 182],
  //                 size: 10,
  //                 width: 2
  //               }
  //             },
  //             attributes: {
  //               title: "point map note #" + this.count
  //             }
  //           });
  //           this.pointLayer.add(newPointGraphic);
  //         } else if (elemental[0].id == "textButton") {
  //           this.count++;
  //           this.textLayer.remove(event.graphic);
  //           const textSymbol = new TextSymbol({
  //             text: "new text alert", // The text to display
  //             color: [255, 255, 255], // Text color (white)
  //             haloColor: [1, 68, 33], // Halo color (dark green)
  //             haloSize: 2, // Halo size
  //             font: {
  //               family: "Arial Unicode MS", // Font family
  //               size: 14 // Font size
  //             }
  //           });
  //           const newTextGraphic = new Graphic({
  //             geometry: event.graphic.geometry,
  //             symbol:textSymbol ,
  //             attributes: {
  //               title: "text map note #" + this.count
  //             }
  //           });
  //           // this.textLayer.add(newTextGraphic);
  //         } else {
  //           console.log("point logic error occurred");
  //           break;
  //         }
  //         this.setActiveButton();
  //         break;

  //       default:
  //         console.log("geometry type not found: ", event);
  //     }
  //   }
  // }
  // setActiveButton(selectedButton?:any) {
  //   this.view.focus();
  //   const elements = document.getElementsByClassName("active");
  //   for (let i = 0; i < elements.length; i++) {
  //     elements[i].classList.remove("active");
  //   }
  //   if (selectedButton) {
  //     selectedButton.classList.add("active");
  //   }
  // }
    
  // editText(textLabel:any, mapPoint:any, uniqueId:any) {
  //   const input = document.createElement('input');
  //   input.type = 'text';
  //   input.value = textLabel.innerText; // Get the current text
  //   const screenPoint = this.view.toScreen(mapPoint);
  //   input.style.position = 'absolute';
  //   input.style.left = `${screenPoint.x}px`;
  //   input.style.top = `${screenPoint.y}px`;

  //   input.addEventListener('keyup', (event) => {
  //     if (event.key === 'Enter') {
  //       textLabel.innerText = input.value; // Update the label
  //       document.body.removeChild(input);
  //       // Update the graphic with the new text
  //       this.updateTextGraphic(uniqueId, input.value);
  //     }
  //   });

  //   document.body.appendChild(input);
  //   input.focus();
  //   document.body.removeChild(textLabel);
  // }

  // updateTextGraphic(uniqueId:any, newText:any) {
  //   const textGraphic = this.textGraphics.get(uniqueId);
  //   if (textGraphic) {
  //     // Update the existing graphic's symbol with the new text
  //     textGraphic.symbol.text = newText;
  //     this.graphicsLayer.remove(textGraphic); // Remove old graphic
  //     this.graphicsLayer.add(textGraphic); // Add updated graphic
  //   }
  // }
  



 
  
 

 







  

 

}
