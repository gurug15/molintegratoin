import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectionStrategy, Renderer2, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-molstar-viewer',
  templateUrl: './molstar-viewer.html',
  imports:[CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MolstarViewerComponent implements AfterViewInit {
  @ViewChild('viewerContainer', { static: true })
  viewerContainer!: ElementRef<HTMLDivElement>;

  private viewer: any;
  private molstar: any;

  isStructureLoaded = false;
  isSpinning = false;
  selectedFile: File | null = null;
  public loadingError: string | null = null;

  constructor(private renderer: Renderer2, private cdr: ChangeDetectorRef) {}
  
  private loadMolstarScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).molstar) {
        this.molstar = (window as any).molstar;
        resolve();
        return;
      }
      
      const script = this.renderer.createElement('script');
      script.src = 'https://molstar.org/viewer/molstar.js';
      
      script.onload = () => {
        this.molstar = (window as any).molstar;
        if (this.molstar) {
          resolve();
        } else {
          reject('Molstar script loaded but global object not found.');
        }
      };
      
      script.onerror = (e: any) => reject(new Error(`Failed to load Molstar script: ${e}`));
      
      this.renderer.appendChild(document.body, script);
    });
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.loadMolstarScript();
      
      this.viewer = await this.molstar.Viewer.create(this.viewerContainer.nativeElement, {
        layoutIsExpanded: false,
        layoutShowControls: false,
        layoutShowRemoteState: false,
        layoutShowSequence: false,
        layoutShowLog: false,
        layoutShowLeftPanel: false,
        viewportShowExpand: false,
        viewportShowSelectionMode: false,
        viewportShowAnimation: false,
      });

    } catch (e) {
      console.error('Molstar viewer initialization failed.', e);
    }
  }

  private getFileFormat(fileName: string): 'pdb' | 'cif' | 'bcif' | 'gro' {
    if (fileName.endsWith('.pdb')) return 'pdb';
    if (fileName.endsWith('.bcif')) return 'bcif';
    if (fileName.endsWith('.gro')) return 'gro';
    return 'cif';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.isStructureLoaded = false; // Reset state before loading
      this.loadingError = null; // Reset error on new file selection
      this.loadFile();
    }
  }

  async loadFile() {
    if (!this.selectedFile || !this.viewer) {
      console.error("No file selected or viewer not initialized.");
      return;
    }
    
    this.loadingError = null;

    try {
      const file = this.selectedFile;
      const isBinary = file.name.toLowerCase().endsWith('.bcif');
      const data = isBinary ? await file.arrayBuffer() : await file.text();
      const format = this.getFileFormat(file.name.toLowerCase());
      
      await this.viewer.loadStructureFromData(data, format);
      
      this.isStructureLoaded = true;
    } catch (error: any) {
      console.error("Failed to load structure:", error);
      this.isStructureLoaded = false;
      this.loadingError = 'Could not load file. Please ensure it is a valid structure file.';
    } finally {
      this.cdr.detectChanges();
    }
  }

  recenterCamera() {
    if (!this.viewer) return;
    // CORRECT API CALL: Access the camera manager to reset the view.
    this.viewer.managers.camera.reset();
  }

  toggleSpin() {
    if (!this.viewer) return;
    this.isSpinning = !this.isSpinning;
    // CORRECT API CALL: Access the camera manager and toggle the spin behavior.
    if (this.viewer.managers.camera) {
      this.viewer.managers.camera.toggleSpin(this.isSpinning);
    }
    this.cdr.detectChanges();
  }

  async setRepresentation(type: 'cartoon' | 'ball-and-stick') {
    if (!this.viewer || !this.isStructureLoaded) return;
    
    // CORRECT API CALL: To change representation, you must go through the structure component manager.
    const manager = this.viewer.managers.structure.component;
    if (!manager) return;

    await manager.clearRepresentations();
    await manager.addRepresentation(type);
  }
}

