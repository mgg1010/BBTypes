import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IEditorComponent, EditorMode, EditorSize } from './editor.interface';
import { ExpressionEditorComponent } from './expression-editor.component';

@Component({
  selector: 'app-string-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ExpressionEditorComponent],
  template: `
    <div 
        class="editor-container" 
        [ngClass]="[size, isDragging ? 'dragging' : '']"
        [style.font-family]="settings['Editor.StdFont'] || 'system-ui, -apple-system, sans-serif'"
        [style.font-size]="settings['Editor.StdFontSize'] || '13px'"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)">
      @if (mode === 'edit') {
        <input 
          type="text" 
          [value]="value !== null && value !== undefined ? value : ''" 
          (input)="onInput($event)"
          [disabled]="isDisabled"
          class="editor-input"
          [class.invalid]="error"
        />
        @if (error) {
            <div class="error-msg">{{ error }}</div>
        }
      } @else if (mode === 'expression') {
          <app-expression-editor 
            [value]="value" 
            (valueChange)="onValueChange($event)"
            [size]="size"
            [pendingVariable]="droppedVariable"
            (exitExpressionMode)="value = previousValue; valueChange.emit(value); mode = 'edit'; modeChange.emit('edit')">
          </app-expression-editor>
      } @else {
        <span class="editor-value">{{ displayValue || '(empty)' }}</span>
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
      color: #333;
    }

    /* Sizes */
    .small.editor-container {
        /* height: 24px; */
    }
    .small .editor-input {
      font-size: var(--font-size-base);
      padding: 2px 4px;
    }
    .small .editor-value {
      font-size: var(--font-size-base);
    }

    .medium.editor-container {
        /* height: 30px; */
    }
    .medium .editor-input {
      font-size: var(--font-size-lg);
      padding: 4px 8px;
    }
    .medium .editor-value {
      font-size: var(--font-size-lg);
    }
  `]
})
export class StringEditorComponent implements IEditorComponent<string>, OnInit {
  @Input() value: string = '';
  @Input() mode: EditorMode = 'read';
  @Input() size: EditorSize = 'medium';
  @Input() isDisabled = false;
  @Input() settings: Record<string, any> = {};
  @Output() valueChange = new EventEmitter<string>();
  @Output() modeChange = new EventEmitter<EditorMode>();

  error: string | null = null;
  isDragging = false;
  droppedVariable: any = null;
  previousValue: string = '';

  ngOnInit() {
    this.validate(this.value);
  }

  get displayValue(): string {
    const settingVal = this.settings['String.UpperCase'];
    const isUpperCase = settingVal === true || settingVal === 'true' || settingVal === 1 || settingVal === '1';
    return isUpperCase ? (this.value?.toUpperCase() || '') : this.value;
  }

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let newValue = input.value;

    // Check settings
    // Handle boolean true/false, string 'true'/'false', and number 1/0
    const settingVal = this.settings['String.UpperCase'];
    const isUpperCase = settingVal === true || settingVal === 'true' || settingVal === 1 || settingVal === '1';
    if (isUpperCase) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      newValue = newValue.toUpperCase();
      input.value = newValue;
      // Restore cursor position (simple approach)
      if (start !== null && end !== null) {
        input.setSelectionRange(start, end);
      }
    }

    this.value = newValue;
    this.validate(newValue);
    this.valueChange.emit(newValue);
  }

  // Kept for compatibility if called externally, but template uses onInput now
  onValueChange(newValue: string) {
    // ... existing logic redirected
    this.value = newValue;
    this.validate(newValue);
    this.valueChange.emit(newValue);
  }

  private validate(val: string) {
    this.error = null;
    if (val === null || val === undefined) return;

    // 1. Max Length
    const maxLen = this.settings['String.MaxLen'];
    if (maxLen !== undefined && val.length > maxLen) {
      let msg = this.settings['String.MaxLenMsg'] || 'Must be %d characters or less';
      this.error = msg.replace('%d', maxLen.toString());
      return;
    }

    // 2. Min Length
    const minLen = this.settings['String.MinLen'];
    if (minLen !== undefined && val.length < minLen) {
      let msg = this.settings['String.MinLenMsg'] || 'Must be %d characters or more';
      this.error = msg.replace('%d', minLen.toString());
      return;
    }

    // 3. Validation Rules (Regex)
    const rules = this.settings['String.ValidationRules'];
    if (Array.isArray(rules)) {
      for (const rule of rules) {
        if (rule.Regexp) {
          try {
            const regex = new RegExp(rule.Regexp);
            if (!regex.test(val)) {
              this.error = rule.ErrMsg || 'Invalid format';
              return;
            }
          } catch (e) {
            console.error('Invalid regex in validation rule', rule.Regexp);
          }
        }
      }
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
      if (variable.type === 'string' || variable.type === 'expression') {
        this.droppedVariable = variable;
        this.previousValue = this.value;
        this.value = '';
        this.valueChange.emit(this.value);
        this.mode = 'expression';
        this.modeChange.emit('expression');
      }
    }
  }
}
