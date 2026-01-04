import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BBType, BBField } from '../models/bb-types';
import { AppConfig } from '../models/app-models';
import { EditorMode, EditorSize, IEditorComponent } from './editor.interface';
import { BBTypeService } from '../services/bb-type.service';
import { DynamicFieldComponent } from './dynamic-field.component';

@Component({
    selector: 'app-struct-vertical-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, DynamicFieldComponent],
    template: `
    <div class="struct-vertical-container" 
         [class.bordered]="size === 'medium'"
         [class.prompt-above]="promptPosition === 'above'"
         [class.prompt-left]="promptPosition === 'left'"
         [class.prompt-inside]="promptPosition === 'inside'"
         [style.--prompt-gap]="promptGapPx + 'px'"
         [style.--prompt-align]="promptAlign">
      @if (bbType?.baseType === 'Union') {
         <!-- Union Logic: Pick one field -->
         <div class="union-selector">
            <select [(ngModel)]="activeUnionField" (change)="onUnionChange()">
                <option [ngValue]="null">Select Type...</option>
                @for (field of bbType?.fields || []; track field.name) {
                    <option [ngValue]="field">{{ field.name }}</option>
                }
            </select>
         </div>
         
         @if (activeUnionField) {
            <div class="field-group">
                <label #fieldLabel class="field-label">{{ activeUnionField.name }}:</label>
                <div class="field-editor">
                    <app-dynamic-field
                        [typeId]="activeUnionField.typeId"
                        [appConfig]="appConfig"
                        [value]="value[activeUnionField.name]"
                        (valueChange)="onFieldValueChange(activeUnionField.name, $event)"
                        [mode]="mode"
                        [size]="size"
                        [isDisabled]="isDisabled"
                        [settings]="settings"
                        [fieldName]="activeUnionField.name">
                    </app-dynamic-field>
                </div>
            </div>
         }
      } @else {
         <!-- Struct Logic: Show all fields vertically -->
         @if (fields.length === 0) {
            <div class="empty-struct-message">No fields defined for this struct.</div>
         }
         @for (field of fields; track field.name) {
            <div class="field-group">
                <label #fieldLabel class="field-label">{{ field.name }}:</label>
                <div class="field-editor">
                     <app-dynamic-field
                        [typeId]="field.typeId"
                        [appConfig]="appConfig"
                        [value]="value[field.name]"
                        (valueChange)="onFieldValueChange(field.name, $event)"
                        [mode]="mode"
                        [size]="size"
                        [isDisabled]="isDisabled"
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
    
    .struct-vertical-container {
        display: flex;
        flex-direction: column;
        gap: 0px;
    }
    
    .struct-vertical-container.bordered {
        border: 1px solid #eee;
        padding: 10px;
        border-radius: 4px;
        background: #fafafa;
    }
    
    /* Prompt Position: ABOVE */
    .struct-vertical-container.prompt-above .field-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    
    .struct-vertical-container.prompt-above .field-label {
        text-align: left;
        padding-left: 0;
        font-weight: 500;
        color: #555;
        font-size: 13px;
    }
    
    .struct-vertical-container.prompt-above .field-editor {
        width: 100%;
    }
    
    /* Prompt Position: LEFT */
    .struct-vertical-container.prompt-left .field-group {
        display: flex;
        flex-direction: row;
        align-items: start;
        gap: 5px; /* Gap between prompt area and editor */
    }
    
    .struct-vertical-container.prompt-left .field-label {
        flex-shrink: 0;
        margin-left: 10px; /* 10px from left edge */
        width: var(--prompt-gap, 120px);
        text-align: var(--prompt-align, right);
        padding-top: 6px; /* Align with input text */
        font-weight: 500;
        color: #555;
        font-size: 13px;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }
    
    .struct-vertical-container.prompt-left .field-editor {
        flex: 1;
        min-width: 0; /* Allow shrinking */
    }
    
    .union-selector, .empty-struct-message { 
        margin-bottom: 0;
    }
    
    .empty-struct-message { 
        padding: 10px; 
        color: #999; 
        font-style: italic; 
        text-align: center; 
    }
  `]
})
export class StructVerticalEditorComponent implements IEditorComponent<any>, OnInit, AfterViewInit {
    @ViewChildren('fieldLabel') fieldLabels!: QueryList<ElementRef>;

