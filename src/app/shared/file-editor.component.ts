import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IEditorComponent, EditorMode, EditorSize } from './editor.interface';
import { ExpressionEditorComponent } from './expression-editor.component';

@Component({
  selector: 'app-file-editor',
  standalone: true,
  imports: [CommonModule, ExpressionEditorComponent],
  template: `
    <div class="editor-container" [ngClass]="size">
      @if (mode === 'edit') {
        @if (!value) {
          <div 
            class="drop-zone"
            (click)="fileInput.click()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            [class.dragging]="isDragging">
            <i>drag file here or click to pick</i>
            <input 
              #fileInput
              type="file" 
              style="display: none"
              (change)="onFileSelected($event)"
            />
          </div>
        } @else {
          <div class="file-display">
            <a href="#" (click)="downloadFile($event)" class="file-name" [title]="value.name">{{ value.name }}</a>
            <button class="delete-btn" (click)="clearFile()" title="Remove file">✕</button>
          </div>
        }
      } @else if (mode === 'expression') {
          <app-expression-editor 
            [value]="value ? value.name : ''" 
            (valueChange)="onExpressionChange($event)"
            [size]="size"
            [pendingVariable]="droppedVariable"
            (exitExpressionMode)="value = previousValue; valueChange.emit(value); mode = 'edit'; modeChange.emit('edit')">
          </app-expression-editor>
      } @else {
        <div class="read-only-display">
            @if (value) {
                <a href="#" (click)="downloadFile($event)" class="file-name" [title]="value.name">{{ value.name }}</a>
            } @else {
                <span class="empty-value">(no file)</span>
            }
        </div>
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
      display: inline-block;
      vertical-align: top;
      width: 100%;
      box-sizing: border-box;
    }

    .drop-zone {
      border: 2px dashed #ccc;
      border-radius: 4px;
      padding: 10px;
      text-align: center;
      cursor: pointer;
      color: #777;
      transition: all 0.2s ease;
      background-color: #fafafa;
    }

    .drop-zone:hover, .drop-zone.dragging {
      border-color: #2196F3;
      background-color: #e3f2fd;
      color: #1976D2;
    }

    .file-display, .read-only-display {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 8px;
        border: 1px solid transparent; /* Keeps alignment similar to input */
    }
    
    .file-display {
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #fff;
    }

    .file-name {
      color: #2196F3;
      text-decoration: underline;
      cursor: pointer;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: 8px;
      flex-grow: 1;
    }

    .file-name:hover {
        color: #1565C0;
    }

    .delete-btn {
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      font-weight: bold;
      padding: 0 4px;
      font-size: 14px;
    }

    .delete-btn:hover {
      color: #f44336;
    }
    
    .empty-value {
        color: #999;
        font-style: italic;
    }

    /* Sizes */
    .small.editor-container {
        height: 24px;
    }
    .small .drop-zone {
      font-size: 11px;
      padding: 2px; /* Reduced to match height */
    }
    .small .file-name {
        font-size: 12px;
    }

    .medium.editor-container {
        height: 30px;
    }
    .medium .drop-zone {
      font-size: 14px;
      padding: 4px 6px; /* Reduced to match String Editor height */
    }
    .medium .file-name {
        font-size: 16px;
    }
  `]
})
export class FileEditorComponent implements IEditorComponent<File | null> {
  @Input() value: File | null = null;
  @Input() mode: EditorMode = 'read';
  @Input() size: EditorSize = 'medium';
  @Output() valueChange = new EventEmitter<File | null>();
  @Output() modeChange = new EventEmitter<EditorMode>();

  isDragging = false;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    // We always allow drag over here to ensure the drop event can fire
    // We'll filter in onDrop if needed
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
  previousValue: File | null = null;

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    // Check for variable drop
    const varData = event.dataTransfer?.getData('application/x-editor-variable');
    if (varData) {
      const variable = JSON.parse(varData);
      if (variable.type === 'file' || variable.type === 'expression') {
        this.droppedVariable = variable;
        this.previousValue = this.value; // Store
        this.mode = 'expression';
        this.modeChange.emit('expression');
      }
      return;
    }

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.setValue(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.setValue(input.files[0]);
      // Reset input value so the same file can be selected again if needed after clearing
      input.value = '';
    }
  }

  clearFile() {
    this.setValue(null);
  }

  downloadFile(event: Event) {
    event.preventDefault();
    if (!this.value) return;

    const url = URL.createObjectURL(this.value);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.value.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  onExpressionChange(newValue: string) {
    // Can't easily convert expression string back to File object
  }

  private setValue(file: File | null) {
    this.value = file;
    this.valueChange.emit(this.value);
  }
}
