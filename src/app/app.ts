import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MolstarViewerComponent } from './molstar-viewer/molstar-viewer';
import { Experiment } from './experiment/experiment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,Experiment],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
