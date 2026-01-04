import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BBType, BBSettingDefinition, BBEditor } from '../../models/bb-types';
import { BBTypeService } from '../../services/bb-type.service';
import { DynamicFieldComponent } from '../../shared/dynamic-field.component';

@Component({
  selector: 'app-type-overrides-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicFieldComponent],
  template: `
    <div class="overrides-tab">
      <p class="tab-description">Override type settings for specific fields or all fields.</p>
      
      <table class="overrides-table">
        <thead>
          <tr>
            <th style="width: 150px;">Item</th>
            <th style="width: 120px;">Type</th>
            <th style="width: 200px;">Setting</th>
            <th>Value</th>
            <th style="width: 80px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (ov of newType.typeOverrides; track $index; let i = $index) {
            <tr>
              <td>
                <select [(ngModel)]="ov.fieldName" (ngModelChange)="onTypeFieldChanged(ov)" class="field-select" [disabled]="isReadOnly">
                  <option value="_THIS_TYPE_">This Type</option>
                  <option value="*">* (All Fields)</option>
                  @for (field of newType.fields || []; track field.FieldID) {
                    <option [value]="field.FieldID">{{ field.Prompt || field.FieldID }}</option>
                  }
                </select>
              </td>
              <td>
                <select [(ngModel)]="ov.settingTypeId" 
                        [disabled]="ov.fieldName !== '*' || isReadOnly" 
                        class="type-select">
                  @for (opt of getTypesOverrideOptions(ov.fieldName); track opt.id) {
                    <option [value]="opt.id">{{ opt.name }}</option>
                  }
                </select>
              </td>
              <td>
                <select [(ngModel)]="ov.settingId" class="setting-select" (ngModelChange)="onSettingIdChange(ov)" [disabled]="isReadOnly">
                  <option value="">-- Select Setting --</option>
                  @for (setting of getFilteredTypeSettings(ov.settingTypeId || '*'); track setting.id) {
                    <option [value]="setting.id">{{ setting.name }}</option>
                  }
                </select>
              </td>
              <td>
                @if (ov.settingId) {
                  <div class="value-cell">
                    @if (ov.settingId === 'Type.Editor') {
                       <!-- Special Editor Selector -->
                       <select 
                          [ngModel]="ov.value" 
                          (ngModelChange)="onValueChange(ov, $event)"
                          [disabled]="isReadOnly"
                          class="type-select">
                          <option value="">(Default)</option>
                          @for (editor of getCompatibleEditors(ov.settingTypeId || ''); track editor.id) {
                              <option [value]="editor.id">{{ editor.name }}</option>
                          }
                       </select>
                    } @else if (ov.isExpression) {
                      <textarea 
                        class="expr-box" 
                        [ngModel]="ov.value"
                        (ngModelChange)="onValueChange(ov, $event)" 
                        [disabled]="isReadOnly"
                        placeholder="e.g. =Parent.Prop"></textarea>
                    } @else {
                      <app-dynamic-field
                        [typeId]="getSettingType(ov.settingId)"
                        [value]="ov.value"
                        (valueChange)="onValueChange(ov, $event)"
                        [size]="'small'"
                        [mode]="isReadOnly ? 'read' : 'edit'"
                        [defaultEditorId]="'default'"
                      ></app-dynamic-field>
                    }
                    @if (ov.settingId !== 'Type.Editor' && !isReadOnly) {
                      <button 
                        class="expr-toggle-btn" 
                        [class.active]="ov.isExpression"
                        (click)="toggleExpression(ov)"
                        title="Toggle Expression Mode">
                        fx
                      </button>
                    }
                  </div>
                }
              </td>
              <td class="actions-cell">
                <button class="icon-btn delete" (click)="removeTypeOverride(i)" title="Delete" *ngIf="!isReadOnly">🗑️</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
      
      <button class="add-btn" (click)="addTypeOverride()" [disabled]="isReadOnly">+ Add Override</button>
    </div>
  `,
  styles: [`
    .overrides-tab { padding: 10px 20px 20px 20px; }
    .tab-description { color: #666; font-size:13px; font-style: italic; margin-bottom: 15px; }

    .overrides-table { 
      width: 100%; 
      border-collapse: collapse; 
      table-layout: fixed; 
    }
    th { 
      text-align: left; 
      padding: 6px 4px; 
      border-bottom: 2px solid #eee; 
      font-size: 11px; 
      color: #888; 
      text-transform: uppercase; 
      letter-spacing: 0.5px; 
    }
    td { 
      padding: 4px;
      border-bottom: 1px solid #eee; 
      vertical-align: middle;
      font-size: 13px;
    }
    
    select, input, textarea {
      width: 100%; 
      box-sizing: border-box; 
      padding: 4px; 
      border: 1px solid #ddd; 
      border-radius: 4px; 
      font-size: 12px;
    }
    select { height: 26px; }

    .icon-btn { background: #f5f5f5; border: 1px solid #ddd; padding: 4px 8px; font-size: 14px; cursor: pointer; border-radius: 4px; }
    .icon-btn.delete { color: #d32f2f; }
    
    .add-btn { background: #4CAF50; color: white; margin-top: 10px; padding: 8px 16px; border-radius: 4px; border: none; font-weight: 500; cursor: pointer; }
    .add-btn:disabled { background: #cccccc; cursor: not-allowed; opacity: 0.7; }

    /* Value Cell & Expression Mode */
    .value-cell { display: flex; gap: 4px; align-items: start; }
    .expr-box { height: 28px; resize: vertical; font-family: monospace; }
    .expr-toggle-btn {
      padding: 2px 6px;
      font-size: 11px;
      background: #eee;
      border: 1px solid #ccc;
      border-radius: 3px;
      cursor: pointer;
      font-family: monospace;
      color: #666;
    }
    .expr-toggle-btn.active {
      background: #4caf50;
      color: white;
      border-color: #4caf50;
    }
    .actions-cell { text-align: center; }
  `]
})
export class TypeOverridesTabComponent {
  @Input() newType!: Partial<BBType>;
  @Input() allTypes: BBType[] = [];
  @Input() isReadOnly = false;

