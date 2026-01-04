import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppService } from './services/app.service';
import { AppConfig, AppScreen } from './models/app-models';
import { FormsModule } from '@angular/forms';
import { BBTypeListComponent } from './bb-types/bb-type-list.component';
import { BBTypeBuilderComponent } from './bb-types/bb-type-builder.component';

import { BBTypeTesterComponent } from './bb-types/bb-type-tester.component';
import { BBType } from './models/bb-types';
import { Subscription } from 'rxjs';

interface TestTab {
  id: string;
  type: BBType;
}

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BBTypeListComponent, BBTypeBuilderComponent, BBTypeTesterComponent],
  template: `
    <div class="config-container">
      <header>
        <button class="back-link" routerLink="/">⬅ Back to Dashboard</button>
        <h1>{{ isNew ? 'New App' : 'Config: ' + app?.name }}</h1>
        <button class="save-status-btn" disabled>Syncing Automatically...</button>
      </header>

      @if (app) {
        <nav class="tabs">
          <button [class.active]="activeTab === 'settings'" (click)="activeTab = 'settings'">Core Settings</button>
          <button [class.active]="activeTab === 'types'" (click)="activeTab = 'types'">Types List</button>
          <button [class.active]="activeTab === 'screens'" (click)="activeTab = 'screens'">Screens List</button>
          
          @for (tab of testTabs; track tab.id) {
             <button [class.active]="activeTab === tab.id" (click)="activeTab = tab.id" class="test-tab-btn">
                Test - {{ tab.type.name }}
                <span class="close-tab" (click)="closeTestTab(tab.id, $event)">✕</span>
             </button>
          }
        </nav>

        <div class="tab-content">
          <!-- Core Settings -->
          @if (activeTab === 'settings') {
            <div class="settings-form">
              <div class="field">
                <label>App Name</label>
                <input [(ngModel)]="app.name" (ngModelChange)="onNameChange()" placeholder="e.g. Inventory Manager">
              </div>
              <div class="field">
                <label>App Slug (URL identifier)</label>
                <input [(ngModel)]="app.slug" placeholder="e.g. inventory">
                <small>Used at {{ currentOrigin }}/{{ app.slug }}</small>
              </div>
            </div>
          }

          <!-- Types List -->
          @if (activeTab === 'types') {
            <div class="types-section">
                <app-bb-type-list 
                    [appConfig]="app" 
                    (appConfigChange)="onAppChanged()"
                    (requestEdit)="openTypeEditor($event)"
                    (requestCreate)="openTypeCreator()"

                    (requestTest)="openTestTab($event)"
                    (requestDelete)="openDeleteConfirm($event)">
                </app-bb-type-list>
            </div>
          }

          <!-- Screens List -->
          @if (activeTab === 'screens') {
            <div class="screens-section">
              <div class="toolbar">
                <h3>App Screens</h3>
                <button class="add-btn" (click)="addScreen()">+ Add Screen</button>
              </div>
              
              <div class="screen-list">
                @for (screen of app.screens; track screen.id; let i = $index) {
                  <div class="screen-card">
                    <div class="screen-main">
                      <input [(ngModel)]="screen.name" placeholder="Screen Name" (ngModelChange)="onAppChanged()">
                      <select [(ngModel)]="screen.type" (ngModelChange)="onAppChanged()">
                        <option value="list">List Editor</option>
                      </select>
                      <select [(ngModel)]="screen.typeId" (ngModelChange)="onAppChanged()">
                        <option value="">-- Select Type --</option>
                        @for (type of app.types; track type.id) {
                           <option [value]="type.id">{{ type.name }}</option>
                        }
                      </select>
                    </div>
                    <button class="remove-btn" (click)="removeScreen(i)">🗑️</button>
                  </div>
                }
                @if (app.screens.length === 0) {
                  <p class="empty">No screens defined yet.</p>
                }
              </div>
            </div>
          }
          
          <!-- Test Tabs -->
          @for (tab of testTabs; track tab.id) {
             @if (activeTab === tab.id) {
                 <div class="test-tab-container">
                     <app-bb-type-tester 
                        [type]="tab.type" 
                        [appConfig]="app" 
                        [refreshTrigger]="settingsRefreshCounter"
                        (showInfo)="openTypeEditor($event)">
                     </app-bb-type-tester>
                 </div>
             }
          }
        </div>
      } @else {
        <div class="loading">Loading App...</div>
      }
      
      <!-- Type Builder Modal -->
      @if (isBuilderOpen) {
          <div class="modal-overlay" >
            <div class="modal-content type-builder-modal" 
                 [style.transform]="'translate(' + modalTransform.x + 'px, ' + modalTransform.y + 'px)'"
                 (click)="$event.stopPropagation()">
                
                <div class="modal-header draggable" (mousedown)="startDrag($event)">
                    <h3 style="margin:0; font-size: 14px;">
                        {{ editingType ? (editingType.userDefined ? 'Edit Type: ' : 'Type Info: ') + editingType.name : 'Create New Type' }}
                    </h3>
                    <button class="close-btn" (click)="closeBuilder()">✕</button>
                </div>

                <app-bb-type-builder 
                    [showHeader]="false"
                    [editingType]="editingType"
                    [appConfig]="app"
                    (cancel)="closeBuilder()"
                    (create)="onTypeCreated($event)"
                    (previewUpdate)="onTypePreview($event)">
                </app-bb-type-builder>
            </div>
          </div>
      }




      <!-- Delete Confirmation Modal -->
      @if (isDeleteConfirmOpen && deleteConfirmType) {
          <div class="modal-overlay" style="z-index: 1100;">
              <div class="modal-content" style="width: 400px; height: auto; overflow: visible;">
                  <div class="modal-header">
                      <h3 style="margin:0; font-size: 16px;">Delete Type</h3>
                      <button class="close-btn" (click)="cancelDelete()">✕</button>
                  </div>
                  <div style="padding: 20px;">
                      <p>Are you sure you want to delete type "<strong>{{ deleteConfirmType.name }}</strong>"?</p>
                      <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                          <button class="add-btn" style="background: #ccc; color: #333;" (click)="cancelDelete()">Cancel</button>
                          <button class="add-btn" style="background: #e53935;" (click)="confirmDelete()">Delete</button>
                      </div>
                  </div>
              </div>
          </div>
      }
    </div>
  `,
  styles: [`
    .config-container { padding: 30px; max-width: 1200px; margin: 0 auto; min-height: 80vh; position: relative; }
    header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
    h1 { margin: 0; flex: 1; }
    .back-link { background: none; border: none; color: #2196F3; cursor: pointer; padding: 0; font-weight: bold; }
    .save-status-btn { font-size: 0.8rem; background: #eee; border: 1px solid #ddd; padding: 4px 10px; border-radius: 4px; color: #888; }

    .tabs { display: flex; border-bottom: 2px solid #eee; margin-bottom: 30px; flex-wrap: wrap; }
    .tabs button { 
      padding: 12px 24px; background: none; border: none; cursor: pointer; 
      font-weight: 600; font-size: 1rem; color: #666; position: relative;
      border-bottom: 2px solid transparent;
    }
    .tabs button.active { color: #2196F3; border-bottom-color: #2196F3; }
    
    .test-tab-btn { display: inline-flex; align-items: center; gap: 8px; }
    .close-tab { font-size: 12px; width: 16px; height: 16px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #eee; color: #666; opacity: 0; transition: all 0.2s; }
    .test-tab-btn:hover .close-tab { opacity: 1; }
    .close-tab:hover { background: #ffcdd2; color: #c62828; }

    .test-tab-container { height: 600px; display: flex; flex-direction: column; background: white; border-radius: 8px; border: 1px solid #eee; }

    .settings-form { max-width: 500px; }
    .field { margin-bottom: 20px; }
    .field label { display: block; margin-bottom: 5px; font-weight: 600; color: #444; }
    .field input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; border-box: border-box; }
    .field small { color: #888; display: block; margin-top: 4px; }

    .screens-section .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .screen-list { display: grid; gap: 15px; }
    .screen-card { 
      display: flex; gap: 10px; align-items: center; background: white; padding: 15px; 
      border-radius: 8px; border: 1px solid #eee; box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    }
    .screen-main { flex: 1; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .screen-main input, .screen-main select { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    .remove-btn { background: none; border: none; cursor: pointer; font-size: 1.2rem; filter: grayscale(1); }
    .remove-btn:hover { filter: none; }
    .empty { color: #999; text-align: center; font-style: italic; }
    
    .add-btn { background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600; }
    
     /* Modal Styles */
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 1000;
      display: flex; justify-content: center; align-items: center;
    }
    .modal-content {
      background: white; width: 900px; max-width: 95vw; height: 80vh;
      border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      display: flex; flex-direction: column; overflow: hidden;
    }
    .modal-header {
      padding: 15px 20px; border-bottom: 1px solid #eee;
      display: flex; justify-content: space-between; align-items: center;
      background: #f8f9fa; cursor: move;
    }
    .modal-header.draggable { user-select: none; }
    .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #999; }
    .close-btn:hover { color: #333; }
    
    .type-builder-modal {
        resize: both;
        overflow: hidden;
        min-width: 500px;
        min-height: 400px;
    }
  `]
})
export class AppConfigComponent implements OnInit, OnDestroy {
  app: AppConfig | null = null;
  activeTab: string = 'settings';
  isNew = false;
  currentOrigin = window.location.origin;

