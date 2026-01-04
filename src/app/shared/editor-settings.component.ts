import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorMode, EditorSize } from './editor.interface';

@Component({
  selector: 'app-editor-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-bar">
      <div class="version-badge">v4.6</div>
      
      <label class="compact-label">
        <input type="checkbox" [ngModel]="isEditMode" (ngModelChange)="onEditModeChange($event)"> 
        Edit Mode
      </label>

      <label class="compact-label">
        <input type="checkbox" [ngModel]="isExpressionMode" (ngModelChange)="onExpressionModeChange($event)"> 
        Expression Mode
      </label>

      <div class="size-group">
        <span>Size:</span>
        <label class="compact-label">
          <input type="radio" name="size" [ngModel]="size" (ngModelChange)="sizeChange.emit($event)" value="small"> Small
        </label>
        <label class="compact-label">
          <input type="radio" name="size" [ngModel]="size" (ngModelChange)="sizeChange.emit($event)" value="medium"> Medium
        </label>
      </div>
    </div>
  `,
  styles: [`
    .settings-bar {
        display: flex;
        gap: 15px;
        align-items: center;
        background: #f8f9fa;
        padding: 6px 12px;
        border-radius: 6px;
        border: 1px solid #eef0f2;
        margin-bottom: 15px;
        font-size: 12px; /* Smaller point size */
    }
    .version-badge {
        background: #d32f2f;
        color: white;
        padding: 1px 5px;
        border-radius: 3px;
        font-weight: bold;
        font-size: 10px;
    }
    .compact-label {
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        font-weight: 600;
        color: #444;
    }
    .size-group {
        display: flex;
        align-items: center;
        gap: 8px;
        border-left: 1px solid #ddd;
        padding-left: 15px;
    }
    span { color: #888; font-weight: bold; text-transform: uppercase; font-size: 10px; }
  `]
})
export class EditorSettingsComponent {
  @Input() isEditMode = true;
  @Input() isExpressionMode = false;
  @Input() size: EditorSize = 'medium';

  @Output() isEditModeChange = new EventEmitter<boolean>();
  @Output() isExpressionModeChange = new EventEmitter<boolean>();
  @Output() sizeChange = new EventEmitter<EditorSize>();
  @Output() modeChange = new EventEmitter<EditorMode>();

  onEditModeChange(val: boolean) {
    this.isEditMode = val;
    this.isEditModeChange.emit(val);
    this.emitMode();
  }

  onExpressionModeChange(val: boolean) {
    this.isExpressionMode = val;
    this.isExpressionModeChange.emit(val);
    this.emitMode();
  }

  private emitMode() {
    if (this.isExpressionMode) {
      this.modeChange.emit('expression');
    } else {
      this.modeChange.emit(this.isEditMode ? 'edit' : 'read');
    }
  }
}
