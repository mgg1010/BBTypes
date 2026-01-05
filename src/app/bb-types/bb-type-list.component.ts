import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BBType } from '../models/bb-types';
import { BBTypeService } from '../services/bb-type.service';
import { AppConfig } from '../models/app-models';

@Component({
  selector: 'app-bb-type-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="type-manager">
        <div class="toolbar">
            <button class="primary-btn" (click)="requestCreate.emit()">+ New Type</button>

            <span style="margin-left: 15px; margin-right: 5px;">Show:</span>
            <label class="filter-check">
                <input type="checkbox" [(ngModel)]="showSystem" (ngModelChange)="onFilterChange()">
                System
            </label>
            <label class="filter-check">
                <input type="checkbox" [(ngModel)]="showTypeDefined" (ngModelChange)="onFilterChange()">
                Type Derived
            </label>
            <label class="filter-check">
                <input type="checkbox" [(ngModel)]="showUserDefined" (ngModelChange)="onFilterChange()">
                User
            </label>
            <label class="filter-check">
                <input type="checkbox" [(ngModel)]="showAnonymous" (ngModelChange)="onFilterChange()">
                Anonymous
            </label>
            
            <span style="flex:1"></span>
            
            <button class="action-btn danger-btn" (click)="resetAll()" style="color: #d32f2f; border-color: #d32f2f; margin-right: 10px;">⚠️ Reset All</button>
            
            <button class="icon-btn" (click)="fileInput.click()" title="Load Config">📂</button>
            <input #fileInput type="file" (change)="loadConfig($event)" style="display: none" accept=".json">
            <button class="icon-btn" (click)="downloadConfig()" title="Download Config">💾</button>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Type Name</th>
                    <th>Kind</th>
                    <th>Based On</th>
                    <th style="width: 250px;">Actions</th>
                </tr>
            </thead>
            <tbody>
            @for (type of filteredTypes; track type.id) {
                <tr>
                <td>
                    <div style="font-weight: bold; color: #333;">{{ type.name }}</div>
                    <div style="font-size: 11px; color: #888; font-family: monospace;">{{ type.id }}</div>
                </td>
                <td>
                    <span class="badge" [ngClass]="getBadgeClass(type)">
                        {{ type.source === 'Type Defined' ? 'Derived' : (type.userDefined ? 'User' : 'System') }}
                    </span>
                </td>
                <td>
                    <div class="base-type-info" [innerHTML]="getBasedOnTypeName(type)"></div>
                </td>
                <td>
                    @if (type.userDefined) {
                        <button class="edit-btn" (click)="requestEdit.emit(type)">✏️ Edit</button>
                        <button class="test-btn" (click)="requestTest.emit(type)">🧪 Test</button>
                        <button 
                            class="delete-btn" 
                            [class.disabled]="isTypeRef(type.id)" 
                            [title]="isTypeRef(type.id) ? 'Cannot delete: Type is used by ' + getRefNames(type.id) : 'Delete Type'"
                            (click)="!isTypeRef(type.id) && deleteType(type)">
                            🗑️
                        </button>
                    }
                    @if (!type.userDefined) {
                         <button class="info-btn" (click)="requestEdit.emit(type)">ℹ️ Info</button>
                         @if (type.fieldBaseType || type.baseType === 'List' || type.baseType === 'Struct') {
                             <button class="test-btn" (click)="requestTest.emit(type)">🧪 Test</button>
                         }
                    }
                </td>
                </tr>
            }
            </tbody>
        </table>
      </div>
  `,
  styles: [`
    .type-manager {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        overflow: hidden;
    }
    .toolbar {
        padding: 10px 15px;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .primary-btn {
        background: #2196F3;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
    }
    .primary-btn:hover { background: #1976D2; }
    
    .icon-btn { background: none; border: 1px solid #ccc; border-radius: 4px; padding: 5px 10px; cursor: pointer; background: white; }
    .icon-btn:hover { background: #eee; }

    .filter-check { font-size: 13px; display: flex; align-items: center; gap: 4px; cursor: pointer; user-select: none; }
    
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px 15px; background: #f9f9f9; border-bottom: 1px solid #eee; font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase; }
    td { padding: 5px 15px; border-bottom: 1px solid #eee; vertical-align: middle; }
    tr:hover { background: #fdfdfd; }
    
    .badge { padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .badge.system { background: #e0e0e0; color: #555; }
    .badge.user { background: #e3f2fd; color: #1976d2; }
    .badge.derived { background: #fff3e0; color: #ef6c00; }
    
    .edit-btn { background: white; border: 1px solid #ddd; color: #333; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 5px; }
    .edit-btn:hover { background: #f5f5f5; border-color: #ccc; }

    .info-btn { 
        background: white; 
        border: 1px solid #ddd; 
        color: #0288d1; 
        padding: 4px 10px; 
        border-radius: 4px; 
        cursor: pointer; 
        font-size: 12px; 
        margin-right: 5px; 
        display: inline-flex;
        align-items: center;
        gap: 3px;
    }
    .info-btn:hover { background: #e1f5fe; border-color: #b3e5fc; }
    
    .delete-btn { background: white; border: 1px solid #ffcdd2; color: #c62828; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; }
    .delete-btn:hover { background: #ffebee; }
    .delete-btn.disabled { opacity: 0.5; cursor: not-allowed; border-color: #eee; color: #999; }
    
    .test-btn { background: #e8f5e9; border: 1px solid #a5d6a7; color: #2e7d32; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-left: 5px; }
    .test-btn:hover { background: #c8e6c9; }

    .base-type-info { font-size: 13px; color: #444; display: flex; align-items: center; gap: 5px; }
    .subtype-arrow { color: #999; font-size: 10px; }
    .subtype-name { padding: 1px 4px; background: #eee; border-radius: 3px; font-family: monospace; font-size: 11px; }

    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 1000;
      display: flex; justify-content: center; align-items: center;
    }
  `]
})
export class BBTypeListComponent implements OnInit, OnChanges {
  @Input() appConfig: AppConfig | null = null;
  @Output() appConfigChange = new EventEmitter<AppConfig>();

  @Output() requestEdit = new EventEmitter<BBType>();
  @Output() requestCreate = new EventEmitter<void>();
  @Output() requestTest = new EventEmitter<BBType>();
  @Output() requestDelete = new EventEmitter<BBType>();

  types: BBType[] = [];
  systemTypes: BBType[] = [];
  filteredTypes: BBType[] = [];

  // Filter options
  showSystem = false;
  showTypeDefined = false;
  showUserDefined = true;
  showAnonymous = false;

  constructor(private bbTypeService: BBTypeService) { }

  ngOnInit() {
    // Subscribe to types (System types mostly)
    this.bbTypeService.types$.subscribe(types => {
      this.systemTypes = types.filter(t => !t.userDefined); // Only take system/core types from service if we have appConfig
      // If we don't have appConfig, maybe we take everything?
      // But typically BBTypeService holds the "Global" types.
      this.updateTypeList();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['appConfig']) {
      this.updateTypeList();
    }
  }

  updateTypeList() {
    if (this.appConfig) {
      // Merge System Types + App Types
      this.types = [...this.systemTypes, ...this.appConfig.types];
    } else {
      // Fallback to service types (global mode)
      this.types = this.bbTypeService.getTypes();
    }
    this.onFilterChange();
  }

  onFilterChange() {
    this.filteredTypes = this.types.filter(t => {
      // Filter out anonymous types unless showAnonymous is enabled
      if (t.isAnonymous && !this.showAnonymous) return false;

      if (t.source === 'User Defined' && !this.showUserDefined) return false;
      if (t.source === 'System' && !this.showSystem) return false;
      if (t.source === 'Type Defined' && !this.showTypeDefined) return false;

      // Fallback
      if (!t.source) {
        if (t.userDefined && !this.showUserDefined) return false;
        if (!t.userDefined && !this.showSystem) return false;
      }
      return true;
    });

    // Custom Sort Order
    const sortOrder = [
      'bbtype', 'typeeditor', 'idstring', 'number', 'string',
      'enum', 'boolean', 'struct-base', 'struct', 'union',
      'list-base', 'list', 'dict', 'date', 'file', 'font'
    ];

    this.filteredTypes.sort((a, b) => {
      const indexA = sortOrder.indexOf(a.id);
      const indexB = sortOrder.indexOf(b.id);

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // Fallback to name sort
      return a.name.localeCompare(b.name);
    });
  }

  getBadgeClass(type: BBType): string {
    if (type.source === 'Type Defined') return 'derived';
    if (type.userDefined) return 'user';
    return 'system';
  }

  isTypeRef(id: string): boolean {
    return this.bbTypeService.isTypeReferenced(id);
  }

  getRefNames(id: string): string {
    const refs = this.bbTypeService.getTypesReferencing(id);
    return refs.map(t => t.name).join(', ');
  }

  getTypeName(id: string): string {
    const t = this.types.find(x => x.id === id);
    return t ? t.name : id;
  }

  deleteType(type: BBType) {
    this.requestDelete.emit(type);
  }

  resetAll() {
    if (confirm('Are you sure you want to clear ALL custom types? This cannot be undone.')) {
      if (this.appConfig) {
        this.appConfig.types = [];
        this.appConfigChange.emit(this.appConfig);
        // Optionally reload or just refresh
        setTimeout(() => window.location.reload(), 100);
      } else {
        this.bbTypeService.clearAllTypes();
        setTimeout(() => window.location.reload(), 100);
      }
    }
  }

  getBasedOnTypeName(type: BBType): string {
    // Check for Pure Base Class first
    // Boolean is NOT a pure base class in this context, it is based on Enum
    const pureIds = ['list', 'struct', 'union', 'dict', 'enum', 'string', 'number', 'file', 'date', 'font', 'bbtype', 'typeeditor', 'struct-base', 'list-base'];

    if (pureIds.includes(type.id)) {
      return 'System Base Type';
    }

    if (type.baseType === 'Struct') return 'Struct';
    if (type.baseType === 'List') {
      // If it is the System List type itself (which we already caught above if it was in pureIds, but double check)
      // The System 'list' type shouldn't show its default subtype here if we consider it pure.
      if (type.id === 'list' && type.source === 'System') return 'System Base Type';

      const subtype = type.subtypeId ? this.getTypeName(type.subtypeId) : 'Any';
      return `List → <span class="badge derived">${subtype}</span>`;
    }
    if (type.baseType === 'Enum') return 'Enum';
    if (type.baseType === 'Core' || type.baseType === 'Basic') {
      // Fallback for types that might not be in the pure list but are system types
      return type.baseType;
    }

    return type.baseType || 'Root';
  }

  downloadConfig() {
    const types = this.appConfig ? this.appConfig.types : this.bbTypeService.getTypes().filter(t => t.userDefined);
    const filename = this.appConfig ? `$\{this.appConfig.slug}-types.json` : "bb-types-config.json";
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(types, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  loadConfig(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const types = JSON.parse(e.target.result);
        if (this.appConfig) {
          this.appConfig.types = [...this.appConfig.types, ...types];
          this.appConfigChange.emit(this.appConfig);
        } else {
          this.bbTypeService.importTypes(types);
        }
      } catch (err) {
        console.error('Invalid JSON', err);
        alert('Failed to load JSON');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }
}
