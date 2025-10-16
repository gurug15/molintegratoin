import { Component, ElementRef, SimpleChanges, ViewChild, computed, signal } from '@angular/core';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';
import { UUID } from 'molstar/lib/mol-util';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Color } from 'molstar/lib/mol-util/color';
import { v4 as uuidv4 } from 'uuid';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import { PluginStateObject } from 'molstar/lib/mol-plugin-state/objects';
import { ColorTheme } from 'molstar/lib/mol-theme/color';

@Component({
  selector: 'app-experiment',
  imports: [ReactiveFormsModule],
  templateUrl: './experiment.html',
  styleUrl:"./experiment.css"
})
export class Experiment {
    @ViewChild("viewerCanvas",{static: true}) canvasRef!:ElementRef<HTMLCanvasElement>
    @ViewChild('viewerParent', { static: false }) parentRef!: ElementRef<HTMLDivElement>;
    plugin!: PluginContext; 
    isPluginReady = false;
    bgColorControl = new FormControl<string>('#000000', { nonNullable: true });
    structureColorControl  = signal(Color(0xffffff)) ;
    selectedRepresentation = "";
    isStructureLoaded = signal(false);
    isSpinning = signal(false);
    representationTypes: [string, string][] = [];
    async ngAfterViewInit() {
      //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
      //Add 'implements AfterViewInit' to the class.
      this.plugin = new PluginContext(DefaultPluginSpec());
       
      await this.plugin.init();

      const canvas = this.canvasRef.nativeElement;
      const parent = this.parentRef.nativeElement;


      const success = await this.plugin.initViewerAsync(canvas,parent)
    

      if (success) {
      this.isPluginReady = true;
      console.log(' Molstar initialized successfully!');
    } else {
      console.error(' Failed to initialize Molstar');
    }
    }

    
    
    

// async setRepresentation(type: string): Promise<void> {
//   if (!this.isStructureLoaded()) {
//     console.warn('No structure loaded');
//     return;
//   }

//   try {
//     // Get all structure nodes from state
//     const state = this.plugin.state.data;

//   console.log('selectQ exists?', typeof state.selectQ);
//     const structures = state.selectQ(q => 
//       q.ofType(PluginStateObject.Molecule.Structure)
//     )
//     if (structures.length === 0) {
//       console.warn('No structure found');
//       return;
//     }

//     // Get the structure reference
//     const structure = structures[0];
    
//     // Clear existing representations
//     const representations = state.selectQ(q => {
//         return q.ofType(PluginStateObject.Molecule.Structure.Representation3D);
//     });
//     for (const repr of representations) {
//       await this.plugin.build().delete(repr.transform.ref).commit();
//     }


//     console.log("add representaion: ",this.plugin.builders.structure.representation.addRepresentation);
//     if(!this.structureColorControl) return
//     // Add new representation
//     await this.plugin.builders.structure.representation.addRepresentation(
//       structure, 
//       { type: type as any,
//         color: 'uniform',
//         colorParams: { value: this.structureColorControl() }
//       }
//     )

//     console.log(`Representation changed to: ${type}`);
//   } catch (error) {
//     console.error(`Failed to set representation:`, error);
//   }
// }
changeStructureColor(event: Event) {
  const input = event.target as HTMLInputElement;
  const hexValue = input.value;
  const intColor = parseInt(hexValue.replace('#', '0x'));

  this.structureColorControl.set(Color(intColor));

  this.setRepresentation(this.selectedRepresentation);
}


async setRepresentation(type: string): Promise<void> {
  if (!this.isStructureLoaded() || !type) {
    console.warn('No structure loaded or representation type provided');
    return;
  }

  this.selectedRepresentation = type;

  try {
    const state = this.plugin.state.data;
    const structures = state.selectQ(q => q.ofType(PluginStateObject.Molecule.Structure));
    if (structures.length === 0) return;
    const structure = structures[0];

    const representations = state.selectQ(q => q.ofType(PluginStateObject.Molecule.Structure.Representation3D));
    for (const repr of representations) {
      await this.plugin.build().delete(repr.transform.ref).commit();
    }

    await this.plugin.builders.structure.representation.addRepresentation(
      structure,
      {
        type: type as any,
        color: 'uniform',
        colorParams: { value: this.structureColorControl() } // Read from the signal
      }
    );

    this.recenterView();
  } catch (error) {
    console.error(`Failed to set representation:`, error);
  }
}

