import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IEditorComponent, EditorMode, EditorSize } from './editor.interface';
import { ExpressionEditorComponent } from './expression-editor.component';

@Component({
  selector: 'app-number-editor',
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
          #numInput
          type="number" 
          [ngModel]="value" 
          (ngModelChange)="onValueChange($event)"
          (keydown)="onKeyDown($event)"
          class="editor-input"
          [class.invalid]="error"
        />
        @if (error) {
            <div class="error-msg">{{ error }}</div>
        }
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
      display: flex;
      flex-direction: column;
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
      height: 24px;
      width: 100%;
      box-sizing: border-box;
      outline: none;
    }

    .editor-input.invalid {
        border-color: #f44336;
        background-color: #ffebee;
    }

    .error-msg {
        color: #f44336;
        font-size: var(--font-size-sm);
        margin-top: 2px;
        font-weight: var(--font-weight-medium);
    }
    
    .editor-value {
      font-family: monospace;
      color: #0066cc;
    }

    /* Sizes */
    .small.editor-container {
    }
    .small .editor-input {
      font-size: var(--font-size-base);
      padding: 2px 4px;
    }
    .small .editor-value {
      font-size: var(--font-size-base);
    }

    .medium.editor-container {
    }
    .medium .editor-input {
      font-size: var(--font-size-lg);
      padding: 6px 12px;
    }
    .medium .editor-value {
      font-size: var(--font-size-lg);
    }
  `]
})
export class NumberEditorComponent implements IEditorComponent<number>, OnInit {
  @Input() value: number = 0;
  @Input() mode: EditorMode = 'read';
  @Input() size: EditorSize = 'medium';
  @Input() settings: Record<string, any> = {};
  @Output() valueChange = new EventEmitter<number>();
  @Output() modeChange = new EventEmitter<EditorMode>();

  error: string | null = null;
  isDragging = false;
  droppedVariable: any = null;
  previousValue: number = 0;

  ngOnInit() {
    this.validate(this.value);
  }

  onValueChange(newValue: number) {
    this.value = newValue;
    this.validate(newValue);
    this.valueChange.emit(newValue);
  }

  onKeyDown(event: KeyboardEvent) {
    const allowNegative = this.settings['Number.AllowNegative'] !== false;
    const allowDecimals = this.settings['Number.AllowDecimals'] !== false;
    const allowScientific = this.settings['Number.AllowScientific'] === true;

    if (event.key === '-' && !allowNegative) {
      event.preventDefault();
    }
    if (event.key === '.' && !allowDecimals) {
      event.preventDefault();
    }
    if ((event.key === 'e' || event.key === 'E') && !allowScientific) {
      event.preventDefault();
    }
  }

  private validate(val: number) {
    this.error = null;
    if (val === null || val === undefined) return;

    const allowNegative = this.settings['Number.AllowNegative'] !== false;
    const allowDecimals = this.settings['Number.AllowDecimals'] !== false;
    const allowScientific = this.settings['Number.AllowScientific'] === true;

    if (val < 0 && !allowNegative) {
      this.error = this.settings['Number.AllowNegativeMsg'] || 'Number cannot be negative';
      return;
    }

    if (!allowDecimals && val.toString().includes('.')) {
      this.error = this.settings['Number.AllowDecimalsMsg'] || 'Number cannot be a decimal';
      return;
    }

    if (!allowScientific && val.toString().toLowerCase().includes('e')) {
      this.error = this.settings['Number.AllowScientificMsg'] || 'Number cannot use scientific notation';
      return;
    }
  }

  onExpressionChange(newValue: string) {
    const parsed = parseFloat(newValue);
    if (!isNaN(parsed)) {
      this.value = parsed;
      this.valueChange.emit(parsed);
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

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const data = event.dataTransfer?.getData('application/x-editor-variable');
    if (data) {
      const variable = JSON.parse(data);
      if (variable.type === 'number' || variable.type === 'expression') {
        this.droppedVariable = variable;
        this.previousValue = this.value;
        this.mode = 'expression';
        this.modeChange.emit('expression');
      }
    }
  }
}
