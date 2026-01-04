import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AppService } from './services/app.service';
import { AppConfig } from './models/app-models';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    template: `
    <div class="dashboard-container">
      <header>
        <h1>App Factory 🏭</h1>
        <div class="header-actions">
           <button class="import-btn" (click)="fileInput.click()">📂 Import App</button>
           <input #fileInput type="file" (change)="handleImport($event)" style="display: none" accept=".json">
           <button class="add-btn" (click)="createNewApp()">+ New App</button>
        </div>
      </header>

      <div class="app-list">
        @if (apps.length === 0) {
          <div class="empty-state">
            <p>No apps yet. Create one to get started!</p>
          </div>
        } @else {
          @for (app of apps; track app.slug) {
            <div class="app-card">
              <div class="app-info">
                <h3>{{ app.name }}</h3>
                <span class="slug">/{{ app.slug }}</span>
              </div>
              <div class="app-actions">
                <button class="open-btn" (click)="openApp(app.slug)">🚀 Open</button>
                <button class="edit-btn" (click)="editApp(app.slug)">⚙️ Edit</button>
                <button class="export-btn" (click)="exportApp(app.slug)">💾 Save</button>
                <button class="delete-btn" (click)="deleteApp(app.slug)">🗑️</button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
    styles: [`
    .dashboard-container { padding: 40px; max-width: 1000px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    h1 { font-size: 2.5rem; color: #333; margin: 0; }
    .header-actions { display: flex; gap: 15px; }
    
    .app-list { display: grid; gap: 20px; }
    .app-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: transform 0.2s;
      border: 1px solid #eee;
    }
    .app-card:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.1); }
    
    .app-info h3 { margin: 0 0 5px 0; color: #1a1a1a; }
    .slug { color: #666; font-size: 0.9rem; font-family: monospace; }
    
    .app-actions { display: flex; gap: 10px; }
    button {
      padding: 10px 18px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.9; }
    
    .add-btn { background: #4CAF50; color: white; }
    .import-btn { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
    .open-btn { background: #2196F3; color: white; }
    .edit-btn { background: #673AB7; color: white; }
    .export-btn { background: #607D8B; color: white; }
    .delete-btn { background: #ffeb3b21; color: #d32f2f; border: 1px solid #ff52522e; }
    .delete-btn:hover { background: #ffebee; }
    
    .empty-state {
      text-align: center;
      padding: 60px;
      background: #f9f9f9;
      border-radius: 12px;
      border: 2px dashed #ddd;
      color: #777;
    }
  `]
})
export class AppDashboardComponent implements OnInit {
    apps: AppConfig[] = [];

    constructor(private appService: AppService, private router: Router) { }

    ngOnInit() {
        this.appService.apps$.subscribe(apps => this.apps = apps);
    }

    createNewApp() {
        const name = prompt('Enter App Name:');
        if (!name) return;
        const slug = name.toLowerCase().replace(/\\s+/g, '-');
        const newApp: AppConfig = {
            name,
            slug,
            types: [],
            screens: []
        };
        this.appService.addApp(newApp);
        this.router.navigate(['/edit', slug]);
    }

    openApp(slug: string) {
        this.router.navigate(['/', slug]);
    }

    editApp(slug: string) {
        this.router.navigate(['/edit', slug]);
    }

    exportApp(slug: string) {
        this.appService.exportApp(slug);
    }

    deleteApp(slug: string) {
        if (confirm(`Are you sure you want to delete "${slug}"?`)) {
            this.appService.deleteApp(slug);
        }
    }

    handleImport(event: any) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const result = this.appService.importApp(e.target.result);
            if (result === 'error') alert('Failed to import app.');
        };
        reader.readAsText(file);
        event.target.value = '';
    }
}
