import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BBType, BBSettingDefinition } from '../../models/bb-types';
import { AppConfig } from '../../models/app-models';
import { DynamicFieldComponent } from '../../shared/dynamic-field.component';
import { BBTypeService } from '../../services/bb-type.service';

interface SettingRow {
    name: string;
    id: string;
    value: any;
    definition: BBSettingDefinition;
    isOverride: boolean;
}

interface SettingSection {
    title: string;
    rows: SettingRow[];
}

@Component({
    selector: 'app-show-all-properties-dialog',
    standalone: true,
    imports: [CommonModule, DynamicFieldComponent],
    template: `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>All Settings: {{ type.name }}</h3>
          <button class="close-btn" (click)="cancel.emit()">✕</button>
        </div>
        
        <div class="modal-body">
            @for (section of sections; track section.title) {
                @if (section.rows.length > 0) {
                    <div class="section-header">{{ section.title }}</div>
                    <table class="settings-table">
                        <thead>
                            <tr>
                                <th style="width: 30%">Setting Name</th>
                                <th style="width: 30%">Setting ID</th>
                                <th style="width: 40%">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (row of section.rows; track row.id) {
                                <tr>
                                    <td>
                                        {{ row.name }}
                                        @if (row.definition.readOnly) {
                                            <span class="setting-flag" title="Read-only setting">RO</span>
                                        }
                                        @if (row.definition.inputOutput === 1) {
                                            <span class="setting-flag output-flag" title="Output (calculated) setting">Out</span>
                                        }
                                    </td>
                                    <td class="id-col">{{ row.id }}</td>
                                    <td>
                                        <app-dynamic-field
                                            [typeId]="row.definition.typeId"
                                            [subtypeId]="row.definition.subtypeId"
                                            [appConfig]="appConfig"
                                            [value]="row.value"
                                            [mode]="'edit'"
                                            [isDisabled]="true"
                                            [size]="'small'">
                                        </app-dynamic-field>
                                        <span *ngIf="!row.isOverride" class="inherited-label">(Default)</span>
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                }
            }
        </div>
        
        <div class="modal-footer">
          <button class="primary-btn" (click)="cancel.emit()">Close</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .modal-content { background: white; width: 900px; max-width: 95%; height: 85%; display: flex; flex-direction: column; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .modal-header { padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; }
    .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; }
    
    .modal-body { flex: 1; overflow-y: auto; padding: 20px; }
    .modal-footer { padding: 15px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; }
    
    .section-header { 
        background: #e0e0e0; 
        padding: 8px 15px; 
        font-weight: bold; 
        margin-top: 20px; 
        margin-bottom: 5px; 
        border-radius: 4px;
        color: #333;
    }
    .section-header:first-child { margin-top: 0; }
    
    .settings-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 10px; }
    .settings-table th { text-align: left; padding: 8px; border-bottom: 2px solid #eee; color: #666; font-size: 12px; }
    .settings-table td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; font-size: 13px; }
    
    .id-col { color: #888; font-family: monospace; font-size: 12px; }
    .inherited-label { color: #999; font-style: italic; font-size: 11px; margin-left: 8px; }
    
    .setting-flag {
        display: inline-block;
        margin-left: 6px;
        padding: 2px 6px;
        background: #e3f2fd;
        color: #1976d2;
        border-radius: 3px;
        font-size: 10px;
        font-weight: 600;
        vertical-align: middle;
    }
    .setting-flag.output-flag {
        background: #fff3e0;
        color: #f57c00;
    }
    
    .primary-btn { background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
  `]
})
export class ShowAllPropertiesDialogComponent implements OnInit {
    @Input() type!: BBType;
    @Input() baseEditor: any;
    @Input() appConfig: AppConfig | null = null;
    @Output() cancel = new EventEmitter<void>();

    sections: SettingSection[] = [];

    constructor(private bbTypeService: BBTypeService) { }

    ngOnInit() {
        this.buildSections();
    }