  // Test Tabs
  testTabs: TestTab[] = [];

  // Type Builder Modal State
  isBuilderOpen = false;

  editingType: BBType | null = null;
  settingsRefreshCounter = 0;

  // Delete Confirmation State
  isDeleteConfirmOpen = false;
  deleteConfirmType: BBType | null = null;

  modalTransform = { x: 0, y: 0 };
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };

  private routeSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private appService: AppService,
    private router: Router
  ) { }

  ngOnInit() {
    this.routeSub = this.route.params.subscribe(params => {
      const slug = params['slug'];
      const found = this.appService.getAppBySlug(slug);
      if (found) {
        this.app = { ...found };
        this.isNew = false;
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }

  // Modal Dragging Logic
  @HostListener('document:mouseup')
  onDragEnd() {
    this.isDragging = false;
  }

  @HostListener('document:mousemove', ['$event'])
  onDragMove(event: MouseEvent) {
    if (this.isDragging) {
      this.modalTransform = {
        x: event.clientX - this.dragStart.x,
        y: event.clientY - this.dragStart.y
      };
    }
  }

  startDrag(event: MouseEvent) {
    if ((event.target as HTMLElement).tagName.toLowerCase() === 'button') return;
    this.isDragging = true;
    this.dragStart = {
      x: event.clientX - this.modalTransform.x,
      y: event.clientY - this.modalTransform.y
    };
    event.preventDefault();
  }

  // Type Builder Logic
  openTypeEditor(type: BBType) {
    this.editingType = type;
    this.isBuilderOpen = true;
    this.modalTransform = { x: 0, y: 0 };
  }

  openTypeCreator() {
    this.editingType = null;
    this.isBuilderOpen = true;
    this.modalTransform = { x: 0, y: 0 };
  }



  closeBuilder() {
    this.isBuilderOpen = false;
    this.editingType = null;
    this.settingsRefreshCounter++;
  }

  onTypeCreated(newType: BBType) {
    // Logic to add type is handled by builder service usually, but we need to refresh app
    // Actually BBTypeBuilderComponent emits 'create' but it might also save to service.
    // AppConfigComponent uses AppService which might need refresh or it just shares reference.
    // If BBTypeBuilder adds to BBTypeService/AppConfig reference, we are good.
    // The builder component usually handles addition.
    // Let's check builder implementation usage from List component previously:
    // (create)="onTypeCreated($event)"
    // And list component did:
    // let newType = $event; ...
    // We need to support that.
    // Assuming Builder service handles it or we do it here.
    // I will assume Builder component updates the array passed to it or Service.
    // If Builder Component expects parent to add it:
    if (this.app) {
      const index = this.app.types.findIndex(t => t.id === newType.id);
      if (index >= 0) {
        // Update existing type
        const newTypes = [...this.app.types];
        newTypes[index] = newType;
        this.app.types = newTypes;

        // Update any open test tabs for this type
        const testTab = this.testTabs.find(t => t.id === 'test-' + newType.id);
        if (testTab) {
          testTab.type = newType;
        }
      } else {
        // Create new type
        this.app.types = [...this.app.types, newType];
      }

      this.app = { ...this.app };
      this.onAppChanged();
    }
    this.closeBuilder();
  }

  // Delete Confirmation Logic
  openDeleteConfirm(type: BBType) {
    this.deleteConfirmType = type;
    this.isDeleteConfirmOpen = true;
  }

  cancelDelete() {
    this.isDeleteConfirmOpen = false;
    this.deleteConfirmType = null;
  }

  confirmDelete() {
    if (this.app && this.deleteConfirmType) {
      // Remove from apps list
      this.app.types = this.app.types.filter(t => t.id !== this.deleteConfirmType!.id);

      // Force refresh
      this.app = { ...this.app };
      this.onAppChanged();

      // Close any open test tab for this type
      const tabId = 'test-' + this.deleteConfirmType.id;
      const tabIndex = this.testTabs.findIndex(t => t.id === tabId);
      if (tabIndex !== -1) {
        this.testTabs.splice(tabIndex, 1);
        if (this.activeTab === tabId) this.activeTab = 'types';
      }
    }
    this.cancelDelete();
  }

  // Test Tab Logic
  openTestTab(type: BBType) {
    const existing = this.testTabs.find(t => t.id === 'test-' + type.id);
    if (existing) {
      this.activeTab = existing.id;
    } else {
      const newTab: TestTab = {
        id: 'test-' + type.id,
        type: type
      };
      this.testTabs.push(newTab);
      this.activeTab = newTab.id;
    }
  }

  closeTestTab(id: string, event: Event) {
    event.stopPropagation();
    const index = this.testTabs.findIndex(t => t.id === id);
    if (index !== -1) {
      this.testTabs.splice(index, 1);
      if (this.activeTab === id) {
        this.activeTab = 'types'; // Fallback
      }
    }
  }

  onTypePreview(previewType: BBType) {
    if (!previewType || !this.app) return;

    // Find open test tab for this type
    const typeId = previewType.id;
    if (!typeId) return;

    const testTab = this.testTabs.find(t => t.id === 'test-' + typeId);
    if (testTab) {
      // Update the type definition in the test tab
      // formatting it as a new object to trigger change detection
      testTab.type = { ...previewType };
    }
  }

  // App Logic
  onNameChange() {
    if (this.app && !this.app.slug) {
      this.app.slug = this.app.name.toLowerCase().replace(/\\s+/g, '-');
    }
    this.onAppChanged();
  }

  onAppChanged() {
    if (this.app) {
      this.appService.updateApp(this.app.slug, this.app);
    }
  }

  addScreen() {
    if (!this.app) return;
    const newScreen: AppScreen = {
      id: 'screen-' + Date.now(),
      name: 'New Screen ' + (this.app.screens.length + 1),
      type: 'list',
      typeId: ''
    };
    this.app.screens.push(newScreen);
    this.onAppChanged();
  }

  removeScreen(index: number) {
    if (!this.app) return;
    this.app.screens.splice(index, 1);
    this.onAppChanged();
  }
}
