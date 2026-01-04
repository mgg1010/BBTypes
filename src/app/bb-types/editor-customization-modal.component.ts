import { Component, EventEmitter, Input, Output, OnInit, Type, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BBEditor, BBSettingOverride, BBType, BBSettingDefinition } from '../models/bb-types';
import { DynamicFieldComponent } from '../shared/dynamic-field.component';
import { BBTypeService } from '../services/bb-type.service';

interface SystemSettingDef {
  id: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-editor-customization-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicFieldComponent],
  template: `
    <div class="customizer-container resizable-modal">
      <div class="resize-handle"></div>
      <div class="header">
        <h3>Customize Editor: {{ editor.name }}</h3>
        <button class="close-btn" (click)="close.emit()">✕</button>
      </div>

      <nav class="tabs">
        <button [class.active]="activeTab === 'core'" (click)="activeTab = 'core'">Core Settings</button>
        <button [class.active]="activeTab === 'published'" (click)="activeTab = 'published'">Published Settings</button>
        <button [class.active]="activeTab === 'overrides'" (click)="activeTab = 'overrides'">Overrides</button>
      </nav>

      <div class="tab-content" [class.with-sidebar]="activeTab === 'overrides'">
        <!-- Core Tab -->
        @if (activeTab === 'core') {
          <div class="core-tab">
            <div class="form-group">
              <label>Name:</label>
              <input [(ngModel)]="editor.name">
            </div>
            <div class="form-group">
              <label>ID:</label>
              <input [(ngModel)]="editor.id" placeholder="e.g. VertEdit, CoreEdit">
              <small class="help">Used for custom setting IDs (e.g. Struct.{{editor.id || 'ID'}}.SettingName)</small>
            </div>
            @if (editor.type === 'Custom' && editor.baseEditorId) {
              <div class="form-group">
                <label>Customises:</label>
                <input [value]="getBaseEditorName(editor.baseEditorId)" disabled class="readonly-input">
              </div>
            }
          </div>
        }

        <!-- Published Tab -->
        @if (activeTab === 'published') {
          <div class="published-tab">
            <p class="help-text">Settings published here will be visible for overrides in parent types using this editor.</p>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (def of editorSpecificSettings; track def.id) {
                    <tr>
                        <td>
                            @if (isCustomSetting(def.id)) {
                                <input [(ngModel)]="def.name">
                            } @else {
                                <span class="readonly-type">{{ def.name }}</span>
                            }
                        </td>
                        <td><code>{{ def.id }}</code></td>
                        <td>
                            @if (isCustomSetting(def.id)) {
                                <select [(ngModel)]="def.typeId">
                                    <option value="string">String</option>
                                    <option value="number">Number</option>
                                    <option value="boolean">Boolean</option>
                                </select>
                            } @else {
                                <span class="readonly-type">{{ getTypeName(def.typeId) }}</span>
                            }
                        </td>
                        <td>
                            <select [ngModel]="editor.publishedSettings[def.id] || 'published'" (ngModelChange)="editor.publishedSettings[def.id] = $event">
                                <option value="published">Published</option>
                                <option value="hidden">Hidden</option>
                            </select>
                        </td>
                        <td>
                            @if (isCustomSetting(def.id)) {
                                <button class="icon-btn delete" (click)="removePublishedDef(def.id)">🗑️</button>
                            }
                        </td>
                    </tr>
                }
              </tbody>
            </table>
            <div class="add-row">
              <button class="add-btn" (click)="openAddCustomSettingDialog()">+ Add Custom Setting</button>
            </div>
          </div>
        }

        <!-- Add Custom Setting Dialog -->
        @if (showAddSettingDialog) {
          <div class="modal-overlay" (click)="closeAddSettingDialog()">
            <div class="add-setting-dialog" (click)="$event.stopPropagation()">
              <div class="dialog-header">
                <h4>Add Custom Setting</h4>
                <button class="close-btn" (click)="closeAddSettingDialog()">✕</button>
              </div>
              <div class="dialog-body">
                <div class="form-group">
                  <label>Setting Name:</label>
                  <input [(ngModel)]="newSettingName" placeholder="e.g. Prompt Position">
                </div>
                <div class="form-group">
                  <label>Setting ID:</label>
                  <div class="id-builder">
                    <span class="id-prefix">{{ settingIdPrefix }}</span>
                    <input [(ngModel)]="newSettingIdSuffix" placeholder="e.g. PromptPosition">
                  </div>
                  <small class="help">Full ID: {{ settingIdPrefix }}{{ newSettingIdSuffix }}</small>
                </div>
                <div class="form-group">
                  <label>Type:</label>
                  <select [(ngModel)]="newSettingType">
                    <option value="">Select Type...</option>
                    @for (type of fieldBaseTypes; track type.id) {
                      <option [value]="type.id">{{ type.name }}</option>
                    }
                  </select>
                </div>
                @if (addSettingError) {
                  <div class="error-message">{{ addSettingError }}</div>
                }
              </div>
              <div class="dialog-footer">
                <button class="btn-secondary" (click)="closeAddSettingDialog()">Cancel</button>
                <button class="btn-primary" (click)="saveCustomSetting()" [disabled]="!canSaveCustomSetting()">Add Setting</button>
              </div>
            </div>
          </div>
        }

        <!-- Overrides Tab -->
        @if (activeTab === 'overrides') {
          <div class="overrides-container">
            <div class="overrides-main">
                <p class="help-text">Define specific values for settings. Use "*" for all fields, or match field names.</p>
                <div class="overrides-table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Field</th>
                          <th>Type</th>
                          <th>Setting</th>
                          <th>Value</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (ov of editor.overrides; track $index) {
                          <tr [class.expr-mode]="ov.isExpression">
                            <td>
                                <select [(ngModel)]="ov.fieldName" (ngModelChange)="onFieldChanged(ov)" class="field-select">
                                    <option value="*">* (All)</option>
                                    @for (field of parentFields; track field.name) {
                                        <option [value]="field.name">{{ field.name }}</option>
                                    }
                                </select>
                            </td>
                            <td>
                                <select [(ngModel)]="ov.settingTypeId" (ngModelChange)="onSettingTypeChanged(ov)" class="type-select" [disabled]="ov.fieldName !== '*'">
                                    <option value="*">* (All)</option>
                                    @for (type of fieldBaseTypes; track type.id) {
                                        <option [value]="type.id">{{ type.name }}</option>
                                    }
                                </select>
                            </td>
                            <td>
                                <select [(ngModel)]="ov.settingId" (ngModelChange)="onSettingChanged(ov)" class="setting-select">
                                    <option value="">Select Setting...</option>
                                    @for (opt of getFilteredSettings(ov.settingTypeId || '*'); track opt.id) {
                                        <option [value]="opt.id">{{ opt.name }}</option>
                                    }
                                </select>
                            </td>
                            <td>
                                <div class="value-engine">
                                    @if (ov.isExpression) {
                                        <textarea 
                                            class="expr-box" 
                                            [(ngModel)]="ov.value" 
                                            placeholder="e.g. =Parent.Prop"
                                            (dragover)="$event.preventDefault()"
                                            (drop)="onExprDrop($event, ov)"></textarea>
                                    } @else {
                                        <div class="lit-box">
                                            @if (ov.settingId && ov.settingId !== 'Type.Editor') {
                                                <app-dynamic-field
                                                    [typeId]="getSettingType(ov.settingId)"
                                                    [value]="ov.value"
                                                    (valueChange)="ov.value = $event"
                                                    size="small"
                                                    mode="edit">
                                                </app-dynamic-field>
                                            } @else if (ov.settingId === 'Type.Editor') {
                                                <select 
                                                    [(ngModel)]="ov.value" 
                                                    class="editor-input">
                                                    <option value="">(Default)</option>
                                                    @for (editor of getCompatibleEditors(ov.settingTypeId || ''); track editor.id) {
                                                        <option [value]="editor.id">{{ editor.name }}</option>
                                                    }
                                                </select>
                                            } @else {
                                                <input [(ngModel)]="ov.value" placeholder="Value">
                                            }
                                        </div>
                                    }
                                    <button class="toggle-mode-btn" [class.active]="ov.isExpression" (click)="ov.isExpression = !ov.isExpression" title="Toggle Expression Mode">
                                        {{ ov.isExpression ? 'f(x)' : 'Abc' }}
                                    </button>
                                </div>
                            </td>
                            <td><button class="icon-btn delete" (click)="removeOverride($index)">🗑️</button></td>
                          </tr>
                        }
                      </tbody>
                    </table>
                </div>
                <button class="add-btn" (click)="addOverride()">+ Add Override</button>
            </div>

            <aside class="overrides-sidebar">
                <h4>Draggable Context</h4>
                <p class="sidebar-help">Drag these settings into an expression box to link them.</p>
                <div class="chip-list">
                    @for (settingId of publishedKeys; track settingId) {
                        <div class="setting-chip" 
                             draggable="true" 
                             (dragstart)="onChipDragStart($event, settingId)">
                            <span class="chip-label">{{ settingId }}</span>
                            <span class="chip-handle">⋮⋮</span>
                        </div>
                    }
                    @if (publishedKeys.length === 0) {
                        <div class="empty-state">No published settings to drag.</div>
                    }
                </div>
            </aside>
          </div>
        }
      </div>

      <div class="footer">
        <button class="save-btn" (click)="save.emit(editor)">Apply Changes</button>
      </div>
    </div>
  `,
  styles: [`
    /* Container fills the parent .modal-content */
    .customizer-container { 
        display: flex; 
        flex-direction: column; 
        height: 100%; 
        width: 100%; 
        background: white; 
        /* delegated to parent: border-radius, resize, shadow */
    }
    .header { 
        height: 60px; /* Standardized Height */
        flex: 0 0 auto;
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        padding: 0 20px; 
        border-bottom: 1px solid #eee; 
        box-sizing: border-box;
    }
    .header h3 { margin: 0; color: #333; }
    .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #999; }
    
    .footer { 
      flex: 0 0 auto; 
      padding: 15px 20px; 
      border-top: 1px solid #eee; 
      background: white;
      display: flex;
      justify-content: flex-end;
    }
    .save-btn { 
      padding: 10px 20px; 
      background: #2196F3; 
      color: white; 
      border: none; 
      border-radius: 4px; 
      cursor: pointer; 
      font-size: 14px;
    }
    .save-btn:hover { background: #1976D2; }
    
    .tabs { flex: 0 0 auto; display: flex; padding: 0 20px; background: #fafafa; border-bottom: 1px solid #eee; }
    .tabs button { 
      padding: 12px 20px; background: none; border: none; border-bottom: 2px solid transparent; 
      cursor: pointer; color: #666; font-weight: 500;
    }
    .tabs button.active { color: #2196F3; border-bottom-color: #2196F3; }

    .tab-content { flex: 1; overflow-y: auto; padding: 20px; background: #fff; min-height: 0; /* Important for flex nesting */ }
    .tab-content.with-sidebar { padding: 0; }
    .help-text { color: #666; font-size: 13px; font-style: italic; margin-bottom: 15px; }

    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 14px; }
    .form-group input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
    .readonly-input { background: #f5f5f5; color: #666; cursor: not-allowed; }
    .readonly-text { padding: 8px 0; color: #666; font-size: 14px; }

    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th { text-align: left; padding: 6px 4px; border-bottom: 2px solid #eee; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 4px; border-bottom: 1px solid #eee; vertical-align: middle; }
    td input, td select { width: 100%; box-sizing: border-box; padding: 4px; height: 30px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; }
    code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 11px; display: block; overflow: hidden; text-overflow: ellipsis; }

    /* Column Widths */
    th:nth-child(1), td:nth-child(1) { width: 25%; } /* Name */
    th:nth-child(2), td:nth-child(2) { width: 30%; } /* ID */
    th:nth-child(3), td:nth-child(3) { width: 20%; } /* Type */
    th:nth-child(4), td:nth-child(4) { width: 15%; } /* Status */
    th:nth-child(5), td:nth-child(5) { width: 30px; text-align: center; } /* Action */

    .add-row { margin-top: 15px; display: flex; gap: 10px; align-items: center; }
    .add-row input { flex: 1; padding: 6px; }

    .overrides-container { display: grid; grid-template-columns: 1fr 280px; height: 100%; min-height: 500px; }
    .overrides-main { padding: 20px; padding-bottom: 40px; overflow-y: auto; border-right: 1px solid #eee; }
    .overrides-main table { table-layout: fixed; width: 100%; }
    .overrides-main table th:nth-child(1), .overrides-main table td:nth-child(1) { width: 100px; } /* Field */
    .overrides-main table th:nth-child(2), .overrides-main table td:nth-child(2) { width: 120px; } /* Type */
    .overrides-main table th:nth-child(3), .overrides-main table td:nth-child(3) { width: 180px; } /* Setting */
    .overrides-main table th:nth-child(4), .overrides-main table td:nth-child(4) { width: auto; } /* Value */
    .overrides-main table th:nth-child(5), .overrides-main table td:nth-child(5) { width: 60px; text-align: center; } /* Action */
    .overrides-sidebar { padding: 20px; background: #fbfbfb; }
    .overrides-sidebar h4 { margin-top: 0; font-size: 14px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    .sidebar-help { font-size: 11px; color: #888; margin-bottom: 15px; }

    .field-select, .setting-select { width: 100%; }
    .value-engine { display: flex; gap: 5px; align-items: flex-start; padding-right: 10px; }
    .expr-box { flex: 1; min-height: 60px; font-family: monospace; font-size: 12px; padding: 8px; border: 1px solid #bbdefb; background: #f1f8fe; resize: vertical; }
    .lit-box { flex: 1; min-width: 150px; }
    
    .toggle-mode-btn { 
        padding: 4px 8px; font-size: 11px; background: #eee; border: 1px solid #ccc; border-radius: 4px; 
        cursor: pointer; height: 30px; align-self: center; flex-shrink: 0;
    }
    .toggle-mode-btn.active { background: #e3f2fd; border-color: #2196F3; color: #1976d2; font-weight: bold; }

    .setting-chip { 
        display: flex; justify-content: space-between; align-items: center;
        background: #fff; border: 1px solid #e0e0e0; border-radius: 16px;
        padding: 6px 12px; margin-bottom: 8px; cursor: grab;
        font-size: 12px; color: #444; transition: all 0.2s;
    }
    .setting-chip:hover { border-color: #2196F3; background: #f5faff; }
    .chip-handle { color: #ccc; font-size: 14px; }
    
    .empty-state { text-align: center; color: #999; font-size: 12px; padding: 20px 0; }

    .footer { flex: 0 0 auto; padding: 15px 20px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; }
    .save-btn { background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; }
    .add-btn { background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 15px; cursor: pointer; }
    .icon-btn { background: none; border: none; cursor: pointer; padding: 4px; font-size: 16px; opacity: 0.6; }
    .icon-btn:hover { opacity: 1; }
    .icon-btn.delete { color: #d32f2f; }
    .readonly-type { color: #666; font-weight: normal; font-size: 14px; }
    
    /* Add Custom Setting Dialog */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }
    
    .add-setting-dialog {
      background: white;
      border-radius: 8px;
      width: 500px;
      max-width: 90%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
    }
    
    .dialog-header h4 {
      margin: 0;
      font-size: 18px;
    }
    
    .dialog-body {
      padding: 20px;
    }
    
    .dialog-body .form-group {
      margin-bottom: 16px;
    }
    
    .dialog-body .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #333;
    }
    
    .dialog-body .form-group input,
    .dialog-body .form-group select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .id-builder {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .id-prefix {
      background: #f0f0f0;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px 0 0 4px;
      color: #666;
      font-family: monospace;
      font-size: 13px;
      white-space: nowrap;
    }
    
    .id-builder input {
      flex: 1;
      border-radius: 0 4px 4px 0 !important;
      font-family: monospace;
    }
    
    .dialog-body .help {
      display: block;
      margin-top: 4px;
      color: #999;
      font-size: 12px;
    }
    
    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 10px;
      border-radius: 4px;
      font-size: 13px;
      margin-top: 12px;
    }
    
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 20px;
      border-top: 1px solid #eee;
    }
    
    .btn-secondary, .btn-primary {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }
    
    .btn-secondary:hover {
      background: #e0e0e0;
    }
    
    .btn-primary {
      background: #2196f3;
      color: white;
    }
    
    .btn-primary:hover {
      background: #1976d2;
    }
    
    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  `]
})
export class EditorCustomizationModalComponent implements OnInit {
  @Input() editor!: BBEditor;
  @Input() parentType!: BBType;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<BBEditor>();

