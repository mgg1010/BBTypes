import { Component, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BBType, BBEditor } from '../../models/bb-types';
import { EditorCustomizationModalComponent } from '../editor-customization-modal.component';

@Component({
  selector: 'app-type-editors-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, EditorCustomizationModalComponent],
  template: `
    <div class="editors-tab">
      <div class="editors-list">
        <table>
          <thead>
            <tr>
              <th>Editor Name</th>
              <th>Type</th>
              <th>Customises</th>
              <th>Default</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (editor of newType.editors; track editor.id) {
              <tr>
                <td>{{ editor.name }}</td>
                <td><span class="badge" [ngClass]="editor.type">{{ editor.type }}</span></td>
                <td>{{ editor.type === 'Custom' ? getEditorName(editor.baseEditorId!) : '' }}</td>
                <td class="default-indicator">
                  @if (editor.id === 'default') {
                    <span>✓</span>
                  }
                </td>
                <td class="editor-actions">
                  @if (editor.type === 'Custom' && !isReadOnly) {
                    <button class="icon-btn" (click)="customizeEditor(editor)" title="Customize">⚙️</button>
                  }
                  @if (editor.id !== 'default' && !isReadOnly) {
                    <button class="text-btn" (click)="setDefaultEditor(editor)">Set Default</button>
                  }
                  @if (editor.type === 'Custom' && !isReadOnly) {
                    <button class="icon-btn delete" (click)="deleteEditor(editor.id)" title="Delete">🗑️</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
        <button class="add-btn" (click)="addEditor()" [disabled]="isReadOnly">+ Add Custom Editor</button>
      </div>
    </div>

    <!-- Editor Selector Modal -->
    @if (showEditorSelector) {
      <div class="modal-overlay">
        <div class="modal-content small">
          <div class="modal-header">
            <h3>Create Custom Editor</h3>
            <button class="close-btn" (click)="cancelAddEditor()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Name:</label>
              <input [(ngModel)]="newEditorName" placeholder="e.g. My Custom Struct Editor" class="editor-input">
            </div>
            <div class="form-group">
              <label>ID:</label>
              <input [(ngModel)]="newEditorShortName" placeholder="e.g. MyEdit" class="editor-input">
            </div>
            <small class="help-text">Used for setting IDs (e.g. Struct.MyEdit.SettingName)</small>
            <div class="form-group">
              <label>System Editor:</label>
              <select [(ngModel)]="selectedBaseEditorId" class="editor-select">
                @for (editor of systemEditors; track editor.id) {
                  <option [value]="editor.id">{{ editor.name }}</option>
                }
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" (click)="cancelAddEditor()">Cancel</button>
            <button class="save-btn" (click)="confirmAddEditor()">OK</button>
          </div>
        </div>
      </div>
    }

    <!-- Editor Customization Modal -->
    @if (showEditorCustomizer && currentEditingEditor) {
       <div class="modal-overlay">
         <div class="modal-content large">
           <app-editor-customization-modal
             [editor]="currentEditingEditor"
             [parentType]="$any(newType)"
             (close)="showEditorCustomizer = false"
             (save)="onEditorCustomized($event)">
           </app-editor-customization-modal>
         </div>
       </div>
    }
  `,
  styles: [`
    .editors-tab { padding: 10px; }
    .editors-list table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .editors-list th, .editors-list td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; font-size: 13px; }
    .editors-list th { color: #888; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #eee; }
    
    .badge { padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .badge.System { background: #e0e0e0; color: #616161; }
    .badge.Custom { background: #e1f5fe; color: #0288d1; }
    
    .editor-actions { display: flex; gap: 5px; }
    .icon-btn { background: #f5f5f5; border: 1px solid #ddd; padding: 4px 8px; font-size: 14px; cursor: pointer; border-radius: 4px; }
    .icon-btn.delete { color: #d32f2f; }
    .text-btn { 
      background: #2196F3; 
      color: white; 
      border: none; 
      padding: 4px 12px; 
      border-radius: 4px; 
      font-size: 12px;
      cursor: pointer;
    }
    .text-btn:hover { background: #1976D2; }
    
    .default-indicator { text-align: center; font-size: 18px; color: #4CAF50; }
    
    .add-btn { background: #4CAF50; color: white; margin-top: 15px; padding: 8px 16px; border-radius: 4px; border: none; font-weight: 500; cursor: pointer; }
    .add-btn:disabled { background: #cccccc; cursor: not-allowed; opacity: 0.7; }
    
    /* Modal Styles */
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 1000;
    }
    .modal-content { 
      background: white; padding: 0; border-radius: 8px; 
      width: 90%; max-width: 600px; max-height: 90vh;
      display: flex; flex-direction: column;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    .modal-content.small { width: 400px; height: auto; }
    .modal-content.large { width: 1000px; max-width: 95vw; height: 80vh; }

    .modal-header {
      padding: 15px 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fafafa;
    }
    .modal-header h3 { margin: 0; font-size: 16px; }
    .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #999; }
    
    .modal-body { padding: 20px; overflow-y: auto; }
    .modal-footer {
      padding: 15px 20px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-weight: 500; color: #555; }
    .editor-input, .editor-select {
      width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; box-sizing: border-box;
    }
    .help-text { display: block; margin-top: -10px; margin-bottom: 15px; color: #999; font-size: 12px; }
    
    .save-btn { background: #2196F3; color: white; padding: 8px 16px; border-radius: 4px; border: none; font-weight: 500; cursor: pointer; }
    .cancel-btn { background: #eee; padding: 8px 16px; border-radius: 4px; border: none; font-weight: 500; cursor: pointer; }
  `]
})
export class TypeEditorsTabComponent {
  @Input() newType!: Partial<BBType>;
  @Input() isReadOnly = false;

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.showEditorSelector) {
      this.cancelAddEditor();
    }
  }

  // Local state
  showEditorSelector = false;
  selectedBaseEditorId: string = '';
  newEditorName: string = '';
  newEditorShortName: string = '';

  showEditorCustomizer = false;
  currentEditingEditor: BBEditor | null = null;

  get systemEditors() {
    return this.newType.editors?.filter(e => e.type === 'System') || [];
  }

  getEditorName(editorId: string): string {
    const editor = this.newType.editors?.find(e => e.id === editorId);
    return editor ? editor.name : editorId;
  }

  addEditor() {
    // Get only System editors
    const systemEditors = this.systemEditors;

    if (systemEditors.length === 0) {
      alert('No system editors available to customize');
      return;
    }

    // Default to the default editor or first system editor
    const defaultEditor = systemEditors.find(e => e.id === 'default') || systemEditors[0];
    this.selectedBaseEditorId = defaultEditor.id;

    // Show the modal
    this.showEditorSelector = true;
  }

  confirmAddEditor() {
    // Validate inputs
    if (!this.newEditorName.trim()) {
      alert('Please enter a name for the custom editor');
      return;
    }

    if (!this.newEditorShortName.trim()) {
      alert('Please enter a short name for the custom editor');
      return;
    }

    // Check for duplicate name
    const existingByName = this.newType.editors?.find(e =>
      e.name.toLowerCase() === this.newEditorName.trim().toLowerCase()
    );
    if (existingByName) {
      alert(`An editor with the name "${this.newEditorName}" already exists!`);
      return;
    }

    const baseEditor = this.newType.editors?.find(e => e.id === this.selectedBaseEditorId);

    if (!baseEditor) {
      this.showEditorSelector = false;
      return;
    }

    const newEditor: BBEditor = {
      id: this.newEditorShortName.trim(), // Use the shortName directly as id
      name: this.newEditorName.trim(),
      type: 'Custom',
      baseEditorId: baseEditor.baseEditorId,
      publishedSettings: { ...baseEditor.publishedSettings },
      settingDefinitions: baseEditor.settingDefinitions ? JSON.parse(JSON.stringify(baseEditor.settingDefinitions)) : [],
      overrides: baseEditor.overrides ? JSON.parse(JSON.stringify(baseEditor.overrides)) : []
    };

    if (!this.newType.editors) this.newType.editors = [];
    this.newType.editors.push(newEditor);

    this.showEditorSelector = false;
    // Reset form
    this.newEditorName = '';
    this.newEditorShortName = '';
  }

  cancelAddEditor() {
    this.showEditorSelector = false;
  }

  customizeEditor(editor: BBEditor) {
    this.currentEditingEditor = editor;
    this.showEditorCustomizer = true;
  }

  onEditorCustomized(updatedEditor: BBEditor) {
    if (this.newType.editors) {
      const index = this.newType.editors.findIndex(e => e.id === updatedEditor.id);
      if (index >= 0) {
        this.newType.editors[index] = updatedEditor;
      }
    }
    this.showEditorCustomizer = false;
  }

  deleteEditor(editorId: string) {
    if (this.newType.editors) {
      this.newType.editors = this.newType.editors.filter(e => e.id !== editorId);
    }
  }

  setDefaultEditor(editor: BBEditor) {
    if (!this.newType.editors) return;

    // Find current default editor
    const currentDefault = this.newType.editors.find(e => e.id === 'default');

    // If there's a current default, change its ID to something else
    if (currentDefault) {
      currentDefault.id = 'editor-' + Date.now();
    }

    // Change the selected editor's ID to 'default'
    editor.id = 'default';
  }
}
