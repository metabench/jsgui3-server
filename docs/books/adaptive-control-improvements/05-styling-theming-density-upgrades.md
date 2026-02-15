# Chapter 5 — Styling, Theming, and Density Upgrades

This chapter converts adaptive composition into reliable visual behavior by extending existing token and theme practices.

## 5.1 Current Baseline

`css/jsgui-tokens.css` already provides:

- strong base spacing and typography scales
- light/dark token bridges
- admin control token bridge (`--admin-*`)
- reduced-motion token durations

This is a strong foundation; the required improvements are additive.

## 5.2 Mode-Attribute Styling Policy

Use mode attributes as the primary adaptive selector strategy:

- `[data-layout-mode="phone"]`
- `[data-layout-mode="tablet"]`
- `[data-layout-mode="desktop"]`
- `[data-density-mode="compact|cozy|comfortable"]`
- `[data-interaction-mode="touch|pointer|hybrid"]`

Avoid distributing raw `@media` breakpoints through control CSS except where absolutely necessary.

## 5.3 Density Override Profiles

Define explicit density token overlays:

- Compact:
  - tighter spacing and row heights for high-density desktop/power users
- Cozy (default):
  - current baseline behavior
- Comfortable:
  - larger spacing and text rhythm for readability/accessibility

Token categories to override:

- `--j-space-*`
- `--admin-font-size`
- `--admin-row-height`
- `--admin-cell-padding`
- selected control-specific paddings where needed

## 5.4 Touch Interaction Floor

When `data-interaction-mode="touch"` is active:

- enforce minimum target height/width of 44px for actionable elements
- ensure spacing prevents accidental tap overlap
- prefer sheet/drawer transitions that preserve direct manipulation expectations

This should be implemented via token and selector policy, not one-off control hacks.

## 5.5 Control-Specific Styling Upgrades

### Master_Detail

- move hardcoded color/border values to admin tokens
- adjust master list item padding per density mode
- enforce phone-friendly detail panel spacing in sheet/overlay mode

### Tabbed_Panel

- tokenized active indicator thickness and spacing
- compact mode icon-first treatment while preserving ARIA labels
- touch mode minimum tab target sizing

### Split_Pane

- hide/de-emphasize drag handle in phone mode
- expose pointer-focused affordance only when interaction mode allows

### Data_Table

- mode-specific row density token sets
- readable card mode typography and spacing
- tokenized header/background contrasts for high-density modes

### Sidebar_Nav / Toolbar

- icon rail paddings and hit area tuning
- overflow menu spacing and typography consistency across density modes

### Modal / Form_Container

- sheet/full-screen presentation spacing in phone mode
- form section spacing scales tied to density

## 5.6 Theme Profile Extension

Theme persistence object should include:

- selected theme
- preferred density
- optional token overrides

It should exclude:

- runtime layout mode
- runtime viewport dimensions

## 5.7 Styling Quality Gates

A control styling upgrade is complete when:

1. All hardcoded adaptive-relevant spacing/sizing values are tokenized.
2. Mode-attribute selectors exist for behavior differences.
3. Touch target minimums pass in touch profiles.
4. Compact and comfortable density modes remain readable and usable.

Next: testing gates that verify composition and styling behavior across the viewport matrix.