  constructor(private bbTypeService: BBTypeService) { }

  addTypeOverride() {
    if (!this.newType.typeOverrides) {
      this.newType.typeOverrides = [];
    }

    this.newType.typeOverrides.push({
      fieldName: '*',
      settingTypeId: '_ANY_',
      settingId: '',
      value: ''
    });
  }

  removeTypeOverride(index: number) {
    if (this.newType.typeOverrides) {
      const ov = this.newType.typeOverrides[index];

      // If deleting a specific field override, clear it from the field settings too
      if (ov.fieldName !== '*' && ov.fieldName !== '_THIS_TYPE_' && ov.settingId) {
        const field = this.newType.fields?.find(f => f.FieldID === ov.fieldName);
        if (field && field.settings && field.settings[ov.settingId] !== undefined) {
          delete field.settings[ov.settingId];
        }
      }

      this.newType.typeOverrides.splice(index, 1);
    }
  }

  onTypeFieldChanged(ov: any) {
    if (ov.fieldName === '*') {
      ov.settingTypeId = '_ANY_';
    } else if (ov.fieldName === '_THIS_TYPE_') {
      ov.settingTypeId = '_THIS_TYPE_';
    } else {
      // Auto-set type based on field's type
      const field = this.newType.fields?.find(f => f.FieldID === ov.fieldName);
      if (field) {
        ov.settingTypeId = field.TypeID;
      }
    }
    // Clear setting and value when field changes
    ov.settingId = '';
    ov.value = '';
  }

  onSettingIdChange(ov: any) {
    ov.value = ''; // Reset value when setting changes
  }

  onValueChange(ov: any, newValue: any) {
    ov.value = newValue;

    // Sync to field settings if applicable (and not This Type)
    if (ov.fieldName !== '*' && ov.fieldName !== '_THIS_TYPE_' && !ov.isExpression) {
      const field = this.newType.fields?.find(f => f.FieldID === ov.fieldName);
      if (field) {
        if (!field.settings) field.settings = {};
        field.settings[ov.settingId] = newValue;
      }
    }
  }

  toggleExpression(ov: any) {
    ov.isExpression = !ov.isExpression;
  }

