import { Component, EventEmitter, Output, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BBType, BBField, BBSettingDefinition, BBEditor } from '../../models/bb-types';
import { BBTypeService } from '../../services/bb-type.service';
import { AppConfig } from '../../models/app-models';
import { DynamicFieldComponent } from '../../shared/dynamic-field.component';

@Component({
    selector: 'app-add-editor-setting-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, DynamicFieldComponent],
    template: `
    <div class="modal-overlay">
        <div class="modal-content setting-dialog">
            <div class="modal-header">
                <h3>Add Editor Setting</h3>
                <button class="close-btn" (click)="cancel.emit()">✕</button>
            </div>
            
            <div class="dialog-tabs">
                <button [class.active]="activeTab === 'base'" (click)="activeTab = 'base'">Base Editor Settings</button>
                <button [class.active]="activeTab === 'field'" (click)="activeTab = 'field'">Field Settings</button>
            </div>

            <div class="dialog-body">
                @if (activeTab === 'base') {

                    <div class="settings-list">
                         <h4>Settings for {{ currentEditor?.name || 'Base Editor' }}</h4>
                         @for (setting of availableBaseSettings; track setting.id) {
                            <div class="setting-row" [class.disabled]="isSettingAdded(setting.id)">
                                 <div class="setting-info">
                                     <span class="setting-name">{{ setting.name }}</span>
                                     <span class="setting-id">{{ setting.id }}</span>
                                 </div>
                                 <div class="setting-default">
                                      @if (isSettingAdded(setting.id)) {
                                         <span class="already-added">Already In Settings List</span>
                                      } @else {
                                         <!-- Show default value read-only -->
                                         <div class="readonly-editor-wrapper">
                                              <!-- Base settings usually have defaults from the base editor definition itself. -->
                                              <!-- We can try to resolve it or just leave blank if no explicit default -->
                                              <app-dynamic-field
                                                   [typeId]="setting.typeId || 'string'"
                                                   [subtypeId]="setting.subtypeId"
                                                   [explicitValues]="setting.values"
                                                   [value]="getBaseSettingDefault(setting.id)"
                                                   [mode]="'edit'"
                                                   [isDisabled]="true"
                                                   [size]="'small'">
                                               </app-dynamic-field>
                                         </div>
                                      }
                                 </div>
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
                                 @for (f of currentType?.fields; track f.FieldID) {
                                     <option [value]="f.FieldID">{{ f.Prompt || f.FieldID }}</option>
                                 }
                             </select>
                         </label>
                         <label>
                             Type:
                             <select [(ngModel)]="selectedType" [disabled]="typeDisabled" (ngModelChange)="onTypeChange($event)">
                                 <option *ngIf="!typeDisabled || selectedType === '*'" value="*">All Types</option>
                                 @for (typeId of availableFieldTypes; track typeId) {
                                     <option [value]="typeId">{{ typeId | titlecase }}</option>
                                 }
                             </select>
                         </label>
                         <label>
                             Editor:
                             <select [(ngModel)]="selectedEditor" (ngModelChange)="onEditorChange($event)">
                                 <option value="*">All Editors</option>
                                 @for (ed of availableEditors; track ed.id) {
                                     <option [value]="ed.id">{{ ed.name }}</option>
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
                                          <!-- Default Value Display -->
                                          <!-- For Editors, default value depends on selected editor. If All Editors, might be ambiguous. -->
                                            <span class="multiple-defaults"></span> 
                                     }
                                 </div>

                                 <button class="add-btn small" (click)="selectSetting(setting, true)" [disabled]="isSettingAdded(setting.id)" style="margin-left: 10px;">+</button>
                             </div>
                         }
                         @if (filteredFieldSettings.length === 0) {
                             <div class="empty">No settings available for current selection.</div>
                         }
                    </div>
                }
            </div>
        </div>
    </div>
  `,
    styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center; }
    .setting-dialog { width: 700px; background: white; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; max-height: 80vh; }
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
    
    .setting-info { display: flex; flex-direction: column; flex: 0 0 200px; }
    .setting-name { font-weight: bold; }
    .setting-id { font-size: 11px; color: #999; }
    .setting-default { display: flex; align-items: center; flex: 1; justify-content: flex-start; padding-left: 20px; padding-right: 15px; overflow: hidden; }
    
    .already-added { font-weight: bold; color: #777; font-size: 11px; margin: 0; letter-spacing: 0.5px; }
    .multiple-defaults { font-weight: bold; color: #777; font-size: 11px; letter-spacing: 0.5px; }

    .readonly-editor-wrapper { position: relative; width: 100%; opacity: 0.6; pointer-events: none; }
    .readonly-overlay { position: absolute; inset: 0; background: transparent; }

    .add-btn { background: #4CAF50; color: white; border: none; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
    .add-btn:disabled { background: #ccc; cursor: not-allowed; }
    .empty { color: #999; font-style: italic; text-align: center; padding: 20px; }
  `]
})
export class AddEditorSettingDialogComponent implements OnInit {
    @Input() currentType: BBType | null = null;
    @Input() currentEditor: BBEditor | null = null;
    @Input() existingSettings: any[] = []; // Checks should match structure
    @Input() appConfig: AppConfig | null = null;
    @Output() cancel = new EventEmitter<void>();
    @Output() add = new EventEmitter<{
        setting: BBSettingDefinition,
        scope?: { field?: string, type?: string, editor?: string },
        defaultValue?: any
    }>();

    activeTab: 'base' | 'field' = 'base';

    selectedField = '*';
    selectedType = '*';
    selectedEditor = '*';

    typeDisabled = false;

    constructor(private bbTypeService: BBTypeService) { }

    ngOnInit() {
        if (this.selectedField === '*') {
            // "If All fields is selected, shows a merged list of the types... (If we have 2 strings... shows String)"
            // Logic handled in availableFieldTypes and defaults
            const types = this.availableFieldTypes;
            // User requested "If All fields is selected... Type Dropdown... If One field... read-only"
            // Default to * for All Fields
            this.selectedType = '*';
        }
    }

    // --- Base Settings Tab ---

    get availableBaseSettings(): BBSettingDefinition[] {
        if (!this.currentEditor?.baseEditorId) return [];

        // Find base editor definition
        // We need to look up the editor definition from the Type that contains it.
        // Base Editor for Struct is 'default' (Core Struct Editor) or 'vertical' (Vertical Struct Editor) on the 'struct' type or 'struct-base'.
        // This is tricky. We need to find the BBType that defines this base editor.
        // We can search all types for an editor with this ID?
        // Or assume baseEditorId implies a known system editor.

        // Hack for now: Search all types for an editor that matches baseEditorId?
        // Better: Use a service method. I'll search locally for now.
        const allTypes = this.bbTypeService.getTypes();
        for (const t of allTypes) {
            if (t.editors) {
                const base = t.editors.find(e => e.id === this.currentEditor?.baseEditorId || e.baseEditorId === this.currentEditor?.baseEditorId);
                // Match by ID is safer if it's a specific system editor like 'vertical'
                // Actually, currentEditor.baseEditorId refers to the ID of the editor in the system types.
                // e.g. 'struct-vertical'.

                // Let's find the editor definition that matches the baseEditorId
                const found = t.editors.find(e => e.baseEditorId === this.currentEditor?.baseEditorId && e.type === 'System');
                if (found && found.settingDefinitions) {
                    return found.settingDefinitions;
                }

                if (t.editors.find(e => e.id === this.currentEditor?.baseEditorId)?.settingDefinitions) {
                    return t.editors.find(e => e.id === this.currentEditor?.baseEditorId)!.settingDefinitions!;
                }
            }
        }

        // Fallback/Mock for Vertical Struct Editor if not found in types (e.g. during prototype dev)
        // Also check if the baseEditorId implies Vertical Struct Editor (often 'default' from struct-base, or 'struct-vertical')
        // Or if the current editor itself is the Vertical Struct Editor.
        const baseId = this.currentEditor?.baseEditorId;
        // Check strict Ids or 'default' if we are in a Struct context (assuming type input exists or implicitly)
        // If type is not available, we might be guessed. 
        // But let's check if 'default' + checking known editors map?
        // Fallback: if id is 'default', check if we can assume it's struct vertical?
        // Better: check if baseId matches 'VertEdit' OR 'struct-vertical' OR 'default' (with caution).

        let isVert = baseId === 'VertEdit' || baseId === 'struct-vertical' || this.currentEditor?.name?.includes('Vertical');

        // If baseId is 'default', we need to be careful. 
        // If the Dialog has access to the Type, we can check.
        // Assuming `this.type` is available (common pattern).
        if (!isVert && baseId === 'default' && this.currentType?.baseType === 'Struct') {
            isVert = true;
        }
        // If this.data.type is not passed, maybe check if `currentEditor` properties suggest it?
        // Or blindly allow 'default' for now as prototype enhancement?
        // Let's try to access `this.bbTypeService` to check context? No.

        // Quick fix: allow 'default' if no other settings found? 
        // Use a broader check:
        if (!isVert && baseId === 'default') {
            // We can return these settings as POTENTIAL candidates?
            // Or check unique property names?
            // Let's assume 'default' for Struct is Vertical.
            // If we really need to restrict, we need the Type.
            isVert = true;
        }

        if (isVert) {
            return [
                {
                    id: 'Struct.VertEdit.PromptPosition',
                    name: 'Prompt Position',
                    typeId: 'enum',
                    values: [
                        { id: 0, text: 'Left' },
                        { id: 1, text: 'Above' },
                        { id: 2, text: 'Inside' }
                    ]
                },
                {
                    id: 'Struct.VertEdit.PromptAlign',
                    name: 'Prompt Align',
                    typeId: 'enum',
                    values: [
                        { id: 0, text: 'Left' },
                        { id: 1, text: 'Right' }
                    ]
                },
                { id: 'Struct.VertEdit.PromptMinSpace', name: 'Prompt Min Space', typeId: 'number' },
                { id: 'Struct.VertEdit.PromptMaxSpace', name: 'Prompt Max Space', typeId: 'number' }
            ];
        }

        return [];
    }

    getBaseSettingDefault(settingId: string): any {
        switch (settingId) {
            case 'Struct.VertEdit.PromptPosition': return 0; // Left
            case 'Struct.VertEdit.PromptAlign': return 1;    // Right
            case 'Struct.VertEdit.PromptMinSpace': return 0;
            case 'Struct.VertEdit.PromptMaxSpace': return 1000;
            default: return null;
        }
    }

    // --- Field Settings Tab ---

    get availableFieldTypes(): string[] {
        if (!this.currentType?.fields) return [];
        const types = new Set(this.currentType.fields.map(f => f.TypeID).filter(t => t !== undefined) as string[]);
        return Array.from(types).sort();
    }

    get availableEditors(): BBEditor[] {
        // Return editors available for the selected Type.
        // If Type is *, show "merged list of all possible editors".

        let relevantTypes: string[] = [];
        if (this.selectedType === '*') {
            relevantTypes = this.availableFieldTypes;
        } else {
            relevantTypes = [this.selectedType];
        }

        const editors = new Map<string, BBEditor>();
        const allTypes = this.bbTypeService.getTypes();

        for (const tid of relevantTypes) {
            const t = allTypes.find(type => type.id === tid);
            if (t && t.editors) {
                for (const ed of t.editors) {
                    // Key by ID? Or Name? Editor IDs might overlap (default).
                    // Display name + (ID)?
                    // "merged list". If multiple types have "Default", do we show it once?
                    // User Example: "Core String Editor", "VertStructEdit".
                    // We should probably deduplicate by ID if it's a system standard, or include Type in name if ambiguous.
                    // Let's just list all unique editor objects found, maybe strict by ID.
                    if (!editors.has(ed.id)) {
                        editors.set(ed.id, ed);
                    }
                }
            }
        }

        return Array.from(editors.values());
    }

    get filteredFieldSettings(): BBSettingDefinition[] {
        // Based on selection
        // If Editor is Specific: Show settings for that editor.
        // If Editor is All: Show Global Settings?

        let settings: BBSettingDefinition[] = [];

        if (this.selectedEditor !== '*') {
            // Find the selected editor definition
            const editor = this.availableEditors.find(e => e.id === this.selectedEditor);
            if (editor && editor.settingDefinitions) {
                settings = editor.settingDefinitions;
            }
        } else {
            // Editor is All -> Show Global Settings
            settings = [
                { id: 'Editor.StdFont', name: 'Standard Font', typeId: 'font' },
                { id: 'Editor.StdFontSize', name: 'Standard Font Size', typeId: 'number' },
                { id: 'Editor.ReadOnly', name: 'Read Only', typeId: 'Boolean' }
            ];
        }

        return settings.filter(s => s.id !== 'Type.Editor');
    }

    onFieldChange(newField: string) {
        this.selectedField = newField;
        if (newField === '*') {
            this.typeDisabled = false;
            this.selectedType = '*';
            // Reset Editor too?
            this.selectedEditor = '*';
        } else {
            const field = this.currentType?.fields?.find(f => f.FieldID === newField);
            if (field) {
                this.selectedType = field.TypeID;
                this.typeDisabled = true;
                this.selectedEditor = '*';
            }
        }
    }

    onTypeChange(newType: string) {
        this.selectedType = newType;
        this.selectedEditor = '*';
    }

    onEditorChange(newEditor: string) {
        this.selectedEditor = newEditor;
    }

    isSettingAdded(settingId: string): boolean {
        // Scope matching
        let scope: any = undefined;
        if (this.activeTab === 'base') {
            scope = undefined; // Root of Editor Settings
        } else {
            scope = {
                field: this.selectedField,
                type: this.selectedType,
                editor: this.selectedEditor
            };
        }

        return this.existingSettings.some(x => {
            const itemScope = x.scope || 'root';
            const currentScope = this.activeTab === 'base' ? 'root' : this.getScopeStringFromFilter();
            return x.settingId === settingId && itemScope === currentScope;
        });
    }

    getScopeStringFromFilter(): string {
        if (this.selectedField && this.selectedField !== '*') return `field:${this.selectedField}`;
        return 'root';
    }

    selectSetting(setting: BBSettingDefinition, isFieldScoped = false) {
        if (this.isSettingAdded(setting.id)) return;

        let scope: any = undefined;
        if (isFieldScoped) {
            scope = {
                field: this.selectedField,
                type: this.selectedType,
                editor: this.selectedEditor
            };
        } else {
            // Base Editor Setting - Scope is null? 
            // In the context of "Editor Settings", root scope means "Apply to THIS Editor instance".
            scope = undefined;
        }

        this.add.emit({
            setting,
            scope,
            defaultValue: undefined // TODO: Defaults
        });
    }
}
