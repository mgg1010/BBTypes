import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BBType, BBField } from '../models/bb-types';
import { AppConfig } from '../models/app-models';
import { EditorMode, EditorSize, IEditorComponent } from './editor.interface';
import { DynamicFieldComponent } from './dynamic-field.component';
import { GenericEditorDialogComponent } from './generic-editor-dialog.component';
import { calculateControlWidth } from '../bb-types/layout-helpers';
import { BBTypeService } from '../services/bb-type.service';

@Component({
    selector: 'app-struct-horizontal-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, DynamicFieldComponent, GenericEditorDialogComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="struct-horizontal-container" 
         [style.gap.px]="gap"
         [style.--std-font]="stdFont"
         [style.--std-font-size]="stdFontSize">
        
        <!-- Header Row -->
        @if (showHeaders) {
            <div class="header-row" [style.gap.px]="gap">
                @for (cell of headerCells; track cell.label) {
                    <div class="header-cell" 
                         [style.flex-basis.px]="cell.minWidth"
                         [style.min-width.px]="cell.minWidth" 
                         [style.max-width.px]="cell.maxWidth"
                         [style.flex-grow]="cell.flexGrow"
                         [title]="cell.label">
                        {{ cell.label }}
                    </div>
                }
                @if (buttons.length > 0) {
                    <div class="header-spacer"></div>
                }
            </div>
        }
        
        <!-- Data Row (hidden when showHeaders is true) -->
        @if (!showHeaders) {
            <div class="data-row" [style.gap.px]="gap">
                @for (field of visibleFields; track getFieldKey(field)) {
                    <div class="field-wrapper" 
                         [style.flex-basis.px]="getFieldMinWidth(field)"
                         [style.min-width.px]="getFieldMinWidth(field)" 
                         [style.max-width.px]="getFieldMaxWidth(field)"
                         [style.flex-grow]="getFieldFlexGrow(field)">
                        <div class="field-editor">
                            <app-dynamic-field
                                [typeId]="getFieldType(field)"
                                [appConfig]="appConfig"
                                [value]="value[getFieldKey(field)]"
                                (valueChange)="onFieldValueChange(getFieldKey(field), $event)"
                                [mode]="'edit'"
                                [size]="size"
                                [isDisabled]="isDisabled"
                                [settings]="settings"
                                [fieldName]="getFieldKey(field)">
                            </app-dynamic-field>
                        </div>
                        <!-- <div class="width-debug">
                            {{ getFieldMinWidth(field) }} - {{ getFieldMaxWidth(field) }}
                        </div> -->
                    </div>
                }
            </div>
        }
        
        @if (buttons.length > 0) {
            <div class="buttons-wrapper">
                 @for (btn of buttons; track $index) {
                     <button class="action-btn" (click)="onButtonClick(btn)">{{ btn.ButtonText }}</button>
                 }
            </div>
        }

        @if (showModal && bbType) {
            <app-generic-editor-dialog
                [title]="modalTitle"
                [typeId]="bbType.id"
                [editorId]="currentModalEditor"
                [value]="value"
                [appConfig]="appConfig"
                (save)="saveModal($event)"
                (cancel)="closeModal()">
            </app-generic-editor-dialog>
        }
    </div>
  `,
    styles: [`
    :host { display: block; width: 100%; }
    .struct-horizontal-container { display: flex; flex-direction: column; width: 100%; }
    
    /* Header Row */
    .header-row { 
        display: flex; 
        flex-direction: row; 
        gap: 10px; 
        min-height: 18px;
        height: auto;
        align-items: flex-end;
        padding: 0;
        margin-bottom: 2px;
        background: transparent;
        border: none;
        overflow: visible;
    }
    .header-cell { 
        flex: 1; 
        font-weight: 600; 
        font-size: 10px; 
        color: #666; 
        text-align: left;
        overflow: visible; 
        white-space: nowrap; 
        text-overflow: clip;
        padding: 0 4px;
        line-height: 16px;
        height: auto;
        box-sizing: border-box;
    }
    .header-spacer { width: 80px; flex-shrink: 0; } /* Matches buttons-wrapper width */
    
    /* Data Row */
    .data-row { display: flex; flex-direction: row; }
    .field-wrapper { 
        display: flex; 
        flex-direction: column; 
        flex: 1; 
        /* border: 1px solid #ddd; */
        padding: 4px; 
        border-radius: 3px;
        box-sizing: border-box;
    }
    .field-label { font-weight: 600; font-size: 11px; color: #555; margin-bottom: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .field-editor { width: 100%; }
    
    .buttons-wrapper { display: flex; gap: 5px; margin-left: 10px; align-self: flex-end; margin-bottom: 2px; } 
    .action-btn { background: #eee; border: 1px solid #ccc; border-radius: 3px; padding: 4px 10px; cursor: pointer; font-size: 12px; }
    .action-btn:hover { background: #ddd; }
    
    .width-debug { font-size: 8px; color: #999; text-align: center; margin-top: 2px; }
  `]
})
export class StructHorizontalEditorComponent implements IEditorComponent<any>, OnInit, OnChanges {
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
    @Input() isDisabled: boolean = false;
    @Output() valueChange = new EventEmitter<any>();

    visibleFields: BBField[] = [];
    headerCells: Array<{ field: BBField; minWidth: number; maxWidth: number; flexGrow: number; label: string }> = [];
    buttons: any[] = [];
    gap: number = 10;
    showHeaders: boolean = false;
    minWidth: number = 0;
    maxWidth: number = 1000;
    private fieldWidthCache = new Map<string, { min: number; max: number }>();
    stdFont: string = 'system-ui, -apple-system, sans-serif';
    stdFontSize: string = '13px';

    // Modal State
    showModal = false;
    currentModalEditor = '';
    modalTitle = 'Edit Details';

    ngOnInit() {
        this.updateConfig();
    }

    ngOnChanges(changes: SimpleChanges) {
        this.updateLayout();
    }

    updateLayout() {
        this.updateConfig();
    }

    updateConfig() {
        // Gap
        this.gap = this.settings['Struct.HorzEdit.Gap'] ?? 10;

        // Headers
        this.showHeaders = !!this.settings['Struct.HorzEdit.ShowHeaders'];

        // Min/Max Width
        this.minWidth = this.settings['Editor.ControlMinWidth'] || 0;
        this.maxWidth = this.settings['Editor.ControlMaxWidth'] || 1000;

        // Font Settings
        this.stdFont = this.settings['Editor.StdFont'] || 'system-ui, -apple-system, sans-serif';
        this.stdFontSize = this.settings['Editor.StdFontSize'] || '13px';

        // Buttons
        this.buttons = this.settings['Struct.HorzEdit.Buttons'] || [];

        // Visible Fields (ShowGroup logic)
        // Get fields from settings (modern) or bbType.fields (legacy)
        const allFields = this.settings['Struct.Fields'] || this.bbType?.fields || [];
        const groupNumber = this.settings['Struct.HorzEdit.ShowGroup'];

        // Only update if fields source changed (prevents flicker from array recreation)
        let newVisibleFields: BBField[];
        if (groupNumber !== undefined && groupNumber !== null && groupNumber !== 0) {
            // Filter by group number - match against the Group property on each field
            newVisibleFields = allFields.filter((f: any) => f.Group === groupNumber);
        } else {
            // Show all fields if no group filter
            newVisibleFields = allFields;
        }

        // Only assign if actually changed to prevent unnecessary re-renders
        if (JSON.stringify(newVisibleFields) !== JSON.stringify(this.visibleFields)) {
            this.visibleFields = newVisibleFields;
            // Clear width cache when fields change
            this.fieldWidthCache.clear();
            // Pre-compute header cell styles to prevent template method calls
            this.headerCells = this.visibleFields.map(field => {
                const widths = this.calculateFieldWidth(field);
                return {
                    field,
                    minWidth: widths.min,
                    maxWidth: widths.max,
                    flexGrow: widths.max > widths.min * 1.5 ? 1 : 0,
                    label: field.Prompt || field.name || ''
                };
            });
        }
    }

    fieldSettings(field: BBField) {
        return field.settings || {};
    }

    // TEMPORARY: Support both old (name/typeId) and new (FieldID/TypeID) format during migration
    // TODO: Remove after all types migrated to new format
    getFieldKey(field: any): string {
        return field.FieldID || field.name || '';
    }

    getFieldType(field: any): string {
        return field.TypeID || field.typeId || '';
    }

    onFieldValueChange(fieldName: string, newValue: any) {
        this.value = { ...this.value, [fieldName]: newValue };
        this.valueChange.emit(this.value);
    }

    onButtonClick(btn: any) {
        const action = btn.ButtonAction; // 0=Modal, 1=Web
        const param = btn.ButtonParam;

        if (action === 1 || action === 'OpenWebPage') {
            window.open(param, '_blank');
        } else if (action === 0 || action === 'ModalEdit') {
            this.currentModalEditor = param; // Pass the editor name/id from ButtonParam
            this.modalTitle = btn.ButtonText || 'Edit Details';
            this.showModal = true;
        }
    }

    closeModal() {
        this.showModal = false;
        this.currentModalEditor = '';
    }

    saveModal(newValue: any) {
        this.value = newValue; // Update full value from modal
        this.valueChange.emit(this.value);
        this.closeModal();
    }

    getFieldMinWidth(field: any): number {
        const widths = this.calculateFieldWidth(field);
        return widths.min;
    }

    getFieldMaxWidth(field: any): number {
        const widths = this.calculateFieldWidth(field);
        return widths.max;
    }

    getFieldFlexGrow(field: any): number {
        const minW = this.getFieldMinWidth(field);
        const maxW = this.getFieldMaxWidth(field);

        // If max is significantly larger than min, allow growth
        if (maxW > minW * 1.5) {
            return 1;
        }
        return 0;
    }

    private calculateFieldWidth(field: any): { min: number; max: number } {
        // Use cached value if available
        const fieldKey = this.getFieldKey(field);
        if (this.fieldWidthCache.has(fieldKey)) {
            return this.fieldWidthCache.get(fieldKey)!;
        }

        // Get the field's type
        const typeId = field.typeId || field.TypeID;
        if (!typeId) {
            return { min: 100, max: 1000 };
        }

        // Merge field-level settings with global settings
        const mergedSettings = {
            ...this.settings,
            ...(field.settings || {})
        };

        // Find the editor for this field's type
        const type = this.bbTypeService.getTypes().find(t => t.id === typeId);
        if (!type) {
            return { min: 100, max: 1000 };
        }

        // Get the editor (use first editor if available)
        const editor = type.editors?.[0];
        if (!editor) {
            return { min: 100, max: 1000 };
        }

        // Calculate width using the layout helper
        const result = calculateControlWidth(type, editor, mergedSettings, this.bbTypeService);

        // Cache the result
        this.fieldWidthCache.set(fieldKey, result);

        return result;
    }

    constructor(private bbTypeService: BBTypeService) { }
}
