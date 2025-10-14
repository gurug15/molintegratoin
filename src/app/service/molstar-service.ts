import { Injectable } from '@angular/core';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { DefaultPluginSpec, PluginSpec } from 'molstar/lib/mol-plugin/spec';

@Injectable({
  providedIn: 'root'
})
export class MolstarService {
  private plugin: PluginContext | undefined;

  /**
   * Initializes the Mol* plugin within a given parent HTML element.
   * This uses the lower-level PluginContext for more control, as recommended for custom apps.
   */
  async init(parent: HTMLDivElement, spec?: PluginSpec): Promise<void> {
    const specToUse = spec ?? DefaultPluginSpec();
    this.plugin = new PluginContext(specToUse);
    await this.plugin.init();

    const canvas = document.createElement('canvas');
    parent.appendChild(canvas);

    if (!(await this.plugin.initViewerAsync(canvas, parent))) {
      throw new Error('Failed to init Mol* viewer');
    }
  }

  /**
   * Loads a structure from a File object.
   * This uses the plugin's data builders for robust data handling.
   */
  async loadStructureFromFile(file: File): Promise<void> {
    if (!this.plugin) throw new Error('Plugin not initialized.');

    await this.plugin.clear();

    const isBinary = file.name.toLowerCase().endsWith('.bcif');
    const data = isBinary ? await file.arrayBuffer() : await file.text();
    const format = this.getFileFormat(file.name);

    const dataProvider = await this.plugin.builders.data.rawData({
        data: isBinary ? new Uint8Array(data as ArrayBuffer) : data,
        label: file.name
    });
      
    const trajectory = await this.plugin.builders.structure.parseTrajectory(dataProvider, format);
    
    await this.plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
  }

  /**
   * Resets the camera to focus on the loaded structure.
   */
  recenterCamera() {
    if (!this.plugin?.managers.camera) return;
    this.plugin.managers.camera.reset();
  }

  /**
   * Toggles the spin animation of the camera.
   */
  toggleSpin(isSpinning: boolean) {
    if (!this.plugin?.canvas3d) return;

    const canvas3d = this.plugin.canvas3d as any;
    if (isSpinning) {
      canvas3d.spin.start();
    } else {
      canvas3d.spin.stop();
    }
  }

  /**
   * Sets the representation for the primary structure.
   */
  async setRepresentation(type: 'cartoon' | 'ball-and-stick') {
    if (!this.plugin?.managers.structure.component) return;

    const components = this.plugin.managers.structure.hierarchy.current.structures[0]?.components;
    if (!components || components.length === 0) return;

    const manager = this.plugin.managers.structure.component;
    
    await manager.removeRepresentations(components);
    await manager.addRepresentation(components, type);
  }

  private getFileFormat(fileName: string): 'pdb' | 'mmcif' | 'gro' {
    if (fileName.endsWith('.pdb')) return 'pdb';
    // FIX: The API expects 'mmcif' for both .cif and .bcif files.
    if (fileName.endsWith('.cif') || fileName.endsWith('.bcif')) return 'mmcif';
    if (fileName.endsWith('.gro')) return 'gro';
    // Default fallback
    return 'mmcif';
  }
}