  recenterView(){
    if (!this.plugin.canvas3d) {
        console.warn('Canvas not ready');
        return;
    }
    const sphere = this.plugin.canvas3d.boundingSphere;

    this.plugin.canvas3d.camera.focus(sphere.center,sphere.radius, 200);
  }

     async onFileSelected(event: Event) {
    if (!this.isPluginReady) {
      console.warn('Plugin not ready yet!');
      return;
    }
   
   
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file: File = input.files[0];

    const assetFile: Asset.File = {
      kind: 'file',
      id: uuidv4() as UUID,
      name: file.name,
      file: file
    };

    try {
      // Step 1: Read the file
      const data = await this.plugin.builders.data.readFile({
        file: assetFile,
        label: file.name,
        isBinary: false
      });
      
      
      const trajectory = await this.plugin.builders.structure.parseTrajectory(data.data.ref, 'pdb');
    
    await this.plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
     this.isStructureLoaded.set(true);
      this.representationTypes = this.plugin.representation.structure.registry.types;
      console.log("Available representations:", this.representationTypes);
    } catch (error) {
      console.error(' Error loading file:', error);
    }
  }
  

  toggleSpin(){
    if (!this.plugin.canvas3d) {
        console.warn('Canvas not ready');
        return;
    }
      this.isSpinning.update(currentValue => !currentValue);
    this.plugin.canvas3d.setProps({ 
        trackball:{
          animate:{
            name: "spin",
            params: {
              speed:this.isSpinning()?  .04:0,
            }
          } 
        }
      })
      
  }

  // changeStructureColor(event:Event){

  //   const input = event.target as HTMLInputElement;
  //   const hexValue = input.value;
  //   const intColor = parseInt(hexValue.replace('#', '0x'));
  //   this.structureColorControl.set(Color(intColor));
        
  //   const component = this.plugin.managers.structure.hierarchy.current.structures[0]?.components;
  //   console.log('Components found:', component);
  //   console.log('Number of components:', component?.length);
  //     console.log("structures:  - - --",this.plugin.managers.structure.hierarchy.current.structures);
  //     if(component){
  //     this.plugin.managers.structure.component.updateRepresentationsTheme(component,{
  //         color: 'uniform',
  //         colorParams: {
  //           value: this.structureColorControl()
  //         }
  //     })
  //      }
  // }

  changeBackgroundColor(event:Event){
    // const select = event.target as HTMLSelectElement;
    // const selectColor = select.value;
    // console.log("select Color: ",selectColor);
    console.log("inputColor : ",this.bgColorControl.value);
    const colorConvert = (color:string):Color => {
        const intColor = parseInt(this.bgColorControl.value.replace('#', '0x'));

        return  Color(intColor);
      }
    const colorValue =  colorConvert(this.bgColorControl.value);
    // const colorValue = parseInt(selectColor)
     if (!this.plugin.canvas3d) {
        console.warn('Canvas not ready');
        return;
      }
       this.plugin.canvas3d.setProps({
        renderer:{
          backgroundColor : colorValue,
        }
      })
      
  }

  // ngOnChanges(changes: SimpleChanges): void {
  //   //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
  //   //Add '${implements OnChanges}' to the class.
  //   if (!this.plugin.canvas3d) {
  //       console.warn('Canvas not ready');
  //       return;
  //     }
  //   this.plugin.canvas3d.setProps({
  //       trackball:{
  //         animate:{
  //           name: "spin",
  //           params: {
  //             speed: .01
  //           }
  //         } 
  //       }
  //     })
  // }

  ngOnDestroy() {
    this.plugin?.dispose();
  }
}
