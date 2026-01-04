import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BBField, BBType, BBEditor, BBSettingDefinition } from '../models/bb-types';
import { BBTypeService } from '../services/bb-type.service';
import { DynamicFieldComponent } from '../shared/dynamic-field.component';

@Component({
    selector: 'app-bb-type-field-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, DynamicFieldComponent],
    template: `
    <div class="editor-settings-column">
        @if (selectedField) {
            <div class="sub-tabs">
                @if (hasTypeSettings(selectedField!)) {
                    <button [class.active]="activeFieldSettingsTab === 'type'" (click)="activeFieldSettingsTab = 'type'">{{ getSystemTypeName(selectedField!.TypeID) }} Type Settings</button>
                }
                <button [class.active]="activeFieldSettingsTab === 'global'" (click)="activeFieldSettingsTab = 'global'">Global Editor Settings</button>
                <button [class.active]="activeFieldSettingsTab === 'editor'" (click)="activeFieldSettingsTab = 'editor'">Editor Settings</button>
            </div>
            <div [class.disabled-content]="isReadOnly">

            <div class="sub-tab-content">
                <!-- Type Settings (Overrides) -->
                @if (activeFieldSettingsTab === 'type') {
                    <div class="settings-list">
                        @for (def of getTypeSpecificFieldSettings(selectedField!); track def.id) {
                            <div class="field-setting-row">
                                <label>{{ def.name }}:</label>
                                <app-dynamic-field 
                                    [typeId]="def.typeId" 
                                    [subtypeId]="def.subtypeId"
                                    [value]="getFieldSetting(selectedField!, def.id)" 
                                    (valueChange)="updateFieldSetting(selectedField!, def.id, $event)">
                                </app-dynamic-field>
                            </div>
                        }
                        @if (getTypeSpecificFieldSettings(selectedField!).length === 0) {
                            <div class="info-box">No specific settings available for {{ getSystemTypeName(selectedField!.TypeID) }}.</div>
                        }
                    </div>
                }
                
                <!-- Global Settings -->
                @if (activeFieldSettingsTab === 'global') {
                        <div class="settings-list">
                            @for (def of getGlobalEditorSettings(selectedField!); track def.id) {
                                <div class="field-setting-row">
                                    <label>{{ def.name }}:</label>
                                    <app-dynamic-field 
                                        [typeId]="def.typeId" 
                                        [subtypeId]="def.subtypeId"
                                        [ngModel]="getFieldSetting(selectedField!, def.id)" 
                                        (ngModelChange)="updateFieldSetting(selectedField!, def.id, $event)">
                                    </app-dynamic-field>
                                </div>
                            }
                        </div>
                }

                <!-- Editor Settings -->
                @if (activeFieldSettingsTab === 'editor') {
                        <div class="settings-list">
                            
                            <!-- 1. Editor to use Selection -->
                            <div class="field-setting-row">
                                <label>Editor to use:</label>
                                <div class="radio-group">
                                    <label>
                                        <input type="radio" name="editor_mode"
                                            [checked]="!isUsingCustomEditor(selectedField!)" 
                                            (click)="setUseCustomEditor(selectedField!, false)"> 
                                        Default ({{ getDefaultEditorName(selectedField!.TypeID) }})
                                    </label>
                                    <label>
                                        <input type="radio" name="editor_mode"
                                            [checked]="isUsingCustomEditor(selectedField!)" 
                                            (click)="setUseCustomEditor(selectedField!, true)"> 
                                        Custom
                                    </label>
                                </div>
                            </div>

                            <!-- 2. Custom Editor Dropdown -->
                            <div class="field-setting-row" [class.disabled]="!isUsingCustomEditor(selectedField!)">
                                <label>Custom Editor:</label>
                                <select 
                                    [disabled]="!isUsingCustomEditor(selectedField!)"
                                    [ngModel]="getFieldEditorId(selectedField!)" 
                                    (ngModelChange)="setFieldEditorId(selectedField!, $event)">
                                    @for (editor of getCompatibleEditors(selectedField!.TypeID); track editor.id) {
                                        <option [value]="editor.id">{{ editor.name }}</option>
                                    }
                                </select>
                            </div>

                            <hr style="border: 0; border-top: 1px dashed #ddd; margin: 15px 0;">

                            <!-- 3. View Settings For Dropdown -->
                            <div class="field-setting-row">
                                <label>View Settings for:</label>
                                <select [(ngModel)]="viewSettingsEditorId">
                                    <option value="default">Default ({{ getDefaultEditorName(selectedField!.TypeID) }})</option>
                                    @for (editor of getCompatibleEditors(selectedField!.TypeID); track editor.id) {
                                        @if (editor.id !== 'default') {
                                            <option [value]="editor.id">{{ editor.name }}</option>
                                        }
                                    }
                                </select>
                            </div>

                            <h5 style="margin: 15px 0 10px 0; color: #666; font-size: 12px; border-bottom: 1px solid #eee; padding-bottom: 5px; display: none;"> <!-- Hidden header -->
                                Configuration for {{ getEditorName(selectedField!.TypeID, viewSettingsEditorId) }}
                            </h5>
                            
                            <!-- 4. Specific Settings for viewed editor -->
                            @for (def of getSettingsForEditor(selectedField!, viewSettingsEditorId); track def.id) {
                                <div class="field-setting-row">
                                    <label>{{ def.name }}:</label>
                                    <app-dynamic-field 
                                        [typeId]="def.typeId" 
                                        [subtypeId]="def.subtypeId"
                                        [ngModel]="getFieldSetting(selectedField!, def.id)" 
                                        (ngModelChange)="updateFieldSetting(selectedField!, def.id, $event)">
                                    </app-dynamic-field>
                                </div>
                            }
                            @if (getSettingsForEditor(selectedField!, viewSettingsEditorId).length === 0) {
                                <div class="info-box">No configuration options for this editor.</div>
                            }
                        </div>
                }
            </div>
            </div>
        } @else {
            <div class="empty-selection">
                Select a field to configure its properties.
            </div>
        }
    </div>
  `,
    styles: [`
    .editor-settings-column {
      background: #f9f9f9;
      border: 1px solid #eee;
      border-radius: 4px;
      padding: 8px;
      min-height: 300px;
      min-width: 0; 
    }
    .sub-tabs { display: flex; gap: 5px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .sub-tabs button {
        padding: 4px 10px;
        font-size: 12px;
        background: #f1f1f1;
        border: 1px solid #ddd;
        border-radius: 4px;
        color: #666;
        cursor: pointer;
    }
    .sub-tabs button.active {
        background: #2196F3;
        color: white;
        border-color: #1976D2;
    }
    .sub-tab-content { padding: 5px; }
    .empty-selection, .info-box { padding: 20px; text-align: center; color: #999; font-style: italic; font-size: 13px; }
    .disabled-content { pointer-events: none; opacity: 0.7; }
    
    .field-setting-row {
        display: grid;
        grid-template-columns: 100px 1fr;
        gap: 10px;
        align-items: center;
        margin-bottom: 3px;
    }
    .field-setting-row label {
        font-size: 12px; font-weight: 500; color: #555; text-align: right; margin-right: 5px;
        white-space: nowrap;
    }
    .field-setting-row app-dynamic-field { width: 100%; }
    .field-setting-row.disabled { opacity: 0.5; pointer-events: none; }
    
    .radio-group { display: flex; flex-direction: column; gap: 5px; }
    .radio-group label { text-align: left; font-weight: normal; font-size: 13px; display: flex; gap: 5px; align-items: center; }
    .radio-group input[type="radio"] { height: 16px; width: 16px; margin: 0; }
    
    select, input {
        height: 26px; padding: 0 6px; font-size: 12px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;
    }
  `]
})
export class BBTypeFieldSettingsComponent implements OnChanges {
    @Input() selectedField: BBField | null = null;
    @Input() isReadOnly = false;
    @Input() allTypes: BBType[] = [];

