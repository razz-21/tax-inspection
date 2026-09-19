import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChartColumn,
  lucideClipboardCheck,
  lucideCreditCard,
  lucideGalleryVerticalEnd,
  lucideLayers,
  lucideLayoutDashboard,
  lucideSettings,
  lucideTruck,
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
      lucideTruck,
      lucideCreditCard,
      lucideLayers,
      lucideChartColumn,
      lucideUsers,
      lucideSettings,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main.layout.html',
})
export class MainLayout {
  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'lucideLayoutDashboard', link: '/main/dashboard' },
    { label: 'Deliveries', icon: 'lucideTruck', link: '/main/deliveries' },
    { label: 'Inspections', icon: 'lucideClipboardCheck', link: '/main/inspections' },
    { label: 'Payments', icon: 'lucideCreditCard', link: '/main/payments' },
    { label: 'Source of Materials', icon: 'lucideLayers', link: '/main/source-of-materials' },
    { label: 'Reports', icon: 'lucideChartColumn', link: '/main/reports' },
    { label: 'User Management', icon: 'lucideUsers', link: '/main/user-management' },
    { label: 'Profile & Settings', icon: 'lucideSettings', link: '/main/profile-settings' },
  ];
}
