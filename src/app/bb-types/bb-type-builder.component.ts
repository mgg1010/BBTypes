// Force update - resolving cache issue
import { Component, EventEmitter, Output, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BBTypeService } from '../services/bb-type.service';
import { BBType, BBField, BBSettingDefinition, BBSettingListItem } from '../models/bb-types';
import { AppConfig } from '../models/app-models';
import { BBTypeFieldListComponent } from './bb-type-field-list.component';
import { AddSettingDialogComponent } from './dialogs/add-setting-dialog.component';
import { AddEditorSettingDialogComponent } from './dialogs/add-editor-setting-dialog.component';
import { DynamicFieldComponent } from '../shared/dynamic-field.component';
import { PublishedSettingsTabComponent } from './tabs/published-settings-tab.component';
import { ShowAllPropertiesDialogComponent } from './dialogs/show-all-properties-dialog.component';
import { ElementRef } from '@angular/core';
import { getVertEditSettings } from './bb-builder-helpers';
import { calculateControlWidth } from './layout-helpers';

@Component({
  selector: 'app-bb-type-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BBTypeFieldListComponent,
    AddSettingDialogComponent,
    AddEditorSettingDialogComponent,
    DynamicFieldComponent,
    PublishedSettingsTabComponent,
    ShowAllPropertiesDialogComponent
  ],
  template: `
    <div class="builder-container">
        @if (showHeader) {
            <div class="header-row">
                <h3>type Builder: {{ newType.name || 'New Type' }} ({{ newType.baseType }})</h3>
                <button class="close-btn" (click)="cancel.emit()">✕</button>
            </div>
        }

        <nav class="builder-tabs">
            <button [class.active]="activeTab === 'def'" (click)="activeTab = 'def'">Definition</button>
            <button [class.active]="activeTab === 'typeset'" (click)="activeTab = 'typeset'">Type Settings</button>
            
            
            <!-- Editor Tabs - one per editor in type's editors array -->
             @for (ed of newType.editors; track ed.id) {
                 @if (!ed.isHidden) {
                     <button [class.active]="activeTab === 'editor_' + ed.id" (click)="activeTab = 'editor_' + ed.id">{{ ed.name }}</button>
                 }
             }
        </nav>

        <div class="tab-content">
            <div [style.display]="activeTab === 'def' ? 'block' : 'none'">
            <!-- Basic Info -->
            <div class="form-row">
                <label>
                    Name: <input [(ngModel)]="newType.name" (ngModelChange)="onNameChange()" placeholder="Type Name" [disabled]="isReadOnly">
                </label>
                <label>
                    ID: <input #shortNameInput [(ngModel)]="newType.id" [disabled]="isReadOnly">
                </label>
                <label>
                    Based On: 
                    @if (isReadOnly) {
                        <input [value]="newType.baseType || '(Root Type)'" disabled>
                    } @else {
                        <select [(ngModel)]="basedOnType" (change)="onBasedOnChange()">
                            @for (type of availableBaseTypes; track type.id) {
                                <option [value]="type.id.toLowerCase()">{{ type.name }}</option>
                            }
                        </select>
                    }
                </label>
            </div>
            
             <div class="form-row" style="margin-bottom: 10px;">
                  <label class="sys-h4" style="width: 100%;">
                      Description:
                      <textarea 
                        #descInput
                        [(ngModel)]="newType.description" 
                        placeholder="Short description of this type" 
                        (input)="autoResize(descInput)"
                        [disabled]="isReadOnly"
                        rows="1"
                        class="desc-textarea"></textarea>
                  </label>
              </div>

              <div style="margin-top: 20px;">
                  <button class="secondary-btn" (click)="showPropertiesDialog = true">Show All Settings</button>
              </div>
            
            </div> <!-- End Def Tab -->

            @if (activeTab === 'typeset') {
            <!-- Type Settings List -->
            <div class="settings-list-container">
                <!-- Collapsible Custom Settings Section -->
                <div class="custom-settings-section" style="margin-bottom: 10px;">
                    <div class="scope-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" (click)="isCustomSettingsOpen = !isCustomSettingsOpen">
                        <strong>Custom Settings</strong>
                        <div style="font-size: 10px;">{{ isCustomSettingsOpen ? '▼' : '▶' }}</div>
                    </div>
                    @if (isCustomSettingsOpen) {
                        <div style="padding-bottom: 5px;">
                            <app-published-settings-tab 
                                [newType]="newType" 
                                [isReadOnly]="isReadOnly"
                                [selectableTypes]="selectableTypes"
                                [appConfig]="appConfig"
                                (requestShortNameFocus)="switchToDefAndFocus()">
                            </app-published-settings-tab>
                        </div>
                    }
                </div>

                <div class="settings-list">
                    @for (item of settingsList; track item.id; let i = $index) {
                        
                        <!-- Scope Header Row -->
                        @if (item.type === 'header') {
                            <div class="scope-header">
                                <strong>{{ item.label }}</strong>
                            </div>
                        } 
                        
                        <!-- Setting Row -->
                        @else {
                            <div class="setting-row-container">
                                <!-- Top Row: Label + Editor (if inline) + Tools -->
                                <div class="setting-top-row">
                                    <div class="setting-label-area">
                                        <span class="setting-label">{{ item.label }}:</span>
                                        @if (item.settingDef?.readOnly) {
                                            <span class="setting-flag" title="Read-only setting">RO</span>
                                        }
                                        @if (item.settingDef?.inputOutput === 1) {
                                            <span class="setting-flag output-flag" title="Output (calculated) setting">Output</span>
                                        }
                                    </div>

                                    <!-- Inline Editor Area (for non-complex) -->
                                    @if (!item.isComplex) {
                                         <div class="setting-editor-area">
                                             @if (item.id === 'Type.Editor') {
                                                 <select [(ngModel)]="item.value" class="std-input" (ngModelChange)="emitPreview()" [disabled]="isReadOnly">
                                                     @for (ed of getEditorsForItem(item); track ed.id) {
                                                         <option [value]="ed.id">{{ ed.name }}</option>
                                                     }
                                                 </select>
                                             } @else {
                                                <div class="dynamic-field-wrapper">
                                                   <app-dynamic-field
                                                        [typeId]="item.settingDef?.typeId || 'String'"
                                                        [subtypeId]="item.settingDef?.subtypeId"
                                                        [appConfig]="appConfig"
                                                        [(value)]="item.value"
                                                        [mode]="'edit'"
                                                        [isDisabled]="isReadOnly || !!item.readOnly"
                                                        [size]="'small'"
                                                        [settings]="item.settingDef && item.settingDef.values ? { 'Enum.Options': item.settingDef.values } : {}"
                                                        (valueChange)="emitPreview()">
                                                   </app-dynamic-field>
                                                </div>
                                             }
                                         </div>
                                    } @else {
                                        <!-- Spacer for complex items -->
                                        <div style="flex: 1;"></div>
                                    }

                                    <!-- Right Tools -->
                                    <div class="setting-tools" *ngIf="!isReadOnly">
                                        <button class="icon-btn" 
                                            [title]="item.hidden ? 'Hidden from parent types' : 'Published to parent types'"
                                            (click)="item.hidden = !item.hidden; emitPreview()">
                                            {{ item.hidden ? '🔒' : '🔓' }}
                                        </button>
                                        <button class="icon-btn delete" *ngIf="item.removable && !item.settingDef?.noDelete" (click)="removeSetting(i)">✕</button>
                                        <div style="width: 20px;" *ngIf="!item.removable || item.settingDef?.noDelete"></div>
                                    </div>
                                </div>

                                <!-- Bottom Row: Complex Editor (if complex) -->
                                @if (item.isComplex) {
                                    <div class="setting-complex-body">
                                        @if (item.component === 'fields') {
                                            <app-bb-type-field-list 
                                                [fields]="newType.fields || []"
                                                [fieldGroups]="fieldGroups"
                                                [showSelectionRadio]="false"
                                                [showGroupDefinitions]="false"
                                                [availableTypes]="availableTypes"
                                                [isReadOnly]="isReadOnly"
                                                (addField)="onAddField()"
                                                (removeField)="onRemoveField($event)"
                                                (selectField)="selectedField = $event"
                                                (fieldsUpdated)="emitPreview()">
                                            </app-bb-type-field-list>
                                        } @else if (item.component === 'groups') {
                                            <div class="groups-editor">
                                                <div class="list-header">
                                                    <div style="flex: 1;">Group Name</div>
                                                    <div style="width: 30px;"></div>
                                                </div>
                                                @if (fieldGroups.length === 0) {
                                                     <div class="empty-state-row" style="display: flex; justify-content: space-between; align-items: center; padding: 4px 10px; min-height: 28px;">
                                                         <div class="empty-msg" style="padding: 0;">No groups defined.</div>
                                                         <button class="add-btn" (click)="addFieldGroup()" *ngIf="!isReadOnly">+ Add Group</button>
                                                     </div>
                                                } @else {
                                                    @for (group of fieldGroups; track group.id; let i = $index) {
                                                        <div class="group-row">
                                                            <input type="text" [(ngModel)]="group.text" placeholder="Group Name" class="std-input" (ngModelChange)="emitPreview()" style="flex: 1;" [disabled]="isReadOnly">
                                                            <button class="icon-btn delete" (click)="removeFieldGroup(i)" *ngIf="!isReadOnly">✕</button>
                                                        </div>
                                                    }
                                                    <div style="display: flex; justify-content: flex-end; margin-top: 10px; padding-right: 8px;">
                                                        <button class="add-btn" (click)="addFieldGroup()" *ngIf="!isReadOnly">+ Add Group</button>
                                                    </div>
                                                }
                                            </div>
                                        } @else if (item.component === 'editors') {
                                             <div class="editors-table-container">
                                                <table class="editors-table">
                                                    <thead>
                                                        <tr>
                                                            <th style="width: 30%;">Editor</th>
                                                            <th style="width: 15%;">ID</th>
                                                            <th style="width: 25%;">Based On</th>
                                                            <th class="center" style="width: 70px;">Published</th>
                                                            <th class="center" style="width: 60px;">Default</th>
                                                            <th class="center" style="width: 50px;">Delete</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <!-- Base Editor (Read Only Mock) - Visuals match editable rows but disabled -->
                                                        <!-- Base Editor (Read Only Mock) -->
                                                        <tr class="readonly-row" *ngIf="baseEditor">
                                                            <td><input type="text" [value]="baseEditor.name" class="std-input" disabled style="width: 100%"></td>
                                                            <td><input type="text" [value]="baseEditor.id" class="std-input" disabled style="width: 100%"></td>
                                                            <td>
                                                                <select class="std-input" disabled style="width: 100%">
                                                                    <option>Base Editor</option>
                                                                </select>
                                                            </td>
                                                            <td class="center">
                                                                <button class="icon-btn" disabled title="Base editor cannot be hidden">
                                                                    🔓
                                                                </button>
                                                            </td>
                                                            <td class="center"><input type="radio" name="defaultEditor" [value]="baseEditor.id" [checked]="newType.settings?.['Type.Editor'] === baseEditor.id" (click)="isReadOnly ? null : setDefaultEditor(baseEditor.id)"></td>
                                                            <td class="center"></td>
                                                        </tr>
                                                        <!-- Custom Editors -->
                                                        @for (ed of newType.editors; track ed.id; let i = $index) {
                                                            <tr>
                                                                <td><input type="text" [(ngModel)]="ed.name" class="std-input" placeholder="Name" (ngModelChange)="emitPreview()" style="width: 100%" [disabled]="isReadOnly"></td>
                                                                <td><input type="text" [(ngModel)]="ed.id" class="std-input" placeholder="ID" (ngModelChange)="emitPreview()" style="width: 100%" [disabled]="isReadOnly"></td>
                                                                <td>
                                                                    <select class="std-input" style="width: 100%" [(ngModel)]="ed.baseEditorId" [disabled]="isReadOnly">
                                                                        @for (base of availableEditors; track base.id) {
                                                                            <option [value]="base.id">{{ base.name }}</option>
                                                                        }
                                                                    </select>
                                                                </td>
                                                                    <td class="center">
                                                                        <button class="icon-btn" 
                                                                            [title]="ed.isHidden ? 'Hidden from parent types' : 'Published to parent types'" 
                                                                            (click)="toggleEditorVisibility(ed)"
                                                                            [disabled]="isReadOnly"> 
                                                                            {{ ed.isHidden ? '🔒' : '🔓' }}
                                                                        </button>
                                                                    </td>
                                                                <td class="center"><input type="radio" name="defaultEditor" [value]="ed.id" [checked]="newType.settings?.['Type.Editor'] === ed.id" (click)="isReadOnly ? null : setDefaultEditor(ed.id)" [disabled]="isReadOnly"></td>
                                                                <td class="center"><button class="icon-btn delete" (click)="removeEditor(i)" *ngIf="!isReadOnly">✕</button></td>
                                                            </tr>
                                                        }
                                                    </tbody>
                                                </table>
                                                <div style="display: flex; justify-content: flex-end; margin-top: 10px; padding-right: 8px;">
                                                    <button class="add-btn" (click)="addEditor()" *ngIf="!isReadOnly">+ Add Editor</button>
                                                </div>
                                             </div>
                                        }
                                    </div>
                                }
                            </div>
                        }
                    }
                </div> 

                <button class="add-setting-btn" (click)="showAddDialog = true" *ngIf="!isReadOnly">+ Add Setting</button>
            </div>
            }
            
            <!-- Editor Tabs Content -->
            <div *ngIf="isEditorTab(activeTab)">
                <div class="settings-list-container">
                    
                     <!-- Custom Settings for this Editor -->
                     <div class="custom-settings-section" style="margin-bottom: 20px;">
                        <div class="scope-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" (click)="toggleCustomSettings(activeTab)">
                            <strong>Custom Settings</strong>
                            <div style="font-size: 10px;">{{ isCustomSettingsOpenMap.get(activeTab) ? '▼' : '▶' }}</div>
                        </div>
                        @if (isCustomSettingsOpenMap.get(activeTab)) {
                            <div style="padding-bottom: 5px;">
                                <app-published-settings-tab 
                                    [newType]="newType" 
                                    [isReadOnly]="isReadOnly || isEditorTabReadOnly(activeTab)"
                                    [selectableTypes]="selectableTypes"
                                    [appConfig]="appConfig"
                                    [prefixOverride]="getEditorPrefix(activeTab)">
                                </app-published-settings-tab>
                            </div>
                        }
                    </div>

                     <div class="settings-list">
                         @for (item of getEditorSettingsList(activeTab); track item.id; let i = $index) {
                             @if (item.type === 'header') {
                                 <div class="scope-header">
                                     <strong>{{ item.label }}</strong>
                                 </div>
                             } @else {
                                 <div class="setting-row-container">
                                     <div class="setting-top-row">
                                         <div class="setting-label-area">
                                             <span class="setting-label">{{ item.label }}:</span>
                                         </div>
                                         <div class="setting-editor-area">
                                                <div class="dynamic-field-wrapper">
                                                    <app-dynamic-field
                                                        [typeId]="item.settingDef?.typeId || 'String'"
                                                        [subtypeId]="item.settingDef?.subtypeId"
                                                        [appConfig]="appConfig"
                                                        [(value)]="item.value"
                                                        [mode]="'edit'"
                                                        [isDisabled]="isEditorTabReadOnly(activeTab) || !!item.readOnly || isReadOnly"
                                                        [explicitValues]="item.settingDef?.values"
                                                        [size]="'small'"
                                                        (valueChange)="emitPreview()">
                                                    </app-dynamic-field>
                                                </div>
                                         </div>
                                         <div class="setting-tools" *ngIf="!isEditorTabReadOnly(activeTab) && !isReadOnly">
                                              <button class="icon-btn delete" *ngIf="item.removable" (click)="removeEditorSetting(activeTab, i)">✕</button>
                                         </div>
                                     </div>
                                 </div>
                             }
                         }
                     </div>

                     <button class="add-setting-btn" *ngIf="!isEditorTabReadOnly(activeTab) && !isReadOnly" (click)="showAddEditorDialog = true">+ Add Setting</button>
                </div>
            </div>
            
        </div>
        
        <div class="footer">
            <button class="cancel-btn" (click)="cancel.emit()">Cancel</button>
            <button class="save-btn" (click)="save()" *ngIf="!isReadOnly">Save</button>

        @if (showAddDialog) {
            <app-add-setting-dialog
                [currentType]="newType"
                [existingSettings]="existingSettingsForDialog"
                [appConfig]="appConfig"
                (cancel)="showAddDialog = false"
                (add)="onAddSetting($event)">
            </app-add-setting-dialog>
        }

        @if (showAddEditorDialog) {
            <app-add-editor-setting-dialog
                [currentType]="newType"
                [currentEditor]="currentEditorForDialog"
                [existingSettings]="getExistingEditorSettingsForDialog"
                [appConfig]="appConfig"
                (cancel)="showAddEditorDialog = false"
                (add)="onAddEditorSetting($event)">
            </app-add-editor-setting-dialog>
        }

        @if (showPropertiesDialog) {
            <app-show-all-properties-dialog
                [type]="newType"
                [baseEditor]="baseEditor"
                [appConfig]="appConfig"
                (cancel)="showPropertiesDialog = false">
            </app-show-all-properties-dialog>
        }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: hidden; }
    .builder-container { background: white; height: 100%; display: flex; flex-direction: column; padding: 0; box-sizing: border-box; overflow: hidden; }
    .header-row { padding: 15px; background: #FFF3E0; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #FFCC80; }
    .header-row h3 { margin: 0; color: #E65100; }
    
    .builder-tabs { display: flex; border-bottom: 2px solid #eee; background: #fafafa; }
    .builder-tabs button { padding: 10px 20px; border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600; }
    .builder-tabs button.active { border-bottom-color: #2196F3; color: #2196F3; background: white; }
    
    .tab-content { flex: 1; overflow-y: auto; padding: 20px; background: #fdfdfd; min-height: 0; padding-bottom: 60px; }
    
    .settings-list { display: flex; flex-direction: column; gap: 0; margin-bottom: 20px; /* border: 1px solid #ddd; */ border-bottom: none; }
    
    .scope-header { background: #eee; padding: 4px 15px; color: #333; font-size: 13px; letter-spacing: 0.5px; font-weight: bold; margin-top: 5px; }
    .setting-row-container { background: white; /* border-bottom: 1px solid #ddd; */ }
    
    .setting-top-row { display: flex; align-items: flex-start; padding: 4px 15px; min-height: 32px; gap: 10px; }
    .setting-label-area { width: 90px; display: flex; align-items: center; padding-top: 4px; } /* Reduced width by 40px, top-aligned */
    .setting-label { font-weight: 500; font-size: 13px; color: #444; }
    
    .setting-editor-area { display: flex; align-items: center; margin-right: auto; } /* Hug content, push rest right */
    .setting-tools { display: flex; gap: 15px; align-items: center; margin-left: 15px; position: relative; top: -4px; right: -20px; }
    
    .setting-complex-body { padding: 0 15px 0 40px; /* Indented content */ }

    .icon-btn { cursor: pointer; background: none; border: none; font-size: 14px; padding: 0 4px; }
    .delete { color: #d32f2f; cursor: pointer; background: none; border: none; font-size: 14px; }
    
    .delete { color: #d32f2f; cursor: pointer; background: none; border: none; font-size: 14px; }
    
    .add-btn { background: #4CAF50; color: white; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 11px; }
    .add-btn:hover { background: #43A047; }
    
    .add-setting-btn { width: 100%; padding: 10px; border: 2px dashed #ccc; background: #fafafa; cursor: pointer; border-radius: 6px; color: #666; font-weight: bold; margin-top: 15px; }
    .add-setting-btn:hover { border-color: #bbb; background: #f0f0f0; }

    .footer { padding: 15px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 10px; background: white; }
    .save-btn { background: #2196F3; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
    .cancel-btn { background: #eee; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
    .secondary-btn { background: #607d8b; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
    
    .form-row { display: flex; gap: 20px; margin-bottom: 20px; }
    .form-row label { font-weight: bold; font-size: 12px; display: flex; flex-direction: column; gap: 5px; }
    .sys-h4 { font-weight: bold; color: #333; margin: 0; display: block; margin-bottom: 5px; }
    .desc-textarea { width: 100%; min-height: 30px; resize: none; overflow: hidden; padding: 6px; box-sizing: border-box; font-family: inherit; font-size: inherit; border: 1px solid #ccc; border-radius: 4px; }
    .form-row input, .form-row select { padding: 0 6px; border: 1px solid #ccc; border-radius: 4px; width: 200px; height: 26px; font-size: 13px; box-sizing: border-box; }
    
    .list-header { 
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
        text-transform: none;
    }

    .editors-table { width: 100%; border-collapse: separate; border-spacing: 0 1px; table-layout: fixed; }
    .editors-table th { 
        background-color: #f5f5f5; 
        height: 20px; 
        padding: 0 4px; 
        font-size: 11px; 
        font-weight: 600; 
        color: #666; 
        text-align: left; 
        border: none;
        text-transform: none;
    }
    .editors-table input.std-input, .editors-table select.std-input { min-width: 0; }
    .editors-table th:first-child { border-top-left-radius: 4px; border-bottom-left-radius: 4px; }
    .editors-table th:last-child { border-top-right-radius: 4px; border-bottom-right-radius: 4px; }
    
    .editors-table td { padding: 4px 8px; vertical-align: middle; }
    .editors-table .center { text-align: center; }
    .editors-table .center input[type="radio"] { vertical-align: middle; margin: 0; position: relative; top: 1px; cursor: pointer; }
    
    .std-input { height: 26px; padding: 0 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; min-width: 150px; box-sizing: border-box; }
    
    .dynamic-field-wrapper { width: 300px; } 

    .settings-btn { font-size: 14px; cursor: pointer; border: none; background: none; }


    .group-row { display: flex; gap: 10px; margin-bottom: 1px; align-items: center; margin-left: 10px; }
    .empty-msg { padding: 10px; text-align: center; color: #999; font-style: italic; font-size: 13px; }

    .groups-editor, .editors-table-container {
        /* background: #f9f9f9; REMOVED */
        border-radius: 4px;
        padding: 0; /* Reduced from 8px */
    }

    .placeholder-editor { padding: 20px; text-align: center; color: #999; border: 1px solid #eee; border-radius: 4px; }
    
    .disabled-block { pointer-events: none; opacity: 0.7; }
  `]
})
export class BBTypeBuilderComponent implements OnInit {
  @Input() showHeader = true;
  @Input() isAnonymousMode = false;
  @Input() editingType: BBType | null = null;
  @Input() appConfig: AppConfig | null = null;