    activeFieldSettingsTab: 'type' | 'global' | 'editor' = 'global';
    viewSettingsEditorId: string = 'default';

    constructor(private bbTypeService: BBTypeService) { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['selectedField']) {
            if (this.selectedField) {
                this.viewSettingsEditorId = this.getFieldEditorId(this.selectedField) || 'default';
                // Reset tab to global if type settings are empty, or default to type if available
                if (this.hasTypeSettings(this.selectedField)) {
                    this.activeFieldSettingsTab = 'type';
                } else {
                    this.activeFieldSettingsTab = 'global';
                }
            } else {
                this.viewSettingsEditorId = 'default';
            }
        }
    }

    hasTypeSettings(field: BBField): boolean {
        return this.getTypeSpecificFieldSettings(field).length > 0;
    }

    getSystemTypeName(typeId: string): string {
        if (!typeId) return 'Type';
        const type = this.allTypes.find(t => t.id === typeId);
        return type ? type.name : typeId;
    }

    getFieldSetting(field: BBField, settingId: string): any {
        return field.settings ? field.settings[settingId] : undefined;
    }

    updateFieldSetting(field: BBField, settingId: string, value: any) {
        if (!field.settings) field.settings = {};
        field.settings[settingId] = value;
    }

    // Editor & Settings Logic
    getCompatibleEditors(typeId: string): BBEditor[] {
        const type = this.allTypes.find(t => t.id === typeId);
        if (!type) {
            if (['string', 'number', 'boolean', 'date', 'file'].includes(typeId)) {
                // Core types fallback if not in array
            }
            return [];
        }

        if (type.editors && type.editors.length > 0) return type.editors;

        if (type.baseType === 'Basic' && type.subtypeId) {
            return this.getCompatibleEditors(type.subtypeId);
        }

        return this.bbTypeService.getDefaultEditorsForBase(type.baseType === 'Basic' ? 'Basic' : type.baseType, type.subtypeId);
    }

    getDefaultEditorName(typeId: string): string {
        const editors = this.getCompatibleEditors(typeId);
        const def = editors.find(e => e.id === 'default');
        return def ? def.name : 'Default';
    }

    getFieldEditorId(field: BBField): string {
        if (field.settings && field.settings['UI.Editor']) {
            return field.settings['UI.Editor'];
        }
        return '';
    }

    setFieldEditorId(field: BBField, editorId: string) {
        if (!field.settings) field.settings = {};
        field.settings['UI.Editor'] = editorId;
    }

    isUsingCustomEditor(field: BBField): boolean {
        if (!field.settings) return false;
        return Object.prototype.hasOwnProperty.call(field.settings, 'UI.Editor');
    }

    setUseCustomEditor(field: BBField, use: boolean) {
        if (!field.settings) field.settings = {};

        if (use) {
            if (!Object.prototype.hasOwnProperty.call(field.settings, 'UI.Editor')) {
                field.settings['UI.Editor'] = '';
                const editors = this.getCompatibleEditors(field.TypeID);
                field.settings['UI.Editor'] = editors.length > 0 ? editors[0].id : '';
            }
        } else {
            delete field.settings['UI.Editor'];
        }
    }

    getTypeSpecificFieldSettings(field: BBField): BBSettingDefinition[] {
        if (!field || !field.TypeID) return [];
        const type = this.allTypes.find(t => t.id === field.TypeID);
        if (!type) return [];
        const allSettings = this.bbTypeService.getAvailableSettings(type) || [];
        return allSettings.filter(s => !s.id.startsWith('UI.') && !s.id.startsWith('Editor.') && s.id !== 'Editor' && s.id !== 'editor' && s.name !== 'Editor');
    }

    getGlobalEditorSettings(field: BBField): BBSettingDefinition[] {
        return [
            { id: 'UI.ReadOnly', name: 'Read Only', typeId: 'Boolean' },
            { id: 'UI.Local', name: 'Local', typeId: 'Boolean' },
            { id: 'Editor.StdFont', name: 'Standard Font', typeId: 'font' },
            { id: 'Editor.StdFontSize', name: 'Std Font Size', typeId: 'number' }
        ] as BBSettingDefinition[];
    }

    getEditorName(typeId: string, editorId: string): string {
        const editor = this.getCompatibleEditors(typeId).find(e => e.id === editorId);
        return editor ? editor.name : editorId;
    }

    getSettingsForEditor(field: BBField, editorId: string): BBSettingDefinition[] {
        const editor = this.getCompatibleEditors(field.TypeID).find(e => e.id === editorId);
        return editor && editor.settingDefinitions ? editor.settingDefinitions : [];
    }
}
