import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-shell">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      background: #fdfdfd;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
  `]
})
export class AppComponent {
  title = 'App Factory';
}