    buildSections() {
        this.sections = [];
        const settings = this.type.settings || {};

        // 1. Get ALL available settings (merged from type and ancestors)
        const allDefs = this.bbTypeService.getAvailableSettings(this.type);

        // 2. Custom Properties
        const customDefs = allDefs.filter(d => d.isCustom);
        this.addSection('Type Custom Properties', customDefs, settings);

        // 3. Type Settings - Global (Type.Editor)
        let typeEditorDef = allDefs.find(d => d.id === 'Type.Editor');

        // Fallback: Check if explicitly defined on type even if getAvailableSettings missed it
        if (!typeEditorDef) {
            typeEditorDef = this.type.settingDefinitions?.find(d => d.id === 'Type.Editor');
        }

        // Fallback: Check base editor
        if (!typeEditorDef && this.baseEditor) {
            typeEditorDef = (this.baseEditor.settingDefinitions || []).find((d: any) => d.id === 'Type.Editor');
        }

        // Fallback: Check published editors
        if (!typeEditorDef && this.type.editors) {
            for (const ed of this.type.editors) {
                typeEditorDef = ed.settingDefinitions?.find(d => d.id === 'Type.Editor');
                if (typeEditorDef) break;
            }
        }

        // Clone and set default value for Type.Editor
        if (typeEditorDef) {
            typeEditorDef = { ...typeEditorDef }; // Shallow clone
            // Ensure subtypeId is set to current type so TypeEditor can find editors
            typeEditorDef.subtypeId = this.type.id;
            // Use the type's Type.Editor setting value, or fall back to first editor
            typeEditorDef.defaultValue = settings['Type.Editor'] || this.type.editors?.[0]?.id;
        }

        const globalDefs = typeEditorDef ? [typeEditorDef] : [];
        this.addSection('Type Settings - Common', globalDefs, settings);

        // 4. Split remaining Type Settings into Native (defined on this type) vs Inherited (from ancestor)
        const standardDefs = allDefs.filter(d => !d.isCustom && d.id !== 'Type.Editor');

        const nativeDefs: BBSettingDefinition[] = [];
        const inheritedDefs: BBSettingDefinition[] = [];

        standardDefs.forEach(def => {
            // Check if this setting is explicitly defined on the current type
            // We check the raw settingDefinitions array on the type object
            const isNative = this.type.settingDefinitions?.some(d => d.id === def.id);

            if (isNative) {
                nativeDefs.push(def);
            } else {
                inheritedDefs.push(def);
            }
        });

        this.addSection('Type Settings', nativeDefs, settings);
        this.addSection('Type Settings - Inherited', inheritedDefs, settings);

        // 5. Editors
        // We combine baseEditor (inherited) and custom editors
        const editors: any[] = [];
        // Only include base editor if the type actually has a base type
        if (this.baseEditor && this.type.baseType !== null) {
            editors.push({ ...this.baseEditor, isInherited: true });
        }

        if (this.type.editors) {
            this.type.editors.forEach(e => {
                // Avoid duplicates if base editor is also in list
                if (!editors.find(ed => ed.id === e.id)) {
                    editors.push({ ...e, isInherited: false });
                }
            });
        }

        editors.forEach(editor => {
            const defs = (editor.settingDefinitions as BBSettingDefinition[]) || [];
            // Filter out type-level settings (Type.Editor, Type.Kind) that shouldn't appear in editor settings
            const editorDefs = defs.filter(d => d.id !== 'Type.Editor' && d.id !== 'Type.Kind');

            const name = editor.name || editor.id;
            const title = editor.isInherited ? `${name} Settings (Inherited Editor)` : `${name} Settings`;

            this.addSection(title, editorDefs, settings);
        });
    }

    addSection(title: string, defs: BBSettingDefinition[], settings: any, isOverrideExpected: boolean = false) {
        if (defs.length === 0) return;

        const rows: SettingRow[] = defs.map(d => {
            // Special handling for Enum.Options default value from Type.Values
            if (d.id === 'Enum.Options' && !settings[d.id] && this.type.values && this.type.values.length > 0) {
                // Clone definition to avoid mutating the original singleton
                d = { ...d };
                // Map type.values (id, text) or (Id, Text) to IDString (Id, Text)
                d.defaultValue = this.type.values.map((v: any) => ({
                    Id: v.Id !== undefined ? v.Id : v.id,
                    Text: v.Text !== undefined ? v.Text : v.text
                }));
            }

            // Special handling for Type.Editors empty array -> fallback to default
            const currentValue = settings[d.id];
            // If explicit value is empty array, we prefer to show the default (system editors), unless explicit intent?
            // User can't really 'delete' system editors easily without the UI being smart.
            // But if we just ignore empty arrays, it will fallback to d.defaultValue.

            let displayValue = settings[d.id];

            if (d.id === 'Type.Editors' && Array.isArray(displayValue) && displayValue.length === 0) {
                displayValue = undefined; // Force fallback to defaultValue
            }
            // Same for Enum.Options?
            if (d.id === 'Enum.Options' && Array.isArray(displayValue) && displayValue.length === 0) {
                displayValue = undefined;
            }

            return {
                name: d.name,
                id: d.id,
                definition: d,
                value: displayValue !== undefined ? displayValue : d.defaultValue,
                isOverride: displayValue !== undefined
            };
        });

        this.sections.push({ title, rows });
    }
}
