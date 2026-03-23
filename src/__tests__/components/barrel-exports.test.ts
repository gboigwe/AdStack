import { describe, it, expect } from 'vitest';
import * as ui from '@/components/ui';
import * as forms from '@/components/forms';

/**
 * Barrel export smoke tests to ensure all public components
 * are correctly re-exported from their index files. Catches
 * accidental removal or typos in the barrel file.
 */

describe('UI barrel exports (@/components/ui)', () => {
  it('exports StatCard', () => {
    expect(ui.StatCard).toBeDefined();
  });

  it('exports CopyButton', () => {
    expect(ui.CopyButton).toBeDefined();
  });

  it('exports Badge and campaignStatusVariant', () => {
    expect(ui.Badge).toBeDefined();
    expect(ui.campaignStatusVariant).toBeDefined();
  });

  it('exports Skeleton family', () => {
    expect(ui.Skeleton).toBeDefined();
    expect(ui.SkeletonLines).toBeDefined();
    expect(ui.SkeletonStatCard).toBeDefined();
    expect(ui.SkeletonCard).toBeDefined();
    expect(ui.SkeletonStatGrid).toBeDefined();
  });

  it('exports Pagination', () => {
    expect(ui.Pagination).toBeDefined();
  });

  it('exports Modal', () => {
    expect(ui.Modal).toBeDefined();
  });

  it('exports ThemeToggle', () => {
    expect(ui.ThemeToggle).toBeDefined();
  });

  it('exports Breadcrumb', () => {
    expect(ui.Breadcrumb).toBeDefined();
  });

  it('exports PageTransition', () => {
    expect(ui.PageTransition).toBeDefined();
  });

  it('exports OfflineBanner', () => {
    expect(ui.OfflineBanner).toBeDefined();
  });

  it('exports Tooltip', () => {
    expect(ui.Tooltip).toBeDefined();
  });

  it('exports EmptyState', () => {
    expect(ui.EmptyState).toBeDefined();
  });

  it('exports DataTable', () => {
    expect(ui.DataTable).toBeDefined();
  });

  it('exports ConfirmDialog', () => {
    expect(ui.ConfirmDialog).toBeDefined();
  });

  it('exports ScrollToTop', () => {
    expect(ui.ScrollToTop).toBeDefined();
  });

  it('exports ProgressBar', () => {
    expect(ui.ProgressBar).toBeDefined();
  });

  it('exports ErrorBoundary', () => {
    expect(ui.ErrorBoundary).toBeDefined();
  });

  it('exports PageLoader and InlineLoader', () => {
    expect(ui.PageLoader).toBeDefined();
    expect(ui.InlineLoader).toBeDefined();
  });

  it('exports KeyboardShortcutHelp', () => {
    expect(ui.KeyboardShortcutHelp).toBeDefined();
  });

  it('exports Alert', () => {
    expect(ui.Alert).toBeDefined();
  });

  it('exports Tabs', () => {
    expect(ui.Tabs).toBeDefined();
  });

  it('exports SearchInput', () => {
    expect(ui.SearchInput).toBeDefined();
  });

  it('exports NotificationBell', () => {
    expect(ui.NotificationBell).toBeDefined();
  });

  it('exports LoadingButton', () => {
    expect(ui.LoadingButton).toBeDefined();
  });

  it('exports Avatar', () => {
    expect(ui.Avatar).toBeDefined();
  });

  it('exports Card, CardHeader, CardBody', () => {
    expect(ui.Card).toBeDefined();
    expect(ui.CardHeader).toBeDefined();
    expect(ui.CardBody).toBeDefined();
  });

  it('exports DropdownMenu', () => {
    expect(ui.DropdownMenu).toBeDefined();
  });
});

describe('Forms barrel exports (@/components/forms)', () => {
  it('exports FormInput', () => {
    expect(forms.FormInput).toBeDefined();
  });

  it('exports FormTextarea', () => {
    expect(forms.FormTextarea).toBeDefined();
  });

  it('exports FormSelect', () => {
    expect(forms.FormSelect).toBeDefined();
  });

  it('exports FormCheckbox', () => {
    expect(forms.FormCheckbox).toBeDefined();
  });

  it('exports FormRadioGroup', () => {
    expect(forms.FormRadioGroup).toBeDefined();
  });
});