  isCustomSettingsOpen = false;
  isCustomSettingsOpenMap: Map<string, boolean> = new Map();

  @Output() cancel = new EventEmitter<void>();
  @Output() create = new EventEmitter<BBType>();
  @Output() previewUpdate = new EventEmitter<BBType>();

  newType: any = { name: '', baseType: 'Struct', fields: [], editors: [] };
  basedOnType = 'struct';
  activeTab = 'def'; // 'def', 'pub', 'over', 'editor_ID'

  settingsList: BBSettingListItem[] = [];
  editorSettingsListMap: Map<string, BBSettingListItem[]> = new Map();
  showAddDialog = false;
  showAddEditorDialog = false;
  showPropertiesDialog = false;

  selectedField: BBField | null = null;
  fieldGroups: any[] = []; // Mock

  availableEditors: any[] = [];

  constructor(private bbTypeService: BBTypeService) { }

  get availableTypes(): BBType[] {
    return this.bbTypeService.getTypes();
  }

  get selectableTypes(): BBType[] {
    // Mock helper or use service
    return this.availableTypes.filter(t => t.source !== 'Type Defined');
  }

  get availableBaseTypes(): BBType[] {
    if (this.isReadOnly) {
      // In read-only mode, show all types for display purposes
      return this.availableTypes;
    } else {
      // In edit mode, only show types that can be used as a base
      // These are root types (baseType === null) or fundamental base types
      return this.availableTypes.filter(t =>
        t.baseType === null ||
        ['Struct', 'List', 'Enum', 'Union', 'Dict'].includes(t.id)
      );
    }
  }


