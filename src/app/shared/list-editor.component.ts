import { Component, Input, Output, EventEmitter, Type, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IEditorComponent, EditorMode, EditorSize } from './editor.interface';
import { DynamicEditorComponent } from './dynamic-editor.component';
import { DynamicFieldComponent } from './dynamic-field.component';
import { AppConfig } from '../models/app-models';
import { BBTypeService } from '../services/bb-type.service';

@Component({
  selector: 'app-list-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicEditorComponent, DynamicFieldComponent],
  template: `
    <div class="list-editor-container" [ngClass]="size">
      <div class="list-items" (dragover)="onDragOver($event)" [style.gap.px]="itemGapPx">
        <!-- Header Row -->
        @if (hasHeaders && subtypeId) {
             <div class="list-item header-row" style="background: #fafafa; border-bottom: 2px solid #eee;">
                @if (showDragHandles) {
                    <div class="drag-handle" style="visibility: hidden;">⋮⋮</div>
                }
                @if (useSelection) {
                    <div class="checkbox-wrapper" style="visibility: hidden;">
                      <input type="checkbox">
                    </div>
                }
                <div class="item-editor">
                  <app-dynamic-field
                    [typeId]="subtypeId"
                    [appConfig]="appConfig"
                    [value]="{}"
                    [mode]="'edit'" 
                    [size]="size"
                    [settings]="headerSettings">
                  </app-dynamic-field>
                </div>
                 @if (!useSelection) {
                    <button class="inline-delete-btn" style="visibility: hidden;">🗑️</button>
                }
             </div>
        }

        @for (item of value; track $index) {
          <div 
            class="list-item" 
            [class.dragging]="draggedIndex === $index"
            [attr.draggable]="showDragHandles"
            (dragstart)="onDragStart($event, $index)"
            (dragend)="onDragEnd($event)"
            (drop)="onDrop($event, $index)">
            
            @if (showDragHandles && !isDisabled) {
                <div class="drag-handle" title="Drag to reorder">⋮⋮</div>
            }
            
            @if (useSelection && !isDisabled) {
                <div class="checkbox-wrapper">
                  <input type="checkbox" [(ngModel)]="checkedItems[$index]">
                </div>
            }

            <div class="item-editor">
               @if (subtypeId) {
                  <app-dynamic-field
                    [typeId]="subtypeId"
                    [appConfig]="appConfig"
                    [value]="item"
                    [mode]="mode"
                    [size]="size"
                    [settings]="settings"
                    [fieldName]="'[' + $index + ']'"
                    [isDisabled]="isDisabled"
                    [runtimeOverrides]="getItemRuntimeOverrides($index)"
                    (valueChange)="onItemChange($index, $event)">
                  </app-dynamic-field>
               } @else {
                  <app-dynamic-editor 
                    [componentType]="editorType"
                    [appConfig]="appConfig"
                    [value]="item"
                    [mode]="mode"
                    [size]="size"
                    (valueChange)="onItemChange($index, $event)">
                  </app-dynamic-editor>
               }
            </div>

            @if (!useSelection  && !isDisabled) {
                <button class="inline-delete-btn" (click)="deleteItem($index)" title="Delete item" [disabled]="isDisabled">🗑️</button>
            }
          </div>
        }
        @if (!value || value.length === 0) {
            <div class="empty-list-message">
                No items in list{{ isDisabled ? '.' : '. Click + to add one.' }}
            </div>
        }
      </div>

      @if (!isDisabled) {
        <div class="toolbar">
          @if (useSelection) {
              <button 
              class="delete-btn" 
              [disabled]="!hasCheckedItems || isDisabled" 
              (click)="deleteCheckedItems()"
              title="Delete selected items">
              🗑️
              </button>
              <span class="spacer"></span>
          } @else {
              <span class="spacer"></span>
          }
          
          <button 
            class="add-btn" 
            (click)="addItem()"
            title="Add new item"
            [disabled]="isDisabled">
            +
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
        display: block;
        width: 100%;
    }

    .list-editor-container {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 6px; /* Reduced padding */
      background: #fdfdfd;
      min-width: 300px;
    }

    .items-container {
      display: flex;
      flex-direction: column;
    }

    .list-item {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      border-bottom: 1px solid #eee;
      background: #fff;
      transition: background-color 0.2s;
    }
    
    .list-item:last-child {
        border-bottom: none;
    }

    .list-item.dragging {
      opacity: 0.5;
      background: #e3f2fd;
    }

    .drag-handle {
      cursor: grab;
      color: #999;
      padding: 0 8px;
      font-size: 18px;
      user-select: none;
      flex-shrink: 0;
    }
    .drag-handle:active {
        cursor: grabbing;
    }

    .checkbox-wrapper {
        margin-right: 10px;
        flex-shrink: 0;
    }

    .item-editor {
      flex-grow: 1;
      min-width: 0; /* Critical for preventing flex blowout */
    }
    
    .empty-list-message {
        padding: 10px; /* Reduced by half */
        text-align: center;
        color: #888;
        font-style: italic;
    }

    .toolbar {
      display: flex;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid #eee;
      margin-top: 5px;
    }

    .spacer {
      flex-grow: 1;
    }

    button {
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #f5f5f5;
      cursor: pointer;
      padding: 5px 12px;
      font-size: 16px;
      transition: all 0.2s;
    }

    button:hover:not(:disabled) {
      background: #e0e0e0;
      border-color: #ccc;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .delete-btn {
      color: #d32f2f;
    }
    
    .inline-delete-btn {
        margin-left: 10px;
        color: #d32f2f;
        padding: 4px 8px;
        font-size: 14px;
        background: transparent;
        border: none;
    }
    .inline-delete-btn:hover {
        background: #fee;
        border-color: #fcc;
    }

    .add-btn {
      color: #388e3c;
      font-weight: bold;
      font-size: 18px;
      padding: 2px 12px;
    }

    /* Small Size Variant */
    .small.list-editor-container {
        padding: 0;
        min-width: 0;
        border: none;
        background: transparent;
    }
    .small .list-items {
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #fff;
    }
    .small .empty-list-message {
        padding: 4px;
        font-size: 11px;
        color: #999;
    }
    .small .list-item {
        padding: 4px;
    }
    .small .toolbar {
        padding-top: 2px;
        margin-top: 2px;
        border-top: none;
        justify-content: flex-end; /* Align right to save space */
    }
    .small button {
        padding: 0px 6px; /* Super compact */
        font-size: 14px;
        line-height: 1;
        height: 20px;
    }
  `]
})
export class ListEditorComponent implements IEditorComponent<any[]>, OnInit {
  @Input() value: any[] = [];
  @Input() mode: EditorMode = 'edit';
  @Input() size: EditorSize = 'medium';
  @Input() settings: Record<string, any> = {};
  @Input() editorType!: Type<IEditorComponent<any>>;
  @Input() subtypeId?: string; // For Dynamic Field resolution
  @Input() appConfig: AppConfig | null = null;
  @Input() isDisabled = false;
  @Input() runtimeOverrides?: any[]; // Runtime overrides to pass to child items
  @Output() valueChange = new EventEmitter<any[]>();


