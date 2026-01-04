import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AppService } from './services/app.service';
import { AppConfig, AppScreen } from './models/app-models';
import { Subscription } from 'rxjs';
import { ListEditorComponent } from './shared/list-editor.component';
import { EditorSettingsComponent } from './shared/editor-settings.component';
import { EditorMode, EditorSize } from './shared/editor.interface';

@Component({
    selector: 'app-runner',
    standalone: true,
    imports: [CommonModule, RouterModule, ListEditorComponent, EditorSettingsComponent],
    template: `
    <div class="runner-container">
      @if (app) {
        <header>
            <div class="header-left">
                <button class="back-link" routerLink="/">🏠 Factory</button>
                <h1>{{ app.name }}</h1>
            </div>
            <app-editor-settings
                [isEditMode]="isEditMode"
                [isExpressionMode]="isExpressionMode"
                [size]="size"
                (modeChange)="onModeChange($event)"
                (sizeChange)="size = $event">
            </app-editor-settings>
        </header>

        <div class="main-layout">
            <div class="content-area">
                <nav class="screen-tabs">
                    @for (screen of app.screens; track screen.id) {
                        <button 
                            [class.active]="activeScreen?.id === screen.id"
                            (click)="activeScreen = screen">
                            {{ screen.name }}
                        </button>
                    }
                </nav>

                <div class="screen-content">
                    @if (activeScreen) {
                        @if (activeScreen.type === 'list') {
                            <app-list-editor
                                [subtypeId]="activeScreen.typeId"
                                [appConfig]="app"
                                [mode]="mode"
                                [size]="size">
                            </app-list-editor>
                        }
                    } @else {
                        <div class="no-screen">
                            <p>No screens defined or selected.</p>
                        </div>
                    }
                </div>
            </div>

            <!-- Variables Sidebar -->
            <div class="sidebar">
                <h3>Variables</h3>
                <div class="var-list">
                    @for (v of variables; track v.name) {
                        <div 
                            class="var-item" 
                            draggable="true" 
                            (dragstart)="onVarDragStart($event, v)">
                            <div class="var-icon" [ngClass]="v.type">
                                @if(v.type === 'string') { $ }
                                @if(v.type === 'number') { 0 }
                                @if(v.type === 'boolean') { 0/1 }
                                @if(v.type === 'file') { 📄 }
                                @if(v.type === 'date') { 📅 }
                            </div>
                            <span class="var-name">{{ v.name }}</span>
                        </div>
                    }
                    <div 
                        class="var-item expression-item" 
                        draggable="true" 
                        (dragstart)="onExpressionDragStart($event)">
                        <div class="var-icon expression">=</div>
                        <span class="var-name">Expression</span>
                    </div>
                </div>
            </div>
        </div>
      } @else {
        <div class="loading">Loading App Runner...</div>
      }
    </div>
  `,
    styles: [`
    .runner-container { display: flex; flex-direction: column; height: 100vh; background: #fff; }
    header { 
        display: flex; justify-content: space-between; align-items: center; 
        padding: 10px 20px; border-bottom: 1px solid #eee; background: #fff;
    }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .back-link { background: none; border: none; color: #666; cursor: pointer; font-size: 0.9rem; }
    h1 { margin: 0; font-size: 1.4rem; color: #333; }

    .main-layout { display: flex; flex: 1; overflow: hidden; }
    .content-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    
    .screen-tabs { display: flex; background: #f8f9fa; padding: 0 20px; border-bottom: 1px solid #eee; }
    .screen-tabs button {
        padding: 10px 20px; background: none; border: none; cursor: pointer;
        color: #666; font-weight: 500; border-bottom: 2px solid transparent;
    }
    .screen-tabs button.active { color: #2196F3; border-bottom-color: #2196F3; }

    .screen-content { flex: 1; padding: 20px; overflow-y: auto; }

    .sidebar { width: 220px; border-left: 1px solid #eee; padding: 15px; overflow-y: auto; }
    .sidebar h3 { margin-top: 0; font-size: 1rem; color: #555; }
    
    .var-list { display: grid; gap: 8px; }
    .var-item {
        display: flex; align-items: center; padding: 6px 10px; border: 1px solid #eee;
        border-radius: 4px; background: #fff; cursor: grab; font-size: 0.85rem;
    }
    .var-icon { 
        width: 20px; height: 20px; border-radius: 3px; background: #eee; 
        display: flex; align-items: center; justify-content: center; margin-right: 8px;
        font-weight: bold; font-size: 10px;
    }
    .var-icon.string { background: #e3f2fd; color: #1976D2; }
    .var-icon.number { background: #e8f5e9; color: #388E3C; }
    .var-icon.boolean { background: #fff3e0; color: #F57C00; }
    .var-icon.file { background: #f3e5f5; color: #7B1FA2; }
    .var-icon.date { background: #e0f7fa; color: #00838F; }
    .var-icon.expression { background: #eceff1; color: #555; }
    
    .no-screen { text-align: center; padding: 100px; color: #999; }
  `]
})
export class AppRunnerComponent implements OnInit, OnDestroy {
    app: AppConfig | null = null;
    activeScreen: AppScreen | null = null;
    private routeSub: Subscription | null = null;

    // Editor States
    isEditMode = true;
    isExpressionMode = false;
    mode: EditorMode = 'edit';
    size: EditorSize = 'medium';

    variables = [
        { name: 'Name', type: 'string' },
        { name: 'Town', type: 'string' },
        { name: 'Age', type: 'number' },
        { name: 'Count', type: 'number' },
        { name: 'Sex', type: 'boolean' },
        { name: 'Document1', type: 'file' },
        { name: 'ZipFile', type: 'file' },
        { name: 'Birthday', type: 'date' }
    ];

    constructor(private route: ActivatedRoute, private appService: AppService) { }

    ngOnInit() {
        this.routeSub = this.route.params.subscribe(params => {
            const slug = params['slug'];
            this.app = this.appService.getAppBySlug(slug) || null;
            if (this.app && this.app.screens.length > 0) {
                this.activeScreen = this.app.screens[0];
            }
        });
    }

    ngOnDestroy() {
        this.routeSub?.unsubscribe();
    }

    onModeChange(mode: EditorMode) {
        this.mode = mode;
    }

    onVarDragStart(event: DragEvent, variable: any) {
        if (event.dataTransfer) {
            event.dataTransfer.setData('application/x-editor-variable', JSON.stringify(variable));
            event.dataTransfer.effectAllowed = 'copy';
        }
    }

    onExpressionDragStart(event: DragEvent) {
        if (event.dataTransfer) {
            event.dataTransfer.setData('application/x-editor-variable', JSON.stringify({ type: 'expression' }));
            event.dataTransfer.effectAllowed = 'copy';
        }
    }
}