  activeTab: 'core' | 'published' | 'overrides' = 'core';

  // Add Custom Setting Dialog state
  showAddSettingDialog = false;
  newSettingName = '';
  newSettingIdSuffix = '';
  newSettingType = '';
  addSettingError = '';

  constructor(private bbTypeService: BBTypeService) { }

  // Handle Escape key to close dialog
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event) {
    if (this.showAddSettingDialog) {
      this.closeAddSettingDialog();
      event.stopPropagation();
      event.preventDefault();
    } else {
      this.close.emit();
    }
  }

  get publishedKeys() {
    return Object.keys(this.editor.publishedSettings || {});
  }

  get parentFields() {
    return this.parentType.fields || [];
  }

  get availableSettings(): BBSettingDefinition[] {
    return this.bbTypeService.getAvailableSettings(this.parentType);
  }

  // Filter out global Type.Editor setting from Published Settings tab
  // (Editor.ReadOnly and Editor.Locale should remain visible)
  get editorSpecificSettings(): BBSettingDefinition[] {
    // Start with existing definitions
    let definitions = [...(this.editor.settingDefinitions || [])];

    // Ensure Global Settings are present even if not explicitly saved on the editor
    const globalSettings: BBSettingDefinition[] = [
      { id: 'Editor.ReadOnly', name: 'Read Only', typeId: 'Boolean' },
      { id: 'Editor.Locale', name: 'Locale', typeId: 'String' },
      { id: 'Editor.StdFont', name: 'Standard Font', typeId: 'font' },
      { id: 'Editor.StdFontSize', name: 'Standard Font Size', typeId: 'number' }
    ];

    globalSettings.forEach(global => {
      if (!definitions.find(d => d.id === global.id)) {
        // Add if missing. Note: This merely adds it to the view list.
        // It doesn't persist to the object until saved/modified.
        definitions.push(global);
      }
    });

    const filtered = definitions.filter(def => def.id !== 'Type.Editor');

    // Sort: global settings (Editor.*) first, then others
    return filtered.sort((a, b) => {
      const aIsGlobal = a.id.startsWith('Editor.');
      const bIsGlobal = b.id.startsWith('Editor.');

      if (aIsGlobal && !bIsGlobal) return -1;  // a comes first
      if (!aIsGlobal && bIsGlobal) return 1;   // b comes first
      return 0;  // keep original order
    });
  }

  // Check if a setting is custom (user-added) vs built-in
  isCustomSetting(settingId: string): boolean {
    // Find the setting in editor's settingDefinitions and check isCustom flag
    const setting = this.editor.settingDefinitions?.find(s => s.id === settingId);
    return setting?.isCustom === true;
  }

  // Get display name for a type ID
  getTypeName(typeId: string): string {
    const typeNames: Record<string, string> = {
      'string': 'String',
      'number': 'Number',
      'boolean': 'Boolean',
      'date': 'Date',
      'file': 'File',
      'font': 'Font',
      'Editor.Locale': 'String',
      'Editor.StdFont': 'Font',
      'Editor.StdFontSize': 'Number',
      'String.ValidationRule': 'Validation Rule',
      'Struct.VertEdit.PromptPosition': 'Prompt Position'
    };
    return typeNames[typeId] || typeId;
  }

  get settingIdPrefix(): string {
    const baseType = this.parentType.baseType || 'Custom';
    const id = this.editor.id || '';
    return `${baseType}.${id}.`;
  }

  // Get field-base types for the Type dropdown
  get fieldBaseTypes(): BBType[] {
    return this.bbTypeService.getTypes().filter(t => t.fieldBaseType);
  }

  openAddCustomSettingDialog() {
    // Check if id is set
    if (!this.editor.id) {
      alert('Please set ID on the Core Settings tab before adding custom settings.');
      this.activeTab = 'core';
      return;
    }

    this.showAddSettingDialog = true;
    this.newSettingName = '';
    this.newSettingIdSuffix = '';
    this.newSettingType = '';
    this.addSettingError = '';
  }

  // Close the dialog
  closeAddSettingDialog() {
    this.showAddSettingDialog = false;
    this.addSettingError = '';
  }

  // Check if can save
  canSaveCustomSetting(): boolean {
    return !!(this.newSettingName && this.newSettingIdSuffix && this.newSettingType);
  }

  // Save the custom setting
  saveCustomSetting() {
    const fullId = this.settingIdPrefix + this.newSettingIdSuffix;

    // Validate: Check if ID already exists
    const exists = this.editor.settingDefinitions?.some(def => def.id === fullId);
    if (exists) {
      this.addSettingError = `Setting ID "${fullId}" already exists!`;
      return;
    }

    // Add the setting
    if (!this.editor.settingDefinitions) this.editor.settingDefinitions = [];
    this.editor.settingDefinitions.push({
      id: fullId,
      name: this.newSettingName,
      typeId: this.newSettingType,
      description: '',
      isCustom: true  // Flag as user-added custom setting
    });

    // Mark as published
    if (!this.editor.publishedSettings) this.editor.publishedSettings = {};
    this.editor.publishedSettings[fullId] = 'published';

    this.closeAddSettingDialog();
  }

  ngOnInit() {
    // Clone editor to avoid direct mutation until save
    this.editor = JSON.parse(JSON.stringify(this.editor));
    if (!this.editor.publishedSettings) this.editor.publishedSettings = {};
    if (!this.editor.settingDefinitions) this.editor.settingDefinitions = [];
    if (!this.editor.overrides) this.editor.overrides = [];

    // Initialize settingTypeId for existing overrides that don't have it
    this.editor.overrides.forEach(ov => {
      if (!ov.settingTypeId) {
        if (ov.fieldName === '*') {
          ov.settingTypeId = '*';
        } else {
          // Set type based on field
          const field = this.parentFields.find(f => f.name === ov.fieldName);
          ov.settingTypeId = field ? field.typeId : '*';
        }
      }
    });
  }

  addPublishedDef(id: string) {
    if (!id) return;
    if (!this.editor.settingDefinitions) this.editor.settingDefinitions = [];

    const existing = this.editor.settingDefinitions.find(d => d.id === id);
    if (!existing) {
      this.editor.settingDefinitions.push({
        id,
        name: id.split('.').pop() || id,
        typeId: 'String'
      });
      this.editor.publishedSettings[id] = 'published';
    }
  }

  removePublishedDef(id: string) {
    this.editor.settingDefinitions = (this.editor.settingDefinitions || []).filter(d => d.id !== id);
    delete this.editor.publishedSettings[id];
  }

  getSettingType(settingId: string): string {
    const def = this.availableSettings.find(s => s.id === settingId);
    return def?.typeId || 'string';
  }

  onSettingChanged(ov: any) {
    // Reset value if type changed? 
    // For now just ensure it's not undefined
    if (ov.value === undefined) ov.value = '';
  }

  addOverride() {
    this.editor.overrides.push({
      fieldName: '*',
      settingTypeId: '*',
      settingId: '',
      value: ''
    });
  }

  removeOverride(index: number) {
    this.editor.overrides.splice(index, 1);
  }

  // Get filtered settings based on selected type
  getFilteredSettings(typeId: string): BBSettingDefinition[] {
    if (typeId === '*') {
      // Only global settings for *(All)
      return this.availableSettings.filter(s => s.id.startsWith('Editor.'));
    } else {
      // Capitalize first letter to match setting ID format (e.g., "string" -> "String")
      const capitalizedTypeId = typeId.charAt(0).toUpperCase() + typeId.slice(1);

      // Type-specific settings + global settings
      return this.availableSettings.filter(s => {
        // Special case: Allow Type.Editor if we are overriding for a specific field
        if (s.id === 'Type.Editor') return true;

        if (s.id.startsWith('Editor.')) return true; // Include global
        // Include settings that belong to the selected type
        return s.id.startsWith(capitalizedTypeId + '.');
      });
    }
  }

  getCompatibleEditors(typeId: string): BBEditor[] {
    // Determine the type we are looking for
    // If typeId is '*', we can't really list editors unless we list ALL editors?
    // But Type.Editor implies we are setting the editor FOR a specific type.
    // If fieldName is '*', settingTypeId is '*', then Type.Editor isn't valid?
    // Actually Type.Editor is valid for a field.

    // Use bbTypeService to get the type definition and its editors
    const types = this.bbTypeService.getTypes();
    const type = types.find(t => t.id === typeId);
    if (!type) return [];
    return type.editors || [];
  }

  // Handle field change in override row
  onFieldChanged(ov: any) {
    if (ov.fieldName === '*') {
      // All fields - reset to manual type selection
      ov.settingTypeId = '*';
    } else {
      // Specific field - auto-set type to match field's type
      const field = this.parentFields.find(f => f.name === ov.fieldName);
      if (field) {
        ov.settingTypeId = field.typeId;
      }
    }
    // Clear setting and value when field changes
    ov.settingId = '';
    ov.value = '';
  }

  // Handle type change in override row
  onSettingTypeChanged(ov: any) {
    // Clear setting selection when type changes
    ov.settingId = '';
    ov.value = '';
  }

  // Drag & Drop logic
  onChipDragStart(event: DragEvent, settingId: string) {
    event.dataTransfer?.setData('text/plain', `[${settingId}]`);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
  }

  onExprDrop(event: DragEvent, ov: any) {
    event.preventDefault();
    const data = event.dataTransfer?.getData('text/plain');
    if (data && ov.isExpression) {
      const start = (event.target as HTMLTextAreaElement).selectionStart || 0;
      const end = (event.target as HTMLTextAreaElement).selectionEnd || 0;
      const text = ov.value || '';
      ov.value = text.substring(0, start) + data + text.substring(end);
    }
  }

  getBaseEditorName(baseEditorId: string): string {
    // For a custom editor, find the SYSTEM editor it's based on by ID
    const systemEditor = this.parentType.editors?.find(e =>
      e.id === baseEditorId && e.type === 'System'
    );
    return systemEditor ? systemEditor.name : `Editor (${baseEditorId})`;
  }
}
