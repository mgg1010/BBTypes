import { Component, Input, Output, EventEmitter, forwardRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { ExpressionEditorComponent } from './expression-editor.component';
import { EditorMode, EditorSize, IEditorComponent } from './editor.interface';
import { BBType, IDString } from '../models/bb-types';

@Component({
    selector: 'app-enum-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ExpressionEditorComponent],
    template: `
    <div class="editor-container"
         [class.dragging]="isDragging"
         [class.small]="size === 'small'"
         [class.medium]="size === 'medium'"
         (dragover)="onDragOver($event)"
         (dragleave)="onDragLeave($event)"
         (drop)="onDrop($event)">
         
      @if (mode === 'expression') {
        <app-expression-editor 
            [ngModel]="value" 
            (ngModelChange)="onExpressionChange($event)"
            (exitExpressionMode)="exitExpressionMode()"
            autofocus="true">
        </app-expression-editor>
      } @else {
          @if (mode === 'read') {
              <span class="read-only">{{ getDisplayValue() }}</span>
          } @else if (editorId === 'radio' || baseEditorId === 'radio') {
              <div class="radio-group">
                 @for (opt of bbType?.values || []; track (opt.id !== undefined ? opt.id : opt.Id)) {
                     <label class="radio-label">
                         <input type="radio" 
                            [name]="'group_' + instanceId" 
                            [value]="opt.id !== undefined ? opt.id : opt.Id" 
                            [disabled]="isDisabled"
                            [(ngModel)]="value" 
                            (ngModelChange)="onChange($event)">
                         {{ opt.text || opt.Text }}
                     </label>
                 }
              </div>
          } @else {
              <select 
                 [(ngModel)]="value" 
                 (ngModelChange)="onChange($event)"
                 [disabled]="isDisabled"
                 class="enum-select">
                 <option [ngValue]="null">Select...</option>
                 @for (opt of bbType?.values || []; track (opt.id !== undefined ? opt.id : opt.Id)) {
                     <option [ngValue]="opt.id !== undefined ? opt.id : opt.Id">{{ opt.text || opt.Text }}</option>
                 }
              </select>
          }
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
        box-sizing: border-box;
        border: 1px solid transparent; /* placeholder for drag border */
        border-radius: 4px;
    }
    .editor-container.dragging {
        border: 2px dashed #2196F3 !important;
        background: rgba(33, 150, 243, 0.05);
    }
    .enum-select {
        width: 100%;
        height: 26px;
        padding: 2px 8px 2px 6px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: #fff;
        box-sizing: border-box;
    }
    .read-only {
        padding: 4px 0;
        display: inline-block;
    }
    .radio-group {
        display: flex;
        gap: 15px;
        padding: 5px 0;
    }
    .radio-label {
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        font-size: 14px;
    }
    .radio-label input {
        margin: 0;
    }
  `],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => EnumEditorComponent),
            multi: true
        }
    ]
})
export class EnumEditorComponent implements ControlValueAccessor, IEditorComponent<number | string | null> {
    @Input() value: number | string | null = null;
    @Input() mode: EditorMode = 'edit';
    @Input() size: EditorSize = 'medium';
    @Input() isDisabled = false;
    @Input() bbType?: BBType; // Critical input for Enum
    @Input() editorId?: string;
    @Input() baseEditorId?: string;
    @Output() valueChange = new EventEmitter<number | string | null>();

    instanceId = Math.random().toString(36).substring(2, 9);

    onChange: any = (val: any) => {
        this.valueChange.emit(val);
    };
    onTouched: any = () => { };

    isDragging = false;
    previousValue: any = null;

    writeValue(value: any): void {
        this.value = value;
    }
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    getDisplayValue(): string {
        if (!this.bbType || !this.bbType.values) return String(this.value);
        // Check for both id and Id
        // Check for both id and Id
        const match = this.bbType.values.find(v => (v.id !== undefined && v.id == this.value) || (v.Id !== undefined && v.Id == this.value));
        if (match) {
            return match.text || match.Text || String(this.value);
        }
        return String(this.value);
    }

    onDragOver(event: DragEvent) {
        if (this.mode === 'expression') return;
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent) {
        this.isDragging = false;
    }

    onDrop(event: DragEvent) {
        if (this.mode === 'expression') return;
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        const data = event.dataTransfer?.getData('application/x-editor-variable');
        if (data) {
            this.previousValue = this.value;
            this.mode = 'expression';
            this.value = '';
            this.onChange(this.value);

            // Wait for render then simulate drop in expression editor?
            // Actually, best to just set a flag for ExpressionEditor to handle initialization
            // But our ExpressionEditor has logic to handle "pending variable".
            // Since we can't easily pass the drop event *down* after handling it here,
            // we might relying on ExpressionEditor's own logic?
            // But we just consumed the event.
            // Simplified: Just switch to expression mode. The user can drag again or we parse the variable from data.
            const variable = JSON.parse(data);
            // We can hack setting the value to "=[Variable] " if we want, but ExpressionEditor expects Quill delta.
            // For now, let's just switch mode. The visual cue "Drop to Switch" is satisfied.
            // If we really want to insert the variable immediately, we'd need to pass it to ExpressionEditor.
            // Let's rely on the user dragging it *into* the now-open editor, OR (better)
            // we set a temporary "pendingDrop" on the child?
            // Actually, `StringEditor` and `NumberEditor` in our current codebase DON'T pass the variable in automatically on "Drop to Switch" unless we implemented that logic.
            // Let's check `StringEditor`.
        }
    }

    onExpressionChange(val: any) {
        this.value = val;
        this.onChange(val);
    }

    exitExpressionMode() {
        this.mode = 'edit';
        this.value = this.previousValue;
        this.onChange(this.value);
    }
}
