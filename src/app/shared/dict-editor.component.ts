import { Component, Input, Output, EventEmitter, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IEditorComponent, EditorMode, EditorSize } from './editor.interface';
import { DynamicFieldComponent } from './dynamic-field.component';
import { BBTypeService } from '../services/bb-type.service';
import { BBType } from '../models/bb-types';
import { AppConfig } from '../models/app-models';
import { BBTypeBuilderComponent } from '../bb-types/bb-type-builder.component';

@Component({
  selector: 'app-dict-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicFieldComponent, forwardRef(() => BBTypeBuilderComponent)],
  template: `
    <div class="dict-editor-container" [ngClass]="size">
      <div class="dict-entries">
        @for (key of objectKeys; track key) {
          <div class="dict-entry">
            <div class="entry-label">
                <span class="key-name">{{ key }}:</span>
                <span class="type-badge">{{ getTypeName(getTypeForKey(key)) }}</span>
            </div>
            
            <div class="entry-content">
                <div class="value-column">
                   <app-dynamic-field
                    [typeId]="getTypeForKey(key)"
                    [appConfig]="appConfig"
                    [value]="value[key]"
                    [mode]="mode"
                    [size]="size"
                    [settings]="settings"
                    [fieldName]="key"
                    (valueChange)="onValueChange(key, $event)">
                  </app-dynamic-field>
                </div>

                @if (mode === 'edit') {
                    <button class="remove-btn" (click)="removeEntry(key)" title="Remove Entry">🗑️</button>
                }
            </div>
          </div>
        }

        @if (objectKeys.length === 0) {
          <div class="empty-message">No entries. Click below to add one.</div>
        }
      </div>

      @if (mode === 'edit') {
        <div class="actions">
          <button class="add-btn" (click)="showAddForm = true">+ Add Key</button>
        </div>
      }

      <!-- Add Entry Modal -->
      @if (showAddForm) {
          <div class="form-overlay" (click)="showAddForm = false">
              <div class="form-card resizable-modal" (click)="$event.stopPropagation()">
                  <div class="resize-handle"></div>
                  <div class="modal-header">
                      <h3>Add New Entry</h3>
                      <button class="close-btn" (click)="showAddForm = false">✕</button>
                  </div>
                  
                  <div class="modal-body">
                      <div class="form-group">
                          <label>Key Name</label>
                          <input type="text" [(ngModel)]="newEntryKey" placeholder="e.g. settings_id" class="modal-input">
                      </div>

                      <div class="form-group">
                          <label>Value Type</label>
                          <select [(ngModel)]="newEntryType" class="modal-select">
                              @for (type of allTypes; track type.id) {
                                  <option [value]="type.id">{{ type.name }}</option>
                              }
                              <option value="__new_anon__">+ New (anonymous)...</option>
                          </select>
                      </div>
                  </div>

                  <div class="modal-footer">
                      <button class="cancel-btn" (click)="showAddForm = false">Cancel</button>
                      <button class="save-btn" (click)="confirmAddEntry()" [disabled]="!newEntryKey">Add Entry</button>
                  </div>
              </div>
          </div>
      }

      <!-- Nested Anonymous Builder -->
      @if (showAnonBuilder) {
        <div class="form-overlay">
          <div class="modal-content" style="background: white; padding: 20px; border-radius: 8px; width: 80%; max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <app-bb-type-builder
              [isAnonymousMode]="true"
              [appConfig]="appConfig"
              (cancel)="showAnonBuilder = false"
              (create)="onAnonTypeCreated($event)">
            </app-bb-type-builder>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dict-editor-container {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      background: #fafafa;
      position: relative;
    }
    .dict-entry {
      background: white;
      padding: 12px;
      margin-bottom: 12px;
      border-radius: 4px;
      border: 1px solid #eee;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .entry-label {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-bottom: 8px;
        font-family: monospace;
    }
    .key-name {
        font-weight: bold;
        color: #333;
        font-size: 1.1em;
    }
    .type-badge {
        font-size: 10px;
        background: #e0e0e0;
        color: #666;
        padding: 2px 6px;
        border-radius: 10px;
        text-transform: uppercase;
        font-family: sans-serif;
    }
    .entry-content {
        display: flex;
        gap: 10px;
        align-items: flex-start;
    }
    .value-column {
      flex: 1;
    }
    .remove-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      padding: 5px;
      opacity: 0.6;
    }
    .remove-btn:hover { opacity: 1; color: #d32f2f; }
    
    .empty-message {
      padding: 15px;
      text-align: center;
      color: #888;
      font-style: italic;
    }
    .actions {
      margin-top: 10px;
      display: flex;
      justify-content: flex-end;
    }
    .add-btn {
      padding: 6px 12px;
      background: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
    .add-btn:hover { background: #43a047; }

    /* Modal Styles */
    .form-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    .form-card {
        background: white;
        padding: 0;
        border-radius: 8px;
        width: 350px;
        max-width: 90vw;
        max-height: 90vh;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        resize: both;
        overflow: hidden;
    }
    .modal-header {
        height: 60px;
        padding: 0 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #eee;
        flex-shrink: 0;
    }
    .modal-header h3 { margin: 0; color: #333; font-size: 1.2em; }
    .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #999; }
    
    .modal-body { padding: 20px; overflow-y: auto; flex: 1; }
    
    .modal-footer {
        padding: 15px 20px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        flex-shrink: 0;
    }

    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; font-size: 12px; font-weight: bold; color: #666; margin-bottom: 4px; }
    .modal-input, .modal-select {
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
    }
    
    .save-btn {
        padding: 8px 16px;
        background: #2196f3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    }
    .save-btn:disabled { background: #ccc; cursor: not-allowed; }
    .cancel-btn {
        padding: 8px 16px;
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
    }
  `]
})
export class DictEditorComponent implements IEditorComponent<Record<string, any>>, OnInit {
  @Input() value: Record<string, any> = {};
  @Input() mode: EditorMode = 'edit';
  @Input() size: EditorSize = 'medium';
  @Input() settings: Record<string, any> = {};
  @Input() subtypeId: string = 'string'; // Default fallback Type
  @Input() appConfig: AppConfig | null = null;

