import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Experiment } from './experiment';

describe('Experiment', () => {
  let component: Experiment;
  let fixture: ComponentFixture<Experiment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Experiment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Experiment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
