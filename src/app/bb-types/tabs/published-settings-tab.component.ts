import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BBType, BBSettingDefinition } from '../../models/bb-types';
import { DynamicFieldComponent } from '../../shared/dynamic-field.component';
import { AppConfig } from '../../models/app-models';

@Component({
  selector: 'app-published-settings-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicFieldComponent],
  template: `
    <div class="published-tab">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>ID</th>
            <th>Type</th>
            <th>Default Value</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          @for (setting of typeSpecificSettings; track setting.id) {
            <tr>
              <td>
                  <input [(ngModel)]="setting.name" placeholder="Setting Name">
              </td>
              <td>
                  <div class="id-input-group">
                      <span class="id-prefix">{{ prefixOverride || newType.id }}.</span>
                      <input [ngModel]="getIDSuffix(setting)" (ngModelChange)="updateIDSuffix(setting, $event)" placeholder="Suffix">
                  </div>
              </td>
              <td>
                  <select [(ngModel)]="setting.typeId">
                    <option value="String">String</option>
                    <option value="Number">Number</option>
                    <option value="Boolean">Boolean</option>
                    <option value="List">List</option>
                    <!-- Add more types as needed -->
                    @for (type of selectableTypes; track type.id) {
                        @if (type.id !== 'String' && type.id !== 'Number' && type.id !== 'Boolean' && type.id !== 'List') {
                            <option [value]="type.id">{{ type.name }}</option>
                        }
                    }
                  </select>
              </td>
              <td>
                  <app-dynamic-field
                    [typeId]="setting.typeId || 'String'"
                    [appConfig]="appConfig"
                    [(value)]="setting.defaultValue"
                    [mode]="'edit'"
                    [size]="'small'">
                  </app-dynamic-field>
              </td>
              <td style="text-align: right;">
                @if (!isReadOnly) {
                  <button class="icon-btn delete" (click)="deleteTypeSetting(setting.id)" title="Delete">🗑️</button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
      
      @if (!isReadOnly) {
          <div style="display: flex; flex-direction: column; align-items: flex-end; margin-top: 10px;">
              <button class="add-btn small" (click)="addCustomSetting()" [disabled]="!prefixOverride && !newType.id">+ Add Custom Setting</button>
              @if (!prefixOverride && !newType.id) {
                  <div style="color: #d32f2f; font-size: 11px; margin-top: 4px; cursor: pointer; text-decoration: underline;" (click)="requestShortNameFocus.emit()">
                      Please click here to set the short name
                  </div>
              }
          </div>
      }
    </div>
  `,
  styles: [`
    .published-tab { padding: 10px 20px 0 20px; }
    .help-text { color: #666; font-size:13px; font-style: italic; margin-bottom: 15px; }
    
    table { 
      width: 100%; 
      border-collapse: separate; 
      border-spacing: 0 2px; /* Custom Settings spacing to 2px */
      table-layout: fixed; 
    }
    th { 
      background-color: #f5f5f5; 
      height: 20px; 
      padding: 0 4px; 
      font-size: 11px; 
      font-weight: 600; 
      color: #666; 
      text-align: left; 
      border: none;
      margin-bottom: 0; /* Handled by flex gap */
      text-transform: none;
    }
    th:first-child { border-top-left-radius: 4px; border-bottom-left-radius: 4px; }
    th:last-child { border-top-right-radius: 4px; border-bottom-right-radius: 4px; }

    td { 
      padding: 0 4px;
      vertical-align: middle;
      font-size: 13px;
      height: 26px; /* Ensure rigid height for alignment */
    }
    td input, td select { 
      width: 100%; 
      box-sizing: border-box; 
      padding: 4px; 
      height: 26px;
      border: 1px solid #ddd; 
      border-radius: 4px; 
      font-size: 12px; 
    }
    .fields-list { display: flex; flex-direction: column; gap: 1px; }
    .field-item {
      padding: 0;
      background: transparent;
      margin-bottom: 0;
      border-radius: 0;
      box-shadow: none;
      border: none;
      margin-left: 10px;
    }
    .group-row { display: flex; gap: 10px; margin-bottom: 0; align-items: center; margin-left: 10px; }
    code { 
      background: #f5f5f5; 
      padding: 2px 4px; 
      border-radius: 3px; 
      font-family: monospace; 
      font-size: 11px; 
      display: block; 
      overflow: hidden; 
      text-overflow: ellipsis; 
    }
    
    /* Column Widths */
    th:nth-child(1), td:nth-child(1) { width: 20%; }
    th:nth-child(2), td:nth-child(2) { width: 30%; }
    th:nth-child(3), td:nth-child(3) { width: 20%; }
    th:nth-child(4), td:nth-child(4) { width: 25%; }
    th:nth-child(5), td:nth-child(5) { width: 40px; text-align: right; }

    .id-input-group { display: flex; align-items: center; }
    .id-prefix { color: #999; font-size: 13px; margin-right: 2px; }
    
    .icon-btn { background: #f5f5f5; border: 1px solid #ddd; padding: 4px 8px; font-size: 14px; cursor: pointer; border-radius: 4px; }
    .icon-btn.delete { color: #d32f2f; }
    
    .add-btn { background: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; border: none; font-weight: 500; cursor: pointer; font-size: 11px; }
    .add-btn:disabled { background: #cccccc; cursor: not-allowed; opacity: 0.7; }
    

  `]
})
export class PublishedSettingsTabComponent {
  @Input() newType!: Partial<BBType>;
  @Input() selectableTypes: BBType[] = [];
  @Input() appConfig: AppConfig | null = null;
  @Input() isReadOnly = false;
  @Input() prefixOverride?: string;

