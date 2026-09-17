import {
  booleanAttribute,
  computed,
  Directive,
  effect,
  ElementRef,
  HOST_TAG_NAME,
  inject,
  input,
  Renderer2,
  signal,
} from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ClassValue } from 'clsx';
import { injectBrnButtonConfig } from './hlm-button.token';

export const buttonVariants = cva(
	"focus-visible:border-ring focus-visible:ring-ring/50 data-[matches-spartan-invalid=true]:ring-destructive/20 dark:data-[matches-spartan-invalid=true]:ring-destructive/40 data-[matches-spartan-invalid=true]:border-destructive dark:data-[matches-spartan-invalid=true]:border-destructive/50 rounded-md border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-3 active:not-aria-[haspopup]:translate-y-px data-[matches-spartan-invalid=true]:ring-3 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0",
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground hover:bg-primary/80',
				outline: 'border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground shadow-xs',
				secondary: 'bg-secondary text-secondary-foreground aria-expanded:bg-secondary aria-expanded:text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]',
				ghost: 'hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground',
				destructive: 'bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
				xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(3)]",
				sm: 'h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5',
				lg: 'h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
				icon: 'size-9',
				'icon-xs': "size-6 rounded-[min(var(--radius-md),8px)] in-data-[slot=button-group]:rounded-md [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(3)]",
				'icon-sm': 'size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md',
				'icon-lg': 'size-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

@Directive({
	selector: 'button[hlmBtn], a[hlmBtn]',
	exportAs: 'hlmBtn',
	host: {
		'data-slot': 'button',
		'[attr.tabindex]': '_isDisabled() ? -1 : null',
		'[attr.disabled]': '(!_isAnchor && _isDisabled()) || null',
		'[attr.aria-disabled]': '(_isAnchor && _isDisabled()) || null',
		'[attr.data-disabled]': '_isDisabled() || null',
		'[attr.aria-busy]': 'loading() || null',
		'(click)': '_onClick($event)',
	},
})
export class HlmButton {
	private readonly _config = injectBrnButtonConfig();
	private readonly _elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
	private readonly _renderer = inject(Renderer2);
	protected readonly _isAnchor = inject(HOST_TAG_NAME) === 'a';

	private readonly _additionalClasses = signal<ClassValue>('');
	private _spinner: SVGElement | null = null;

	public readonly variant = input<ButtonVariants['variant']>(this._config.variant);

	public readonly size = input<ButtonVariants['size']>(this._config.size);

	public readonly disabled = input(false, { transform: booleanAttribute });

	/** When true, shows a leading spinner and disables the button. */
	public readonly loading = input(false, { transform: booleanAttribute });

	protected readonly _isDisabled = computed(() => this.disabled() || this.loading());

	constructor() {
		classes(() => [buttonVariants({ variant: this.variant(), size: this.size() }), this._additionalClasses()]);
		effect(() => (this.loading() ? this._mountSpinner() : this._unmountSpinner()));
	}

	protected _onClick(event: Event): void {
		if (this._isDisabled()) {
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	}

	private _mountSpinner(): void {
		if (this._spinner) return;
		const ns = 'http://www.w3.org/2000/svg';
		const svg = this._renderer.createElement('svg', ns) as SVGElement;
		this._renderer.setAttribute(svg, 'viewBox', '0 0 24 24');
		this._renderer.setAttribute(svg, 'fill', 'none');
		this._renderer.setAttribute(svg, 'stroke', 'currentColor');
		this._renderer.setAttribute(svg, 'stroke-width', '2');
		this._renderer.setAttribute(svg, 'stroke-linecap', 'round');
		this._renderer.setAttribute(svg, 'aria-hidden', 'true');
		this._renderer.setAttribute(svg, 'class', 'animate-spin');
		this._renderer.setStyle(svg, 'width', '1em');
		this._renderer.setStyle(svg, 'height', '1em');
		const path = this._renderer.createElement('path', ns);
		this._renderer.setAttribute(path, 'd', 'M21 12a9 9 0 1 1-6.219-8.56');
		this._renderer.appendChild(svg, path);
		const host = this._elementRef.nativeElement;
		this._renderer.insertBefore(host, svg, host.firstChild);
		this._spinner = svg;
	}

	private _unmountSpinner(): void {
		if (!this._spinner) return;
		this._renderer.removeChild(this._elementRef.nativeElement, this._spinner);
		this._spinner = null;
	}

	setClass(classes: string): void {
		this._additionalClasses.set(classes);
	}
}