    private _value: any = {};
    @Input()
    set value(v: any) {
        this._value = v || {};
    }
    get value() { return this._value; }

    @Input() mode: EditorMode = 'edit';
    @Input() size: EditorSize = 'medium';
    @Input() isDisabled: boolean = false;
    @Input() bbType?: BBType = undefined;
    @Input() appConfig: AppConfig | null = null;
    @Input() settings: Record<string, any> = {};
    @Output() valueChange = new EventEmitter<any>();

    activeUnionField: BBField | null = null;

    // Calculated layout properties
    promptPosition: 'above' | 'left' | 'inside' = 'left';
    promptAlign: 'left' | 'right' = 'right';
    promptGapPx: number = 120; // Default

    // Get fields from settings (modern) or bbType.fields (legacy)
    get fields(): BBField[] {
        return this.settings['Struct.Fields'] || this.bbType?.fields || [];
    }

    constructor(private bbTypeService: BBTypeService) { }

    ngOnInit() {
        // Read settings
        const posSetting = this.settings['Struct.VertEdit.PromptPosition'];
        if (posSetting === 1 || posSetting === 'above') this.promptPosition = 'above';
        else if (posSetting === 2 || posSetting === 'inside') this.promptPosition = 'inside';
        else this.promptPosition = 'left'; // Default (0 or 'left')

        const alignSetting = this.settings['Struct.VertEdit.PromptAlign'];
        if (alignSetting === 0 || alignSetting === 'left') this.promptAlign = 'left';
        else this.promptAlign = 'right'; // Default (1 or 'right')

        // Calculate prompt gap (only relevant for 'left' position)
        if (this.promptPosition === 'left') {
            this.calculatePromptGap();
        }

        // Restore union state if value exists
        if (this.bbType?.baseType === 'Union' && this.value) {
            const keys = Object.keys(this.value);
            if (keys.length > 0) {
                this.activeUnionField = this.bbType.fields?.find(f => f.name === keys[0]) || null;
            }
        }
    }

    ngAfterViewInit() {
        // Recalculate prompt gap after view renders (to measure actual label widths)
        if (this.promptPosition === 'left') {
            setTimeout(() => this.calculatePromptGap(), 0);
        }
    }

    calculatePromptGap() {
        const promptMinSpace = this.settings['Struct.VertEdit.PromptMinSpace'] || 0;
        const promptMaxSpace = this.settings['Struct.VertEdit.PromptMaxSpace'] || 1000;

        // Measure max prompt size
        let maxPromptSize = 0;

        if (this.fieldLabels && this.fieldLabels.length > 0) {
            // Measure actual rendered label widths
            this.fieldLabels.forEach(labelRef => {
                const width = labelRef.nativeElement.scrollWidth;
                if (width > maxPromptSize) {
                    maxPromptSize = width;
                }
            });
        } else {
            // Fallback: estimate based on text length (12px per character average)
            const fields = this.bbType?.fields || [];
            const maxChars = Math.max(...fields.map(f => f.name.length), 0);
            maxPromptSize = maxChars * 12;
        }

        // Apply the algorithm:
        // PromptGap = Min(Max(MaxPromptSize, PromptMinSize), PromptMaxSize)
        const effectiveMaxSpace = promptMaxSpace || 1000;
        this.promptGapPx = Math.min(
            Math.max(maxPromptSize, promptMinSpace),
            effectiveMaxSpace
        );
    }

    onFieldValueChange(fieldName: string, newValue: any) {
        this.value = { ...this.value, [fieldName]: newValue };
        this.valueChange.emit(this.value);
    }

    onUnionChange() {
        // Clear value when switching union type
        this.value = {};
        this.valueChange.emit(this.value);
    }
}
