import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IEditorComponent, EditorMode, EditorSize } from './editor.interface';
import { ExpressionEditorComponent } from './expression-editor.component';

@Component({
  selector: 'app-boolean-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ExpressionEditorComponent],
  template: `
    <div 
        class="editor-container" 
        [ngClass]="[size, isDragging ? 'dragging' : '']"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)">
      @if (mode === 'edit') {
        <input 
          type="checkbox" 
          [ngModel]="value === 1" 
          [disabled]="isDisabled"
          (ngModelChange)="onValueChange($event ? 1 : 0)"
          class="editor-checkbox"
        />
      } @else if (mode === 'expression') {
          <app-expression-editor 
            [value]="value === 1 ? 'true' : 'false'" 
            (valueChange)="onExpressionChange($event)"
            [size]="size"
            [pendingVariable]="droppedVariable"
            (exitExpressionMode)="value = previousValue; valueChange.emit(value); mode = 'edit'; modeChange.emit('edit')">
          </app-expression-editor>
      } @else {
        <span class="editor-value" [class.true]="value === 1" [class.false]="value === 0">
          {{ value === 1 ? 'Yes' : 'No' }}
        </span>
      }
    </div>
  `,
  styles: [`
    :host {
        display: block;
        width: 100%;
        /* max-width removed */
    }

    .editor-container {
      display: block; 
      width: 100%;
      min-height: 30px; /* min-height */
      border: 1px solid transparent;
      box-sizing: border-box;
      border-radius: 4px;
      /* For checkbox vertical alignment in block mode: */
      line-height: 28px; 
    }
    
    .editor-checkbox {
      cursor: pointer;
      vertical-align: middle;
      margin: 0;
    }

    .editor-container.dragging {
        border: 2px dashed #2196F3;
        background-color: #e3f2fd;
    }
    
    .editor-checkbox {
      cursor: pointer;
    }

    .editor-value {
      font-weight: 500;
    }
    .editor-value.true { color: green; }
    .editor-value.false { color: red; }

    /* Sizes */
    .small.editor-container {
        height: 24px;
    }
    .small .editor-checkbox {
      transform: scale(0.8);
    }
    .small .editor-value {
      font-size: 12px;
    }

    .medium.editor-container {
        height: 30px;
    }
    .medium .editor-checkbox {
      transform: scale(1.0);
    }
    .medium .editor-value {
      font-size: 16px;
    }
  `]
})
export class BooleanEditorComponent implements IEditorComponent<number> {
  @Input() value: number = 0;
  @Input() mode: EditorMode = 'read';
  @Input() size: EditorSize = 'medium';
  @Input() isDisabled = false;
  @Output() valueChange = new EventEmitter<number>();
  @Output() modeChange = new EventEmitter<EditorMode>();

  isDragging = false;

  onValueChange(newValue: number) {
    this.value = newValue;
    this.valueChange.emit(newValue);
  }

  onExpressionChange(newValue: string) {
    if (newValue === 'true' || newValue === '1') {
      this.value = 1;
      this.valueChange.emit(1);
    } else if (newValue === 'false' || newValue === '0') {
      this.value = 0;
      this.valueChange.emit(0);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  droppedVariable: any = null;
  previousValue: number = 0;

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const data = event.dataTransfer?.getData('application/x-editor-variable');
    if (data) {
      const variable = JSON.parse(data);
      if (variable.type === 'boolean' || variable.type === 'expression') {
        this.droppedVariable = variable;
        this.previousValue = this.value; // Store
        this.mode = 'expression';
        this.modeChange.emit('expression');
      }
    }
  }
}