  checkedItems: boolean[] = [];
  draggedIndex: number | null = null;
  itemGapPx: number = 5; // Default gap between list items

  get showDragHandles(): boolean {
    // Auto-hide if list is not ordered (can't reorder an unordered list)
    const isOrdered = this.settings['List.Ordered'] !== false; // Default to ordered
    if (!isOrdered) return false;

    // Check the ShowDragHandles setting (default to true for ordered lists)
    return this.settings['List.CoreEdit.ShowDragHandles'] !== false;
  }

  get useSelection(): boolean {
    // If true: show checkboxes + bottom trash can
    // If false: show per-row trash can
    return this.settings['List.CoreEdit.RowSelection'] !== false; // Default to true
  }

  get hasCheckedItems(): boolean {
    return this.checkedItems.some(checked => checked);
  }

  get hasHeaders(): boolean {
    return !!this.settings['List.CoreEdit.HasHeaders'];
  }

  get headerSettings(): Record<string, any> {
    // Force Headers ON, and maybe ReadOnly to avoid editing the header row
    return { ...this.settings, 'Struct.HorzEdit.ShowHeaders': true, 'Editor.ReadOnly': true };
  }

  constructor(private bbTypeService: BBTypeService) { }

  getItemRuntimeOverrides(index: number): any[] {
    const baseOverrides = this.runtimeOverrides || [];

    // Add showHeaders for first item if list has ShowHeaders setting
    if (index === 0 && this.settings['List.ShowHeaders']) {
      return [
        ...baseOverrides,
        { fieldName: '*', settingId: 'Struct.HorzEdit.ShowHeaders', value: true }
      ];
    }

    return baseOverrides;
  }

  ngOnInit() {
    // Read List.ItemGap setting
    const itemGap = this.settings['List.ItemGap'];
    this.itemGapPx = itemGap !== undefined ? itemGap : 5; // Default 5px
  }

  onItemChange(index: number, newValue: any) {
    const newList = [...this.value];
    newList[index] = newValue;
    this.value = newList;
    this.valueChange.emit(this.value);
  }

  addItem() {
    let defaultValue = null;
    if (this.subtypeId) {
      defaultValue = this.bbTypeService.getDefaultValue(this.subtypeId);
    }
    // Fallback if null and no subtype? or generic default?
    // If defaultValue is strictly null (e.g. unknown type), we still add null.
    // Ideally generic editor handles null. But for Structs, we want {}.

    this.value = [...(this.value || []), defaultValue];
    this.checkedItems.push(false);
    this.valueChange.emit(this.value);
  }

  deleteCheckedItems() {
    this.value = this.value.filter((_, index) => !this.checkedItems[index]);
    this.checkedItems = this.checkedItems.filter(checked => !checked);
    this.valueChange.emit(this.value);
  }

  deleteItem(index: number) {
    const newList = [...this.value];
    newList.splice(index, 1);
    this.value = newList;
    // also remove checked state
    this.checkedItems.splice(index, 1);
    this.valueChange.emit(this.value);
  }

  // Drag and Drop Logic
  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Necessary to allow dropping
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDragEnd(event: DragEvent) {
    this.draggedIndex = null;
  }

  onDrop(event: DragEvent, dropIndex: number) {
    event.preventDefault();
    if (this.draggedIndex === null || this.draggedIndex === dropIndex) return;

    const newList = [...this.value];
    const [movedItem] = newList.splice(this.draggedIndex, 1);
    newList.splice(dropIndex, 0, movedItem);

    // Also move the checkbox state
    const newChecked = [...this.checkedItems];
    const [movedCheck] = newChecked.splice(this.draggedIndex, 1);
    newChecked.splice(dropIndex, 0, movedCheck);

    this.value = newList;
    this.checkedItems = newChecked;
    this.draggedIndex = null;
    this.valueChange.emit(this.value);
  }
}
