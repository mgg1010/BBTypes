import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BBType, BBField } from '../models/bb-types';
import { AppConfig } from '../models/app-models';
import { EditorMode, EditorSize, IEditorComponent } from './editor.interface';
import { BBTypeService } from '../services/bb-type.service';
import { DynamicFieldComponent } from './dynamic-field.component';

@Component({
    selector: 'app-struct-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, DynamicFieldComponent],
    template: `
    <div class="struct-container" [class.bordered]="size === 'medium'">
      @if (bbType?.baseType === 'Union') {
         <!-- Union Logic: Pick one field -->
         <div class="union-selector">
            <select [(ngModel)]="activeUnionField" (change)="onUnionChange()">
                <option [ngValue]="null">Select Type...</option>
                @for (field of bbType?.fields || []; track $index) {
                    <option [ngValue]="field">{{ field.name }}</option>
                }
            </select>
         </div>
         
         @if (activeUnionField) {
            <div class="field-row">
                <app-dynamic-field
                    [typeId]="activeUnionField.typeId"
                    [appConfig]="appConfig"
                    [value]="value[activeUnionField.name]"
                    (valueChange)="onFieldValueChange(activeUnionField.name, $event)"
                    [mode]="mode"
                    [size]="size"
                    [settings]="settings"
                    [fieldName]="activeUnionField.name">
                </app-dynamic-field>
            </div>
         }
      } @else {
         <!-- Struct Logic: Show all fields -->
         @if ((bbType?.fields?.length || 0) === 0) {
            <div class="empty-struct-message">No fields defined for this struct.</div>
         }
         @for (field of bbType?.fields || []; track $index) {
            <div class="field-wrapper">
                <label class="field-label">{{ field.name }}:</label>
                <div class="field-editor">
                     <app-dynamic-field
                        [typeId]="field.typeId"
                        [appConfig]="appConfig"
                        [value]="value[field.name]"
                        (valueChange)="onFieldValueChange(field.name, $event)"
                        [mode]="mode"
                        [size]="size"
                        [settings]="settings"
                        [fieldName]="field.name">
                    </app-dynamic-field>
                </div>
            </div>
         }
      }
    </div>
  `,
    styles: [`
    :host { display: block; width: 100%; }
    .struct-container {
        display: grid;
        grid-template-columns: max-content 1fr; /* Shared column widths */
        gap: 10px; /* Row and Col gap */
        align-items: start;
    }
    .struct-container.bordered {
        border: 1px solid #eee;
        padding: 10px;
        border-radius: 4px;
        background: #fafafa;
    }
    .field-wrapper {
        display: contents; /* Flatten children into parent grid */
    }
    .field-label {
        /* width auto */
        /* font-size: 13px; use global */
        font-weight: 500;
        color: #555;
        padding-top: 6px; /* align with input text */
        text-align: right;
    }
    .field-editor {
        min-width: 0; /* Allow shrinking to fit container */
    }
    .field-input {
        width: 100%;
        max-width: 100%;
        padding: 6px;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
    }
    .union-selector, .empty-struct-message { 
        grid-column: 1 / -1; /* Span full width */
        margin-bottom: 0;
    }
    .empty-struct-message { padding: 10px; color: #999; font-style: italic; text-align: center; }
  `]
})
export class StructEditorComponent implements IEditorComponent<any> {
    private _value: any = {};
    @Input()
    set value(v: any) {
        this._value = v || {};
    }
    get value() { return this._value; }

    @Input() mode: EditorMode = 'edit';
    @Input() size: EditorSize = 'medium';
    @Input() bbType?: BBType = undefined;
    @Input() appConfig: AppConfig | null = null;
    @Input() settings: Record<string, any> = {};
    @Output() valueChange = new EventEmitter<any>();

    activeUnionField: BBField | null = null;

    constructor(private bbTypeService: BBTypeService) { }

    ngOnInit() {
        // value init handled by setter

        // Restore union state if value exists
        if (this.bbType?.baseType === 'Union' && this.value) {
            // Find which key exists directly?
            // Heuristic: valid key
            const keys = Object.keys(this.value);
            if (keys.length > 0) {
                this.activeUnionField = this.bbType.fields?.find(f => f.name === keys[0]) || null;
            }
        }
    }


    onFieldValueChange(fieldName: string, newValue: any) {
        // val param guaranteed to be object by setter
        this.value = { ...this.value, [fieldName]: newValue };
        this.valueChange.emit(this.value);
    }

    onUnionChange() {
        // Clear value when switching union type?
        this.value = {};
        // In a real app we might preserve data if compatible
    }
}
