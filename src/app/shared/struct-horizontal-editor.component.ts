import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BBType, BBField } from '../models/bb-types';
import { AppConfig } from '../models/app-models';
import { EditorMode, EditorSize, IEditorComponent } from './editor.interface';
import { DynamicFieldComponent } from './dynamic-field.component';
import { GenericEditorDialogComponent } from './generic-editor-dialog.component';

@Component({
    selector: 'app-struct-horizontal-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, DynamicFieldComponent, GenericEditorDialogComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="struct-horizontal-container" [style.gap.px]="gap">
        @for (field of visibleFields; track $index) {
            <div class="field-wrapper" 
                 [style.flex-basis.px]="minWidth ? minWidth : 'auto'"
                 [style.min-width.px]="minWidth" 
                 [style.max-width.px]="maxWidth">
                @if (showHeaders) {
                    <div class="field-label" [title]="field.Prompt || field.name">{{ field.Prompt || field.name }}</div>
                }
                <div class="field-editor">
                    <app-dynamic-field
                        [typeId]="getFieldType(field)"
                        [appConfig]="appConfig"
                        [value]="value[getFieldKey(field)]"
                        (valueChange)="onFieldValueChange(getFieldKey(field), $event)"
                        [mode]="mode"
                        [size]="size"
                        [settings]="fieldSettings(field)"
                        [fieldName]="getFieldKey(field)">
                    </app-dynamic-field>
                </div>
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
    .struct-horizontal-container { display: flex; flex-direction: row; align-items: flex-end; flex-wrap: wrap; }
    .field-wrapper { display: flex; flex-direction: column; flex: 1; border: 1px solid #ddd; padding: 4px; border-radius: 3px; }
    .field-label { font-weight: 600; font-size: 11px; color: #555; margin-bottom: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .field-editor { width: 100%; font-family: system-ui, -apple-system, sans-serif; font-weight: normal; color: #000; }
    .buttons-wrapper { display: flex; gap: 5px; margin-left: 10px; align-self: flex-end; margin-bottom: 2px; } 
    .action-btn { background: #eee; border: 1px solid #ccc; border-radius: 3px; padding: 4px 10px; cursor: pointer; font-size: 12px; }
    .action-btn:hover { background: #ddd; }
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
    @Output() valueChange = new EventEmitter<any>();

    visibleFields: BBField[] = [];
    buttons: any[] = [];
    gap: number = 10;
    showHeaders: boolean = false;
    minWidth: number = 0;
    maxWidth: number = 1000;

    // Modal State
    showModal = false;
    currentModalEditor = '';
    modalTitle = 'Edit Details';

    ngOnInit() {
        this.updateConfig();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['settings'] || changes['bbType']) {
            this.updateConfig();
        }
    }

    updateConfig() {
        // Gap
        this.gap = this.settings['Struct.HorzEdit.ControlGap'] ?? 10;

        // Headers
        this.showHeaders = !!this.settings['Struct.HorzEdit.ShowHeaders'];

        // Min/Max Width
        this.minWidth = this.settings['Editor.ControlMinWidth'] || 0;
        this.maxWidth = this.settings['Editor.ControlMaxWidth'] || 1000;

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
}