  @Output() valueChange = new EventEmitter<Record<string, any>>();

  allTypes: BBType[] = [];

  // Modal State
  showAddForm = false;
  newEntryKey = '';
  newEntryType = '';

  // Anonymous Builder State
  showAnonBuilder = false;

  constructor(private bbTypeService: BBTypeService) {
    this.updateAvailableTypes();
  }

  private updateAvailableTypes() {
    const types = this.appConfig ? [...this.bbTypeService.getTypes().filter(t => !t.userDefined), ...this.appConfig.types] : this.bbTypeService.getTypes();
    this.allTypes = types.filter(t => !t.isAnonymous);
  }

  get objectKeys(): string[] {
    return Object.keys(this.value || {}).filter(k => k !== '__metadata');
  }

  ngOnInit() {
    if (!this.value) {
      this.value = {};
    }
    if (!this.value['__metadata']) {
      this.value['__metadata'] = { types: {} };
    }
    this.newEntryType = this.subtypeId;
  }

  getTypeForKey(key: string): string {
    return this.value['__metadata']?.types?.[key] || this.subtypeId;
  }

  getTypeName(id: string): string {
    const types = this.appConfig ? [...this.bbTypeService.getTypes().filter(t => !t.userDefined), ...this.appConfig.types] : this.bbTypeService.getTypes();
    const type = types.find(t => t.id === id);
    if (type?.isAnonymous) {
      return this.bbTypeService.getTypeDisplayName(type);
    }
    return type?.name || id;
  }

  confirmAddEntry() {
    if (!this.newEntryKey || this.value[this.newEntryKey] !== undefined) {
      alert('Key must be unique and non-empty');
      return;
    }

    if (this.newEntryType === '__new_anon__') {
      this.showAnonBuilder = true;
      this.showAddForm = false;
      return;
    }

    const newValue = { ...this.value };
    newValue[this.newEntryKey] = null;

    if (!newValue['__metadata']) newValue['__metadata'] = { types: {} };
    newValue['__metadata'].types[this.newEntryKey] = this.newEntryType;

    this.value = newValue;
    this.valueChange.emit(this.value);

    // Reset and Close
    this.newEntryKey = '';
    this.showAddForm = false;
  }

  onAnonTypeCreated(anonType: BBType) {
    // 1. Mark as anonymous
    anonType.isAnonymous = true;

    // 2. Register in service
    const anonId = this.bbTypeService.getNextAnonymousId();
    anonType.id = anonId;

    if (this.appConfig) {
      this.appConfig.types.push(anonType);
    } else {
      this.bbTypeService.addType(anonType);
    }

    // 3. Update the value object
    const newValue = { ...this.value };
    newValue[this.newEntryKey] = null;

    if (!newValue['__metadata']) newValue['__metadata'] = { types: {} };
    newValue['__metadata'].types[this.newEntryKey] = anonId;

    this.value = newValue;
    this.valueChange.emit(this.value);

    // 4. Cleanup
    this.showAnonBuilder = false;
    this.newEntryKey = '';
    this.updateAvailableTypes();
  }

  removeEntry(key: string) {
    const newValue = { ...this.value };
    delete newValue[key];
    if (newValue['__metadata']?.types) {
      delete newValue['__metadata'].types[key];
    }
    this.value = newValue;
    this.valueChange.emit(this.value);
  }

  onValueChange(key: string, val: any) {
    this.value = { ...this.value, [key]: val };
    this.valueChange.emit(this.value);
  }
}