  @Output() requestShortNameFocus = new EventEmitter<void>();

  get typeSpecificSettings(): BBSettingDefinition[] {
    if (!this.newType.settingDefinitions) {
      this.newType.settingDefinitions = [];
    }

    const definitions = this.newType.settingDefinitions || [];

    // Filter by prefix logic
    const prefix = this.prefixOverride ? this.prefixOverride : (this.newType.id || 'Type');

    return definitions.filter(d =>
      d.isCustom &&
      d.id.startsWith(prefix + '.')
    );
  }

  isCustomTypeSetting(settingId: string): boolean {
    const setting = this.newType.settingDefinitions?.find(s => s.id === settingId);
    return setting?.isCustom === true;
  }

  updatePublishedStatus(settingId: string, status: string) {
    if (!this.newType.publishedSettings) {
      this.newType.publishedSettings = {};
    }
    this.newType.publishedSettings[settingId] = status as 'published' | 'hidden';
  }

  deleteTypeSetting(settingId: string) {
    if (!this.newType.settingDefinitions) return;

    const index = this.newType.settingDefinitions.findIndex(s => s.id === settingId);
    if (index >= 0) {
      this.newType.settingDefinitions.splice(index, 1);

      // Also remove from publishedSettings
      if (this.newType.publishedSettings) {
        delete this.newType.publishedSettings[settingId];
      }
    }
  }

  addCustomSetting() {
    if (!this.newType.settingDefinitions) {
      this.newType.settingDefinitions = [];
    }

    const prefix = this.prefixOverride ? this.prefixOverride : (this.newType.id || 'Type');

    // Add empty row
    this.newType.settingDefinitions.push({
      id: prefix + '.',
      name: '',
      typeId: 'String',
      isCustom: true
    });
  }

  getIDSuffix(setting: BBSettingDefinition): string {
    const prefix = (this.prefixOverride ? this.prefixOverride : (this.newType.id || 'Type')) + '.';
    if (setting.id.startsWith(prefix)) {
      return setting.id.substring(prefix.length);
    }
    return setting.id;
  }

  updateIDSuffix(setting: BBSettingDefinition, suffix: string) {
    const prefix = (this.prefixOverride ? this.prefixOverride : (this.newType.id || 'Type')) + '.';
    setting.id = prefix + suffix;
  }

  getTypeName(settingOrId: string | BBSettingDefinition): string {
    const typeId = typeof settingOrId === 'string' ? settingOrId : settingOrId.typeId;
    const subtypeId = typeof settingOrId === 'string' ? undefined : settingOrId.subtypeId;

    const type = this.selectableTypes.find(t => t.id === typeId);
    let name = type ? type.name : (typeId || 'Unknown');

    // Handle parameterized types
    if (typeId === 'list' && subtypeId) {
      const subtype = this.selectableTypes.find(t => t.id === subtypeId);
      const subtypeName = subtype ? subtype.name : subtypeId;
      return `List of ${subtypeName}`;
    }

    // Handle other parameterized types if necessary
    if (subtypeId) {
      const subtype = this.selectableTypes.find(t => t.id === subtypeId);
      const subtypeName = subtype ? subtype.name : subtypeId;
      return `${name} of ${subtypeName}`;
    }

    // Fallback manual mappings
    const typeNames: Record<string, string> = {
      'string': 'String',
      'number': 'Number',
      'boolean': 'Boolean'
    };
    return typeNames[typeId] || name;
  }
}
