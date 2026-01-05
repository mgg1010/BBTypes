import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BBType, BBField, BBSettingDefinition } from '../../models/bb-types';
import { BBTypeService } from '../../services/bb-type.service';
import { AppConfig } from '../../models/app-models';
import { BBTypeFieldListComponent } from '../bb-type-field-list.component';
import { DynamicFieldComponent } from '../../shared/dynamic-field.component';

// Mock Data for "Available Settings" (will be expanded)


@Component({
    selector: 'app-add-setting-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, DynamicFieldComponent],
    template: `
    <div class="modal-overlay">
        <div class="modal-content setting-dialog">
            <div class="modal-header">
                <h3>Add Setting</h3>
                <button class="close-btn" (click)="cancel.emit()">✕</button>
            </div>
            
            <div class="dialog-tabs">
                <button [class.active]="activeTab === 'base'" (click)="activeTab = 'base'">Base Settings</button>
                <button [class.active]="activeTab === 'field'" (click)="activeTab = 'field'">Field Settings</button>
            </div>

            <div class="dialog-body">
                @if (activeTab === 'base') {
                    <div class="settings-list">
                         <h4>Settings for {{ baseTypeName }}</h4>
                         @for (setting of availableBaseSettings; track setting.id) {
                            <div class="setting-row" [class.disabled]="isSettingAdded(setting.id)">
                                 <div class="setting-info">
                                     <span class="setting-name">{{ setting.name }}</span>
                                     <span class="setting-id">{{ setting.id }}</span>
                                 </div>
                                 @if (isSettingAdded(setting.id)) {
                                     <span class="already-added">Already In Settings List</span>
                                 }
                                 <button class="add-btn small" (click)="selectSetting(setting)" [disabled]="isSettingAdded(setting.id)">+</button>
                            </div>
                         }
                         @if (availableBaseSettings.length === 0) {
                             <div class="empty">No base settings available.</div>
                         }
                    </div>
                }

                @if (activeTab === 'field') {
                    <div class="filters">
                         <label>
                             Field:
                             <select [ngModel]="selectedField" (ngModelChange)="onFieldChange($event)">
                                 <option value="*">All Fields</option>
                                 @for (f of currentType?.fields; track f.name) {
                                     <option [value]="f.name">{{ f.name }}</option>
                                 }
                             </select>
                         </label>
                         <label>
                             Type:
                             <select [(ngModel)]="selectedType" [disabled]="typeDisabled">

                                 @for (typeId of availableFieldTypes; track typeId) {
                                     <option [value]="typeId">{{ typeId | titlecase }}</option>
                                 }
                             </select>
                         </label>
                    </div>
                    
                    <div class="settings-list">
                         @for (setting of filteredFieldSettings; track setting.id) {
                            <div class="setting-row" [class.disabled]="isSettingAdded(setting.id)">
                                 <div class="setting-info">
                                     <span class="setting-name">{{ setting.name }}</span>
                                     <span class="setting-id">{{ setting.id }}</span>
                                 </div>
                                 
                                 <div class="setting-default">
                                     @if (isSettingAdded(setting.id)) {
                                         <span class="already-added">Already In Settings List</span>
                                     } @else {
                                        @if (getCheckResult(setting.id) === 'multiple') {
                                           <span class="multiple-defaults">Multiple Defaults</span>
                                        } @else if (getCheckResult(setting.id) === 'single') {
                                            <div class="readonly-editor-wrapper">
                                                 <app-dynamic-field
                                                     [typeId]="setting.typeId"
                                                     [subtypeId]="setting.subtypeId"
                                                     [value]="getDefaultValue(setting.id)"
                                                     [appConfig]="appConfig"
                                                     [mode]="'edit'"
                                                     [size]="'small'"
                                                     [fieldName]="setting.name">
                                                 </app-dynamic-field>
                                                 <div class="readonly-overlay"></div>
                                             </div>
                                        }
                                     }
                                 </div>

                                 <button class="add-btn small" (click)="selectSetting(setting, true)" [disabled]="isSettingAdded(setting.id)" style="margin-left: 10px;">+</button>
                             </div>
                         }
                         @if (filteredFieldSettings.length === 0) {
                             <div class="empty">No settings available for this type.</div>
                         }
                    </div>
                }
            </div>
        </div>
    </div>
  `,
    styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center; }
    .setting-dialog { width: 600px; background: white; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; max-height: 80vh; }
    .modal-header { padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #f5f5f5; }
    .modal-header h3 { margin: 0; }
    .close-btn { border: none; background: none; font-size: 20px; cursor: pointer; }
    
    .dialog-tabs { display: flex; border-bottom: 1px solid #eee; background: #fafafa; }
    .dialog-tabs button { flex: 1; padding: 10px; border: none; background: none; cursor: pointer; font-weight: 600; color: #666; }
    .dialog-tabs button.active { border-bottom: 2px solid #2196F3; color: #2196F3; background: white; }

    .dialog-body { padding: 20px; overflow-y: auto; flex: 1; }
    
    .filters { display: flex; gap: 15px; margin-bottom: 20px; background: #f9f9f9; padding: 10px; border-radius: 4px; }
    .filters label { display: flex; flex-direction: column; font-size: 12px; font-weight: bold; flex: 1; }
    .filters select { margin-top: 5px; padding: 5px; border: 1px solid #ddd; border-radius: 4px; }

    .settings-list { display: flex; flex-direction: column; gap: 10px; }
    .setting-row { display: flex; align-items: center; justify-content: space-between; padding: 10px; border: 1px solid #eee; border-radius: 4px; }
    .setting-row.disabled { opacity: 0.7; background: #f9f9f9; }
    
    .setting-info { display: flex; flex-direction: column; flex: 0 0 35%; }
    .setting-name { font-weight: bold; }
    .setting-id { font-size: 11px; color: #999; }
    .setting-default { display: flex; align-items: center; flex: 1; justify-content: flex-start; padding-left: 20px; }
    
    .already-added { font-weight: bold; color: #777; font-size: 11px; margin: 0; letter-spacing: 0.5px; }
    .multiple-defaults { font-weight: bold; color: #777; font-size: 11px; letter-spacing: 0.5px; }

    .readonly-editor-wrapper { position: relative; width: 100%; opacity: 0.6; pointer-events: none; }
    .readonly-overlay { position: absolute; inset: 0; background: transparent; }

    .add-btn { background: #4CAF50; color: white; border: none; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; }
    .add-btn:disabled { background: #ccc; cursor: not-allowed; }
    .empty { color: #999; font-style: italic; text-align: center; padding: 20px; }
  `]
})
export class AddSettingDialogComponent {
    @Input() currentType: BBType | null = null;
    @Input() existingSettings: { settingId: string, scope?: { field?: string, type?: string } }[] = [];
    @Input() appConfig: AppConfig | null = null;
    @Output() cancel = new EventEmitter<void>();
    @Output() add = new EventEmitter<{ setting: BBSettingDefinition, scope?: { field?: string, type?: string }, defaultValue?: any }>();

    activeTab: 'base' | 'field' = 'base';

    selectedField = '*';
    selectedType = '*';
    typeDisabled = false;

    // Settings loaded from service
    private allSettings: (BBSettingDefinition & { appliesToTypes?: string[] })[] = [];

    constructor(private bbTypeService: BBTypeService) {
        this.allSettings = this.bbTypeService.getAvailableSettings();
    }

    ngOnInit() {
        if (this.selectedField === '*') {
            // Establish default type selection since 'All Types' is removed
            const types = this.availableFieldTypes;
            if (types.length > 0) {
                this.selectedType = types[0];
            }
        }
    }

    get baseTypeName() {
        return this.currentType?.baseType || 'Unknown';
    }

    get availableBaseSettings(): BBSettingDefinition[] {
        // Common type settings that can be added
        return [
            { id: 'Type.Editor', name: 'Type Editor', typeId: 'String' },
            { id: 'Struct.Fields', name: 'Fields', typeId: 'List', subtypeId: 'BBField' }
        ];
    }

    get availableFieldTypes(): string[] {
        // Return all available types so user can configure defaults even for types not yet added
        const types = this.bbTypeService.getTypes()
            .filter(t => t.id !== 'bbtype' && t.id !== 'typeeditor')
            .map(t => t.id);
        return Array.from(new Set(types)).sort();
    }

    get filteredFieldSettings() {
        let settings = this.allSettings;

        // If a specific type is selected, enrich generic settings with type-specific details
        // (e.g. Type.Editor becomes typeeditor with subtypeId='boolean')
        if (this.selectedType !== '*') {
            const typeDef = this.bbTypeService.getTypes().find(t => t.id === this.selectedType);
            if (typeDef && typeDef.settingDefinitions) {
                settings = settings.map(s => {
                    const specific = typeDef.settingDefinitions?.find(d => d.id === s.id);
                    let merged = specific ? { ...s, ...specific } : s;

                    // Force Type.Editor to be type-aware
                    if (merged.id === 'Type.Editor') {
                        merged = { ...merged, typeId: 'TypeEditor', subtypeId: this.selectedType };
                    }

                    return merged;
                });
            } else {
                // Even if no specific definitions on type, we know Type.Editor should match the type
                settings = settings.map(s => {
                    if (s.id === 'Type.Editor') {
                        return { ...s, typeId: 'TypeEditor', subtypeId: this.selectedType };
                    }
                    return s;
                });
            }
        }

        if (this.selectedType === '*') {
            // Return all settings (merged list)
            return settings;
        }

        // Strict filtering: If a specific type is selected (or forced by field),
        // ONLY show settings explicitly for that type (or universal '*').
        // User Request: "If a single field is selected, we must ONLY show settings linked to the selected fields' type."
        // This assumes 'appliesToTypes' covers this linkage.
        return settings.filter(s =>
            s.appliesToTypes?.includes('*') || s.appliesToTypes?.includes(this.selectedType)
        );
    }

    onFieldChange(newField: string) {
        this.selectedField = newField;

        if (newField === '*') {
            const types = this.availableFieldTypes;
            this.selectedType = types.length > 0 ? types[0] : '*';
            this.typeDisabled = false;
        } else {
            // Find field in currentType
            const field = this.currentType?.fields?.find(f => f.name === newField);
            if (field) {
                this.selectedType = field.typeId;
                this.typeDisabled = true;
            } else {
                // Fallback
                this.typeDisabled = false;
            }
        }
    }

    selectSetting(setting: BBSettingDefinition, isFieldScoped = false) {
        if (this.isSettingAdded(setting.id)) return;

        let defaultValue: any = undefined;
        if (isFieldScoped && this.getCheckResult(setting.id) === 'single') {
            defaultValue = this.getDefaultValue(setting.id);
        }

        const payload: any = { setting };
        if (defaultValue !== undefined) payload.defaultValue = defaultValue;

        if (isFieldScoped) {
            payload.scope = {
                field: this.selectedField,
                type: this.selectedType
            };
        }

        this.add.emit(payload);
    }

    isSettingAdded(settingId: string): boolean {
        // Determine scope of current view
        let scope: { field?: string; type?: string } | undefined;

        if (this.activeTab === 'base') {
            scope = undefined; // 'root'
        } else {
            scope = {
                field: this.selectedField,
                type: this.selectedType
            };
        }

        return this.existingSettings.some(x =>
            x.settingId === settingId &&
            x.scope?.field === scope?.field &&
            x.scope?.type === scope?.type
        );
    }

    getCheckResult(settingId: string): 'none' | 'single' | 'multiple' {
        const typesToCheck = this.getTypesToCheck();
        const values = new Set<string>();

        for (const type of typesToCheck) {
            const val = this.getSingleTypeDefault(type, settingId);
            if (val !== null && val !== undefined) {
                // We stringify for comparison, but actual value retrieval will happen in getDefaultValue
                values.add(JSON.stringify(val));
            }
        }

        if (values.size === 0) return 'none';
        if (values.size === 1) return 'single';
        return 'multiple';
    }

    getDefaultValue(settingId: string): any {
        const typesToCheck = this.getTypesToCheck();
        // Return first found value (since we only call this if result is 'single')
        for (const type of typesToCheck) {
            const val = this.getSingleTypeDefault(type, settingId);
            if (val !== null && val !== undefined) return val;
        }
        return null;
    }

    private getTypesToCheck(): BBType[] {
        const typesToCheck: BBType[] = [];
        const allTypes = this.bbTypeService.getTypes();

        if (this.selectedType !== '*') {
            const t = allTypes.find(t => t.id === this.selectedType);
            if (t) typesToCheck.push(t);
        } else {
            if (this.currentType?.fields) {
                this.currentType.fields.forEach(f => {
                    const t = allTypes.find(at => at.id === f.typeId);
                    if (t) typesToCheck.push(t);
                });
            }
        }
        return typesToCheck;
    }

    private getSingleTypeDefault(type: BBType, settingId: string): any {
        if (settingId === 'Type.Editor') {
            if (type.editors && type.editors.length > 0) {
                // Return NAME for clarity, or handle in dynamic field logic if Type.Editor was strictly an enum
                return type.editors[0].name;
            }
            return null;
        }

        // Intrinsic settings mapping
        if (settingId === 'String.MaxLength' && type.maxLen !== undefined) return type.maxLen;
        if (settingId === 'String.MinLength' && type.minLen !== undefined) return type.minLen;
        if (settingId === 'String.MaxLengthMsg' && type.maxLenMsg !== undefined) return type.maxLenMsg;
        if (settingId === 'String.MinLengthMsg' && type.minLenMsg !== undefined) return type.minLenMsg;

        if (settingId === 'Number.MaxValue' && type.maxValue !== undefined) return type.maxValue;
        if (settingId === 'Number.MinValue' && type.minValue !== undefined) return type.minValue;

        // General settings map
        if (type.settings && type.settings[settingId] !== undefined) {
            return type.settings[settingId];
        }

        return null;
    }
}
