import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IEditorComponent, EditorMode, EditorSize } from './editor.interface';
import { ExpressionEditorComponent } from './expression-editor.component';

@Component({
    selector: 'app-date-editor',
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
          type="date" 
          [ngModel]="value" 
          (ngModelChange)="onValueChange($event)"
          class="editor-input"
        />
      } @else if (mode === 'expression') {
          <app-expression-editor 
            [value]="value ? value.toString() : ''" 
            (valueChange)="onExpressionChange($event)"
            [size]="size"
            [pendingVariable]="droppedVariable"
            (exitExpressionMode)="value = previousValue; valueChange.emit(value); mode = 'edit'; modeChange.emit('edit')">
          </app-expression-editor>
      } @else {
        <span class="editor-value">{{ value }}</span>
      }
    </div>
  `,
    styles: [`
    :host {
        display: block;
        width: 100%;
    }

    .editor-container {
      display: block;
      width: 100%;
      min-height: 30px;
      border: 1px solid transparent;
      box-sizing: border-box;
      border-radius: 4px;
    }
    
    .editor-container.dragging {
        border: 2px dashed #2196F3;
        background-color: #e3f2fd;
    }
    
    .editor-input {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 4px 8px;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }
    
    .editor-value {
      font-family: monospace;
      color: #0066cc;
    }

    /* Sizes */
    .small.editor-container {
        height: 24px;
    }
    .small .editor-input {
      font-size: 12px;
      padding: 2px 4px;
    }
    .small .editor-value {
      font-size: 12px;
    }

    .medium.editor-container {
        height: 30px;
    }
    .medium .editor-input {
      font-size: 16px;
      padding: 6px 12px;
    }
    .medium .editor-value {
      font-size: 16px;
    }
  `]
})
export class DateEditorComponent implements IEditorComponent<string> {
    @Input() value: string = '';
    @Input() mode: EditorMode = 'read';
    @Input() size: EditorSize = 'medium';
    @Output() valueChange = new EventEmitter<string>();
    @Output() modeChange = new EventEmitter<EditorMode>();

    isDragging = false;

    onValueChange(newValue: string) {
        this.value = newValue;
        this.valueChange.emit(newValue);
    }

    onExpressionChange(newValue: string) {
        this.value = newValue;
        this.valueChange.emit(newValue);
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
    previousValue: string = '';

    onDrop(event: DragEvent) {
        event.preventDefault();
        this.isDragging = false;
        const data = event.dataTransfer?.getData('application/x-editor-variable');
        if (data) {
            const variable = JSON.parse(data);
            this.droppedVariable = variable;
            this.previousValue = this.value;
            this.mode = 'expression';
            this.modeChange.emit('expression');
        }
    }
}
