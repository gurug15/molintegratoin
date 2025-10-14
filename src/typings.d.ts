declare module 'molstar/build/viewer/molstar' {
  export class Viewer {
    static create(element: string | HTMLElement, options?: any): Promise<Viewer>;
    loadStructureFromData(data: string | ArrayBuffer, format: string): Promise<void>;
    loadVolumeFromData(data: ArrayBuffer, format: string): Promise<void>;
  }
}
