import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmintaskviewComponent } from './admintaskview.component';

describe('AdmintaskviewComponent', () => {
  let component: AdmintaskviewComponent;
  let fixture: ComponentFixture<AdmintaskviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmintaskviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdmintaskviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
