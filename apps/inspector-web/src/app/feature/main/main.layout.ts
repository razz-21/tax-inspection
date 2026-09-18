import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideClipboardCheck,
  lucideGalleryVerticalEnd,
  lucideLayoutDashboard,
  lucideUsers,
} from '@ng-icons/lucide';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { Topbar } from '../../components/topbar/topbar';

interface NavItem {
  label: string;
  icon: string;
  link: string;
}

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    NgIcon,
    HlmSidebarImports,
    Topbar,
  ],
  providers: [
    provideIcons({
      lucideGalleryVerticalEnd,
      lucideLayoutDashboard,
      lucideClipboardCheck,
      lucideUsers,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main.layout.html',
})
export class MainLayout {
  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'lucideLayoutDashboard', link: '/main/dashboard' },
    { label: 'Inspections', icon: 'lucideClipboardCheck', link: '/main/inspections' },
    { label: 'User Management', icon: 'lucideUsers', link: '/main/user-management' },
  ];
}
