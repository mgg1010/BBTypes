import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppConfig, AppScreen } from '../models/app-models';
import { BBTypeService } from './bb-type.service';

@Injectable({
    providedIn: 'root'
})
export class AppService {
    private appsSubject = new BehaviorSubject<AppConfig[]>([]);
    public apps$ = this.appsSubject.asObservable();

    constructor(private bbTypeService: BBTypeService) {
        this.loadApps();
    }

    private loadApps() {
        const saved = localStorage.getItem('bb-apps');
        if (saved) {
            try {
                const apps = JSON.parse(saved);
                this.appsSubject.next(apps);
            } catch (e) {
                console.error('Failed to parse apps', e);
                this.appsSubject.next([]);
            }
        } else {
            // Migration logic: If no apps but we have global custom types, create a default app
            const customTypes = this.bbTypeService.getTypes().filter(t => t.userDefined);
            if (customTypes.length > 0) {
                const defaultApp: AppConfig = {
                    name: 'Default App',
                    slug: 'default-app',
                    types: [...customTypes],
                    screens: []
                };
                this.appsSubject.next([defaultApp]);
                this.saveApps();
            } else {
                this.appsSubject.next([]);
            }
        }
    }

    private saveApps() {
        localStorage.setItem('bb-apps', JSON.stringify(this.appsSubject.value));
    }

    getApps(): AppConfig[] {
        return this.appsSubject.value;
    }

    getAppBySlug(slug: string): AppConfig | undefined {
        return this.appsSubject.value.find(a => a.slug === slug);
    }

    addApp(app: AppConfig) {
        const current = this.appsSubject.value;
        this.appsSubject.next([...current, app]);
        this.saveApps();
    }

    updateApp(slug: string, updatedApp: AppConfig) {
        const current = this.appsSubject.value;
        const index = current.findIndex(a => a.slug === slug);
        if (index >= 0) {
            current[index] = updatedApp;
            this.appsSubject.next([...current]);
            this.saveApps();
        }
    }

    deleteApp(slug: string) {
        const current = this.appsSubject.value.filter(a => a.slug !== slug);
        this.appsSubject.next(current);
        this.saveApps();
    }

    exportApp(slug: string) {
        const app = this.getAppBySlug(slug);
        if (!app) return;

        const blob = new Blob([JSON.stringify(app, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${app.slug}-config.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    importApp(json: string): 'added' | 'replaced' | 'error' {
        try {
            const importedApp: AppConfig = JSON.parse(json);
            if (!importedApp.name || !importedApp.slug) return 'error';

            const existing = this.getAppBySlug(importedApp.slug);
            if (existing) {
                const confirmResult = confirm(`App with slug "${importedApp.slug}" already exists. Replace it?`);
                if (!confirmResult) return 'error';

                this.updateApp(importedApp.slug, importedApp);
                return 'replaced';
            } else {
                this.addApp(importedApp);
                return 'added';
            }
        } catch (e) {
            return 'error';
        }
    }
}
