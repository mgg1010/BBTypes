import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BBField, BBType } from '../models/bb-types';
import { BBTypeService } from '../services/bb-type.service';

@Component({
    selector: 'app-bb-type-field-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="field-settings-column">
        @if (!isReadOnly || fields.length > 0) {
            <div class="flex-row" style="justify-content: space-between; margin-bottom: 2px;" *ngIf="showGroupDefinitions">
                <div class="sys-h4">Fields</div>
            </div>
            
            <!-- Column Headers -->
            <!-- Column Headers -->
            <div class="field-list-header">
                <div style="flex: 0 0 20px;" *ngIf="showSelectionRadio"></div> <!-- Radio -->
                <div style="flex: 1.5;">Name</div>
                <div style="flex: 0 0 90px;" *ngIf="fieldGroups.length > 0">Group</div>
                <div style="flex: 1;">Type</div>
                <div style="flex: 0 0 40px; text-align: center;">Required</div>
                <div style="flex: 0 0 30px;" *ngIf="!isReadOnly"></div> <!-- Delete -->
            </div>

            <div class="fields-list">
                @for (field of fields; track $index) {
                    <div class="field-item" [class.selected]="selectedField === field" (click)="onSelectField(field)">
                        <div class="field-main">
                            <div style="flex: 0 0 20px; display: flex; align-items: center; justify-content: center;" *ngIf="showSelectionRadio">
                                <input type="radio" name="selectedField" 
                                    [checked]="selectedField === field"
                                    (click)="onSelectField(field); $event.stopPropagation()">
                            </div>
                            
                            <input type="text" [(ngModel)]="field.name" placeholder="Field Name" (ngModelChange)="fieldsUpdated.emit()"
                                (focus)="onSelectField(field)" style="flex: 1.5;" [disabled]="isReadOnly">
                                
                            <!-- Group Selector (Small) -->
                            @if (fieldGroups.length > 0) {
                                <select [ngModel]="getFieldGroupId(field)" (ngModelChange)="updateFieldGroup(field, $event); fieldsUpdated.emit()" 
                                    style="flex: 0 0 90px;" (focus)="onSelectField(field)" title="Field Group" [disabled]="isReadOnly">
                                    <option [value]="null">-</option>
                                    @for (group of fieldGroups; track group.id) {
                                        <option [value]="group.id">{{ group.text }}</option>
                                    }
                                </select>
                            }
                            
                            <select [(ngModel)]="field.typeId" (change)="onFieldTypeChangeInternal(field)"
                                (focus)="onSelectField(field)" style="flex: 1;" [disabled]="isReadOnly">
                                <optgroup label="Core Types">
                                    @for (type of coreTypes; track type.id) {
                                        <option [value]="type.id">{{ type.name }}</option>
                                    }
                                </optgroup>
                                <optgroup label="Custom Types">
                                    @for (type of customTypes; track type.id) {
                                        <option [value]="type.id">{{ type.name }}</option>
                                    }
                                </optgroup>
                                <option value="new-anonymous">+ New Type...</option>
                            </select>
                            
                            <div style="flex: 0 0 40px; display: flex; justify-content: center;">
                                <input type="checkbox" style="margin: 0; height: 14px; width: 14px;"
                                    [ngModel]="field.settings?.['required']" 
                                    (ngModelChange)="updateFieldSetting(field, 'required', $event); onSelectField(field); fieldsUpdated.emit()"
                                    (click)="$event.stopPropagation()"
                                    [disabled]="isReadOnly"
                                    title="Required">
                            </div>

                            <div style="flex: 0 0 30px; display: flex; justify-content: center;" *ngIf="!isReadOnly">
                                <button class="icon-btn delete" (click)="removeField.emit($index); $event.stopPropagation()">
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                }
                <!-- Show empty message only if NOT read only, or handle showing nothing? User said hide if empty. -->
                @if (fields.length === 0 && !isReadOnly) {
                    <div class="empty-state-row">
                        <div class="empty-selection">No fields added.</div>
                         <button class="add-btn small" (click)="addField.emit()">+ Add Field</button>
                    </div>
                }
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: 10px; padding-right: 8px;" *ngIf="!isReadOnly && fields.length > 0">
                    <button class="add-btn small" (click)="addField.emit()">+ Add Field</button>
            </div>
        }

        <!-- Field Groups Section -->
        @if (showGroupDefinitions && (!isReadOnly || fieldGroups.length > 0)) {
            <div class="field-groups-section">
                <div class="flex-row" style="justify-content: space-between; margin-bottom: 5px;">
                    <label class="sys-h4" style="font-size: 12px; text-transform: uppercase;">Field Groups</label>
                </div>
                @for (group of fieldGroups; track $index) {
                    <div class="flex-row" style="gap: 5px; margin-bottom: 5px;">
                        <input type="text" [(ngModel)]="group.text" placeholder="Group Name" style="flex: 1; height: 26px;" [disabled]="isReadOnly" (ngModelChange)="fieldsUpdated.emit()">
                        <button class="icon-btn delete" (click)="removeFieldGroup.emit($index)" *ngIf="!isReadOnly">
                                ✕
                        </button>
                    </div>
                }
                @if (fieldGroups.length === 0 && !isReadOnly) {
                    <div class="help-text" style="font-size: 11px;">No groups defined.</div>
                }
                <div style="display: flex; justify-content: flex-end; margin-top: 10px;" *ngIf="!isReadOnly">
                    <button class="add-btn small" (click)="addFieldGroup.emit()" style="padding: 2px 8px; font-size: 11px;">+ Group</button>
                </div>
            </div>   
        }        
    </div>
  `,
    styles: [`
    .field-settings-column {
      /* background: #f9f9f9; REMOVED */
      border-radius: 4px;
      padding: 0; /* Reduced from 8px */
      min-width: 0;
    }
    .sys-h4 { font-weight: bold; color: #333; margin: 0; }
    .field-list-header { 
        display: flex; 
        background-color: #f5f5f5; 
        height: 20px; 
        line-height: 20px; 
        align-items: center; 
        padding: 0 4px; 
        font-size: 11px; 
        font-weight: 600; 
        color: #666;
        border-radius: 4px;
        margin-bottom: 1px;
    }
    .editors-table { width: 100%; border-collapse: separate; border-spacing: 0 5px; table-layout: fixed; }
    .editors-table th { 
        background-color: #f5f5f5; 
        height: 20px; 
        padding: 0 4px; 
        font-size: 11px; 
        font-weight: 600; 
        color: #666; 
        text-align: left; 
        border: none;
    }
    .editors-table th:first-child { border-top-left-radius: 4px; border-bottom-left-radius: 4px; }
    .editors-table th:last-child { border-top-right-radius: 4px; border-bottom-right-radius: 4px; }
    .editors-table th.center { text-align: center; }
    .field-item {
      padding: 0;
      background: transparent;
      margin-bottom: 1px;
      border-radius: 0;
      box-shadow: none;
      border: none;
      margin-left: 10px;
    }
    .field-item.selected { background: #e3f2fd; border-color: #2196F3; }
    .field-main { display: flex; gap: 8px; margin-bottom: 0; align-items: center; width: 100%; }
    .field-main input[type="radio"] { flex: 0 0 20px; cursor: pointer; height: 16px; margin: 0; }
    .field-main input[type="text"] { flex: 2; min-width: 0; }
    .field-main select { flex: 1; min-width: 80px; }
    .icon-btn.delete { 
        color: red; font-size: 10px; height: 20px; width: 16px; padding: 0; 
        display: flex; align-items: center; justify-content: center; line-height: 1;
        background: #f5f5f5; border: 1px solid #ddd; cursor: pointer;
    }
    .empty-selection { padding: 10px; text-align: center; color: #999; font-style: italic; font-size: 13px; }
    .add-btn { background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; padding: 2px 8px; font-size: 11px; }
    .add-btn:disabled { background: #cccccc; cursor: not-allowed; opacity: 0.7; }
    .field-groups-section { margin-top: 20px; padding-top: 15px; }
    .flex-row { display: flex; gap: 10px; margin-bottom: 5px; align-items: center; }
    
    input[type="text"], select {
      height: 26px;
      padding: 0 6px;
      font-size: 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .empty-state-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 10px; min-height: 28px; }
  `]
})
export class BBTypeFieldListComponent {
    @Input() fields: BBField[] = [];
    @Input() fieldGroups: { id: number | string, text: string }[] = [];
    @Input() selectedField: BBField | null = null;
    @Input() isReadOnly = false;

    @Input() showSelectionRadio = true;
    @Input() showGroupDefinitions = true;

    @Input() availableTypes: BBType[] = []; // All types

    @Output() selectField = new EventEmitter<BBField>();
    @Output() addField = new EventEmitter<void>();
    @Output() removeField = new EventEmitter<number>();
    @Output() fieldsUpdated = new EventEmitter<void>();

    @Output() addFieldGroup = new EventEmitter<void>();
    @Output() removeFieldGroup = new EventEmitter<number>();

    @Output() fieldTypeChange = new EventEmitter<BBField>();

    get coreTypes() {
        return this.availableTypes.filter(t => !t.userDefined);
    }

    get customTypes() {
        return this.availableTypes.filter(t => t.userDefined);
    }

    onSelectField(field: BBField) {
        this.selectField.emit(field);
    }

    updateFieldSetting(field: BBField, settingId: string, value: any) {
        if (!field.settings) field.settings = {};
        field.settings[settingId] = value;
    }

    getFieldGroupId(field: BBField): any {
        return field.settings ? field.settings['UI.FieldGroup'] : null;
    }

    updateFieldGroup(field: BBField, groupId: any) {
        if (!field.settings) field.settings = {};
        if (groupId) {
            field.settings['UI.FieldGroup'] = groupId;
        } else {
            delete field.settings['UI.FieldGroup'];
        }
    }

    onFieldTypeChangeInternal(field: BBField) {
        this.fieldTypeChange.emit(field);
    }
}