  // Helper to populate Type dropdown
  getTypesOverrideOptions(fieldName: string): { id: string, name: string }[] {
    if (fieldName === '_THIS_TYPE_') {
      return [{ id: '_THIS_TYPE_', name: 'Current Type' }];
    }

    if (fieldName === '*') {
      // All Fields - show distinct types from fields + Any
      const distinctTypes = new Set<string>();
      (this.newType.fields || []).forEach(f => f.TypeID && distinctTypes.add(f.TypeID));

      const options = [];
      options.push({ id: '_ANY_', name: '* (Any)' });

      distinctTypes.forEach(typeId => {
        const type = this.allTypes.find(t => t.id === typeId);
        if (type) {
          options.push({ id: type.id, name: type.name });
        } else {
          options.push({ id: typeId, name: typeId });
        }
      });

      return options.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Specific Field
    const field = this.newType.fields?.find(f => f.FieldID === fieldName);
    if (!field) return [];

    const type = this.allTypes.find(t => t.id === field.TypeID);
    return [{ id: field.TypeID, name: type ? type.name : field.TypeID }];
  }

  getFilteredTypeSettings(typeId: string): BBSettingDefinition[] {
    if (typeId === '_THIS_TYPE_') {
      // Global Type Settings + Custom Settings on This Type
      // 1. Global Type Settings (generic)
      const globalTypeSettings: BBSettingDefinition[] = [
        { id: 'Type.Editor', name: 'Editor', typeId: 'String', description: 'Default editor' }
        // Add others if they exist in future
      ];

      // 2. Custom Settings from Published Tabs (newType.settingDefinitions)
      const customSettings = this.newType.settingDefinitions || [];

      return [...globalTypeSettings, ...customSettings];

    } else if (typeId === '_ANY_') {
      // Merge all settings from all types used in fields
      const distinctTypes = new Set<string>();
      (this.newType.fields || []).forEach(f => distinctTypes.add(f.typeId));

      let allSettings: BBSettingDefinition[] = [];
      const seenIds = new Set<string>();

      distinctTypes.forEach(tid => {
        const type = this.allTypes.find(t => t.id === tid);
        if (type) {
          const settings = this.bbTypeService.getAvailableSettings(type);
          settings.forEach(s => {
            if (!seenIds.has(s.id)) {
              seenIds.add(s.id);
              allSettings.push(s);
            }
          });
        }
      });
      // Sort
      return allSettings.sort((a, b) => a.name.localeCompare(b.name));

    } else {
      // Type-specific settings (existing logic)
      if (typeId === '*') return []; // Shouldn't happen now

      const type = this.allTypes.find(t => t.id === typeId);
      if (!type) return [];

      return this.bbTypeService.getAvailableSettings(type);
    }
  }

  getTypeSettingDef(settingId: string): BBSettingDefinition | undefined {
    // Check This Type settings first
    const custom = this.newType.settingDefinitions?.find(s => s.id === settingId);
    if (custom) return custom;
    if (settingId === 'Type.Editor') return { id: 'Type.Editor', name: 'Editor', typeId: 'String' };

    // Search all types for this setting definition
    for (const type of this.allTypes) {
      let setting = type.settingDefinitions?.find(s => s.id === settingId);
      if (setting) return setting;

      if (type.editors) {
        for (const ed of type.editors) {
          setting = ed.settingDefinitions?.find(s => s.id === settingId);
          if (setting) return setting;
        }
      }
    }
    return undefined;
  }

  getSettingType(settingId: string): string {
    const setting = this.getTypeSettingDef(settingId);
    return setting?.typeId || 'string';
  }

  getCompatibleEditors(typeId: string): BBEditor[] {
    let targetTypeId = typeId;

    if (typeId === '_THIS_TYPE_') {
      // If overriding editor for THIS type, we need editors compatible with THIS type's base
      // But 'newType' is impartial. 
      // Logic: if newType.baseType is 'Struct', we want editors for Struct.
      // We can find a System Type with the same base type? 
      // Or simpler: The concept of "editors compatible with this type" usually means 
      // "editors that can edit this type's data structure".
      // Use mapped system type?
      return this.bbTypeService.getDefaultEditorsForBase(this.newType.baseType || 'Core');
    }

    const type = this.allTypes.find(t => t.id === targetTypeId);
    if (!type) return [];
    return type.editors || [];
  }
}
