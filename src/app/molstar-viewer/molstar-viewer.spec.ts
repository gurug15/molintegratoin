import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MolstarViewer } from './molstar-viewer';

describe('MolstarViewer', () => {
  let component: MolstarViewer;
  let fixture: ComponentFixture<MolstarViewer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MolstarViewer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MolstarViewer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