  get isReadOnly(): boolean {
    return !!this.editingType && !this.editingType.userDefined;
  }

  @ViewChild('descInput') set descInputRef(ref: ElementRef<HTMLTextAreaElement>) {
    if (ref) {
      setTimeout(() => this.autoResize(ref.nativeElement), 0);
    }
  }
  @ViewChild('shortNameInput') shortNameInputRef!: ElementRef;

  autoResize(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  switchToDefAndFocus() {
    this.activeTab = 'def';
    setTimeout(() => {
      if (this.shortNameInputRef) {
        this.shortNameInputRef.nativeElement.focus();
      }
    });
  }

  get existingSettingsForDialog() {
    return this.settingsList
      .filter(item => item.type === 'setting' && item.settingDef)
      .map(item => {
        let textScope = item.scope || 'root';
        let scope: { field?: string, type?: string } | undefined;

        if (textScope === 'root') {
          scope = undefined;
        } else if (textScope === 'fields:all') {
          // Map implicit 'all' to explicit wildcards to match dialog's new behavior
          scope = { field: '*', type: '*' };
        } else if (textScope.startsWith('field:')) {
          scope = { field: textScope.substring(6) };
        } else if (textScope.startsWith('type:')) {
          scope = { type: textScope.substring(5) };
        }

        return {
          settingId: item.settingDef!.id,
          scope
        };
      });
  }

  toggleCustomSettings(tabId: string) {
    this.isCustomSettingsOpenMap.set(tabId, !this.isCustomSettingsOpenMap.get(tabId));
  }

  baseEditor: any = null;

  ngOnInit() {
    // Determine Base Context
    // Determine Base Context
    let baseKind: string | null = 'Struct';
    let subtypeId: string | undefined;

    if (this.editingType) {
      this.newType = JSON.parse(JSON.stringify(this.editingType));

      // Initialize basedOnType for the dropdown
      this.basedOnType = (this.newType.baseType || 'struct').toLowerCase();


      if (this.newType.baseType === null) {
        // Root Type: No inheritance
        this.availableEditors = [];
      } else {
        baseKind = this.newType.baseType;
        if (baseKind === 'List' || baseKind === 'Basic') subtypeId = this.newType.subtypeId;
        else if (baseKind !== 'Struct' && baseKind !== 'Core' && baseKind !== 'Enum') baseKind = 'Struct';

        this.availableEditors = this.bbTypeService.getDefaultEditorsForBase(baseKind, subtypeId);
      }
    } else {
      // New Type Creation
      if (this.isAnonymousMode) {
        this.newType = { name: '', baseType: 'Struct', fields: [], editors: [] };
        baseKind = 'Struct';
      } else {
        this.newType = this.bbTypeService.createNewType('Struct', 'New Prototype');
        baseKind = 'Struct';
      }
      this.availableEditors = this.bbTypeService.getDefaultEditorsForBase(baseKind, subtypeId);
    }

    // ... rest of init logic ...
    // Ensure default editor setting logic uses the initialized editors?
    // createNewType already copied editors.

    // Set Base Editor (The one that is inherited / default)
    if (this.availableEditors.length > 0) {
      this.baseEditor = this.availableEditors[0];
    } else {
      this.baseEditor = { id: '__sys_default__', name: 'Default Editor' };
    }


    // Ensure default editor setting is present (service might have done it via copy, but safe to check)
    if (!this.newType.settings) this.newType.settings = {};
    if (!this.newType.settings['Type.Editor']) {
      this.newType.settings['Type.Editor'] = this.baseEditor.id;
    }

    this.initializeSettingsList();
  }

  get getExistingEditorSettingsForDialog() {
    if (!this.activeTab.startsWith('editor_')) return [];
    const list = this.getEditorSettingsList(this.activeTab);
    return list.map(item => {
      const result: any = { settingId: item.id };

      // Parse scope
      const s = item.scope || 'root';
      if (s === 'root') {
        result.scope = undefined;
      } else {
        const parts = s.split(':');
        const scopeObj: any = {};
        for (let i = 0; i < parts.length; i += 2) {
          const key = parts[i];
          const val = parts[i + 1];
          if (key === 'f') scopeObj.field = (val === 'all') ? '*' : val;
          if (key === 't') scopeObj.type = val;
          if (key === 'e') scopeObj.editor = val;
        }
        result.scope = scopeObj;
      }
      return result;
    });
  }





  initializeSettingsList() {
    this.settingsList = [];

    // 1. Seed Root Header
    this.settingsList.push({
      id: 'root_header',
      label: 'Type Settings',
      type: 'header',
      scope: 'root'
    });



    this.initializeSettingsListContinue();
  }

  save() {
    // Validate Mandatory Settings
    const mandatorySettings = this.settingsList.filter(item => item.settingDef?.mandatory);
    for (const item of mandatorySettings) {
      if (item.settingDef?.id === 'Struct.Fields') {
        if (!this.newType.fields || this.newType.fields.length === 0) {
          alert(`The '${item.label}' setting is mandatory. Please add at least one field.`);
          return;
        } else {
          // Generic check (e.g. for Lists or strings)
          // If value is undefined, null, or empty array/string?
          const val = item.value;
          if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0)) {
            alert(`The '${item.label}' setting is mandatory.`);
            return;
          }
        }
      }

      this.create.emit(this.newType);
    }
  }

  getEditorsForItem(item: BBSettingListItem): any[] {
    if (!item.scope || item.scope === 'root') {
      return this.availableEditors;
    }

    if (item.scope.startsWith('field:')) {
      const fieldName = item.scope.split('field:')[1];
      const field = this.newType.fields.find((f: any) => f.name === fieldName);
      if (field) {
        const type = this.availableTypes.find(t => t.id === field.typeId);
        if (type) {
          if (type.editors && type.editors.length > 0) return type.editors;
          return this.bbTypeService.getDefaultEditorsForBase(type.baseType, type.subtypeId);
        }
      }
    }
    return [];
  }

  initializeSettingsListContinue() {

    // Add all settings from Type Definitions
    const allDefs = this.bbTypeService.getAvailableSettings(this.newType);

    const handledIds: string[] = []; // All settings flow through standard path now

    allDefs.forEach(def => {
      if (handledIds.includes(def.id)) return;

      // Determine value: 
      // 1. Check newType.settings (override)
      // 2. Check default value from def
      let value = this.newType.settings?.[def.id];
      if (value === undefined) {
        value = def.defaultValue;
        // If defaultValue is undefined, maybe use service default for type?
        if (value === undefined) {
          value = this.bbTypeService.getDefaultValue(def.typeId);
        }
      }

      // Add to list
      this.settingsList.push({
        id: def.id,
        label: def.name,
        type: 'setting',
        scope: 'root', // Assuming root for type settings
        hidden: false, // Default visibility? Or check if it's an override? 
        // If it is NOT in newType.settings, it's effectively "inherited" (but we show it here to allow override?)
        // Actually, builder usually shows what IS overridden or allows adding.
        // But user screenshot shows "System Types", "Type Defined", etc. which are base settings of BBType.
        // So we should show them.
        removable: !def.noDelete,
        settingDef: def,
        value: value,
        isComplex: def.typeId === 'List' || def.typeId === 'Struct' || def.typeId === 'Custom' // Basic check
      });

      // Debug: Log Type.Editors value
      if (def.id === 'Type.Editors') {
        console.log('Type.Editors setting - def.defaultValue:', def.defaultValue);
        console.log('Type.Editors setting - computed value:', value);
        console.log('Type.Editors setting - newType.editors:', this.newType.editors);
      }
    });
  }

  onBasedOnChange() {
    if (this.basedOnType === 'struct') {
      this.newType.baseType = 'Struct';
    } else {
      this.newType.baseType = 'Basic';
      this.newType.subtypeId = 'string';
    }
    this.initializeSettingsList();
    this.emitPreview();
  }

  onAddSetting(event: { setting: BBSettingDefinition, scope?: { field?: string, type?: string }, defaultValue?: any }) {
    this.showAddDialog = false;

    let headerLabel = 'Type Settings';
    let scopeId = 'root';

    if (event.scope) {
      if (event.scope.field && event.scope.field !== '*') {
        headerLabel = `Field: ${event.scope.field} ${event.scope.type && event.scope.type !== '*' ? '(' + event.scope.type + ')' : ''}`;
        scopeId = `field:${event.scope.field}`;
      } else if (event.scope.type && event.scope.type !== '*') {
        headerLabel = `All ${event.scope.type} Fields`;
        scopeId = `type:${event.scope.type}`;
      } else {
        headerLabel = 'All Fields';
        scopeId = 'fields:all';
      }
    }

    // Find if header exists
    let headerIndex = this.settingsList.findIndex(x => x.type === 'header' && x.scope === scopeId);

    if (headerIndex === -1 && scopeId !== 'root') {
      // Append new header at end
      this.settingsList.push({
        id: 'header_' + scopeId,
        label: headerLabel,
        type: 'header',
        scope: scopeId
      });
      headerIndex = this.settingsList.length - 1;
    } else if (headerIndex === -1 && scopeId === 'root') {
      // Should exist from init
      headerIndex = 0;
    }

    // Insert new setting after header (and its existing children)
    // Find last child of this scope
    let insertIndex = headerIndex + 1;
    while (insertIndex < this.settingsList.length && this.settingsList[insertIndex].scope === scopeId && this.settingsList[insertIndex].type !== 'header') {
      insertIndex++;
    }

    const settingType = this.availableTypes.find(t => t.id === event.setting.typeId);
    const isComplex = settingType ? (
      settingType.baseType === 'List' ||
      settingType.baseType === 'Struct' ||
      settingType.baseType === 'Union' ||
      settingType.baseType === 'Dict'
    ) : false;

    const newItem: BBSettingListItem = {
      id: 'setting_' + Date.now(),
      label: event.setting.name,
      type: 'setting',
      scope: scopeId,
      hidden: false,
      removable: true,
      settingDef: event.setting,
      value: event.defaultValue !== undefined ? event.defaultValue : this.bbTypeService.getDefaultValue(event.setting.typeId),
      isComplex: isComplex
    };

    this.settingsList.splice(insertIndex, 0, newItem);
    this.emitPreview();
  }

  removeSetting(index: number) {
    const item = this.settingsList[index];
    this.settingsList.splice(index, 1);

    if (item.scope && item.scope !== 'root') {
      const hasSettings = this.settingsList.some(
        x => x.scope === item.scope && x.type === 'setting'
      );

      if (!hasSettings) {
        const headerIndex = this.settingsList.findIndex(
          x => x.scope === item.scope && x.type === 'header'
        );
        if (headerIndex !== -1) {
          this.settingsList.splice(headerIndex, 1);
        }
      }
    }

    this.emitPreview();
  }

  // Field List Delegations
  onAddField() {
    this.newType.fields.push({ name: '', typeId: 'String' });
    this.emitPreview();
  }
  onRemoveField(index: number) {
    this.newType.fields.splice(index, 1);
    this.emitPreview();
  }

  addFieldGroup() {
    // Find max ID
    const maxId = this.fieldGroups.reduce((max, g) => Math.max(Number(g.id) || 0, max), 0);
    this.fieldGroups.push({ id: maxId + 1, text: `Group ${maxId + 1}` });
    this.emitPreview();
  }

  removeFieldGroup(index: number) {
    this.fieldGroups.splice(index, 1);
    this.emitPreview();
  }

  addEditor() {
    // Generate unique ID
    const baseId = 'NewEdit';
    let uniqueId = baseId;
    let counter = 1;

    const existingIds = this.newType.editors.map((e: any) => e.id);
    while (existingIds.includes(uniqueId)) {
      uniqueId = `${baseId}${counter}`;
      counter++;
    }

    this.newType.editors.push({
      id: uniqueId,
      name: 'New Editor',
      baseEditorId: 'VertEdit', // Default base
      settingDefinitions: []
    });
    this.emitPreview();
  }

  setDefaultEditor(editorId: string) {
    if (!this.newType.settings) {
      this.newType.settings = {};
    }
    this.newType.settings['Type.Editor'] = editorId;
    this.emitPreview();
  }

  removeEditor(index: number) {
    const removedEditor = this.newType.editors[index];
    this.newType.editors.splice(index, 1);

    // If the removed editor was the default, pick a new one
    if (this.newType.settings?.['Type.Editor'] === removedEditor.id) {
      if (this.newType.editors.length > 0) {
        // Set to last editor
        this.newType.settings['Type.Editor'] = this.newType.editors[this.newType.editors.length - 1].id;
      } else {
        // Default to base
        this.newType.settings['Type.Editor'] = 'VertEdit';
      }
    }

    // If active tab was this editor, switch back to Definition
    if (this.activeTab === 'editor_' + removedEditor.id) {
      this.activeTab = 'def';
    }

    this.emitPreview();
  }



  emitPreview() {
    this.updateCalculatedWidths();
    this.previewUpdate.emit(this.newType);
  }

  updateCalculatedWidths() {
    // 1. Determine Context (Default Editor vs Specific Editor)
    // For now, simpler implementation mainly targeting the Default Editor (Type Settings)
    // or just update both contexts if possible.

    // Update Default Editor settings (Type Settings tab)
    if (this.newType && this.newType.settings) {
      // Gather current settings from the list to ensure we have latest inputs
      // (Though ngModel binds directly to item.value, and init maps value to newType.settings? 
      // Actually initializeSettingsList binds item.value to newType.settings values or copies?)
      // In initialize: value: this.newType.settings[...] || default.
      // And ngModel updates item.value. 
      // We might need to sync back to settings object first or just read from newType.settings if they are bound reference?
      // Looking at init: value: this.newType.settings[...] - primitive copy if string/bool?
      // Ah, typically it's copy. But we need to see how save works. 
      // Wait, 'emitPreview' is called on change.
      // We should ensure newType.settings is updated from settingsList before calculating? 
      // Or just read from settingsList. 

      // Let's create a proxy settings object from the current UI state
      const currentSettings: Record<string, any> = { ...this.newType.settings };
      this.settingsList.forEach(item => {
        if (item.type === 'setting' && item.settingDef) {
          currentSettings[item.settingDef.id] = item.value;
        }
      });

      // Identify Default Editor
      const defaultEditorId = currentSettings['Type.Editor'] || 'default';
      const defaultEditor = this.availableEditors.find(e => e.id === defaultEditorId) || this.newType.editors.find((e: any) => e.id === defaultEditorId);

      const result = calculateControlWidth(this.newType, defaultEditor, currentSettings, this.bbTypeService);

      // Update UI List
      this.updateSettingListItem('Editor.ControlMinWidth', result.min);
      this.updateSettingListItem('Editor.ControlMaxWidth', result.max);

      // Persist to type settings (as read-only value)
      this.newType.settings['Editor.ControlMinWidth'] = result.min;
      this.newType.settings['Editor.ControlMaxWidth'] = result.max;
    }
  }

  updateSettingListItem(id: string, value: any) {
    const item = this.settingsList.find(x => x.settingDef?.id === id);
    if (item) {
      item.value = value;
      item.readOnly = true; // Ensure it's read only
    }
  }

  toggleEditorVisibility(editor: any) {
    editor.isHidden = !editor.isHidden;
    if (editor.isHidden && this.activeTab === 'editor_' + editor.id) {
      this.activeTab = 'def';
    }
    this.emitPreview();
  }

  // --- Editor Settings Logic ---

  get currentEditorForDialog(): any {
    if (!this.activeTab.startsWith('editor_')) return null;
    const id = this.activeTab.substring(7); // remove 'editor_'
    if (!id) return null;
    return this.newType.editors.find((e: any) => e.id === id);
  }


  getEditorSettingsList(tabId: string): BBSettingListItem[] {
    if (!this.editorSettingsListMap.has(tabId)) {
      let list: BBSettingListItem[] = [];
      const editorId = tabId.replace('editor_', '');

      // Find the editor definition
      let editor: any = null;
      if (this.baseEditor && this.baseEditor.id === editorId) {
        editor = this.baseEditor;
      } else {
        editor = this.newType.editors.find((e: any) => e.id === editorId);
      }

      if (editor && editor.settingDefinitions) {
        // If it's the specific 'VertEdit', we might still use the helper if it adds special UI logic
        // But generally we should map from definitions.
        // The helper 'getVertEditSettings' seems to return specific UI-ready items.
        // Let's stick to generic mapping if possible, or use helper if ID matches.

        if (editorId === 'VertEdit') {
          list = getVertEditSettings();
          // Bind values
          list.forEach(item => {
            if (item.settingDef) {
              item.value = this.newType.settings?.[item.settingDef.id];
            }
          });
        } else {
          // Generic mapping

          if (editor.settingDefinitions && editor.settingDefinitions.length > 0) {
            list.push({
              id: 'hdr_props',
              label: 'Editor Properties',
              type: 'header',
              scope: 'root'
            });
          }

          const genericList = (editor.settingDefinitions as BBSettingDefinition[]).map(def => ({
            id: def.id,
            label: def.name,
            type: 'setting' as const,
            settingDef: def,
            value: this.newType.settings?.[def.id] !== undefined ? this.newType.settings[def.id] : def.defaultValue,
            isComplex: false
            // Note: Complex handling (fields/groups) usually in Type Settings, not Editor Settings.
            // Unless the editor *is* complex.
          }));
          list = list.concat(genericList);
        }
      }

      // Filter settings for System Core types (like Number, String) to hide standard settings
      // User request: "it should only show custom settings which will be an empty list for number"
      if (this.newType.baseType === 'Core' && !this.newType.userDefined) {
        list = list.filter(item => item.settingDef?.isCustom);
      }

      this.editorSettingsListMap.set(tabId, list);
    }
    return this.editorSettingsListMap.get(tabId) || [];
  }

  isEditorTabReadOnly(tabId: string): boolean {
    // Base editor 'VertEdit' is read only
    return tabId === 'editor_VertEdit';
  }

  isEditorTab(tabId: string): boolean {
    return !!(tabId && tabId.startsWith('editor_'));
  }

  removeEditorSetting(tabId: string, index: number) {
    const list = this.getEditorSettingsList(tabId);
    const item = list[index];
    list.splice(index, 1);

    // Remove empty header if needed
    if (item.scope && item.scope !== 'root') {
      const hasSiblings = list.some(x => x.scope === item.scope && x.type === 'setting');
      if (!hasSiblings) {
        const headerIndex = list.findIndex(x => x.scope === item.scope && x.type === 'header');
        if (headerIndex !== -1) list.splice(headerIndex, 1);
      }
    }
  }

  onAddEditorSetting(event: { setting: BBSettingDefinition, scope?: { field?: string, type?: string, editor?: string }, defaultValue?: any }) {
    this.showAddEditorDialog = false;

    const list = this.getEditorSettingsList(this.activeTab);

    // Generate Header & Scope ID
    let headerLabel = 'Base Editor Settings';
    let scopeId = 'root';

    if (event.scope) {
      const f = event.scope.field;
      const t = event.scope.type;
      const e = event.scope.editor;

      // Logic from User Request
      if (f && f !== '*' && e && e !== '*') {
        // Field: Name, Editor: Spec
        headerLabel = `Field: ${f}, Editor: ${this.getEditorName(e)}`;
        scopeId = `f:${f}:e:${e}`;
      } else if (f === '*' && t && t !== '*' && e && e !== '*') {
        // All Fields, Type: Spec, Editor: Spec
        headerLabel = `All Fields, Type: ${this.capitalize(t || '')}, Editor: ${this.getEditorName(e)}`;
        scopeId = `f:all:t:${t}:e:${e}`;
      } else if (f === '*' && t && t !== '*' && e === '*') {
        // All Fields, Type: Spec, All Editors
        headerLabel = `All Fields, Type: ${this.capitalize(t || '')}, All Editors`;
        scopeId = `f:all:t:${t}:e:all`;
      } else if (f === '*' && t === '*' && e === '*') {
        // All Fields, All Types, All Editors
        headerLabel = `All Fields, All Types, All Editors`;
        scopeId = `global`;
      } else if (f === '*' && e && e !== '*') {
        // All fields, Editor: Spec (implied type irrelevant?)
        // "All Fields, Editor: Core String Editor" (User example 2)
        //Wait, user example 2 was "Field: All, Type: <Specific> Editor: <Specific>".
        // What if Type is not specific? "Field: All, Editor: Spec". 
        // If I select "All Fields", and "All Types" is selected, and "Specific Editor".
        headerLabel = `All Fields, All Types, Editor: ${this.getEditorName(e)}`;
        scopeId = `f:all:t:all:e:${e}`;
      }
    }

    // Add Header if missing
    let headerIndex = list.findIndex(x => x.type === 'header' && x.scope === scopeId);
    if (headerIndex === -1 && list.length === 0) {
      // First item
      list.push({ id: 'h_' + scopeId, label: headerLabel, type: 'header', scope: scopeId });
      headerIndex = 0;
    } else if (headerIndex === -1) {
      list.push({ id: 'h_' + scopeId, label: headerLabel, type: 'header', scope: scopeId });
      headerIndex = list.length - 1;
    }

    // Insert Setting
    let insertIndex = headerIndex + 1;
    while (insertIndex < list.length && list[insertIndex].scope === scopeId && list[insertIndex].type !== 'header') {
      insertIndex++;
    }

    list.splice(insertIndex, 0, {
      id: 'es_' + Date.now(),
      label: event.setting.name,
      type: 'setting',
      scope: scopeId,
      settingDef: event.setting,
      value: event.defaultValue,
      removable: true,
      isComplex: false
    });
  }

  getEditorName(id: string): string {
    const ed = this.availableEditors.find(e => e.id === id);
    return ed ? ed.name : id;
  }

  private capitalize(s: string): string {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  getEditorPrefix(tabId: string): string | undefined {
    if (!tabId.startsWith('editor_')) return undefined;
    const editorId = tabId.substring(7);

    // Check if it's the Base Editor
    if (this.baseEditor && this.baseEditor.id === editorId) {
      return `${this.newType.id || 'Type'}.${this.baseEditor.id}`;
    }

    // Check custom editors
    const editor = this.newType.editors.find((e: any) => e.id === editorId);
    if (editor) {
      return `${this.newType.id || 'Type'}.${editor.id}`;
    }

    return undefined;
  }

  onNameChange() {
    if (!this.newType.name) return;
    // Simple auto-id: remove spaces, lowercase? User said "spaces removed", typically CamelCase or PascalCase for types.
    // But usually IDs are somewhat technical.
    // "Short Name ... default to Name with spaces removed"
    // e.g. "My Type" -> "MyType"
    if (!this.newType.id) {
      this.newType.id = this.newType.name.replace(/\s+/g, '');
    }
  }
}
