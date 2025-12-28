# Framework Templates Reference

This document provides framework-specific patterns and best practices for generating components with the frontend-design skill.

## React

### File Structure

```
components/
├── Button/
│   ├── Button.tsx        # Component
│   ├── Button.css        # Styles (if using CSS)
│   ├── Button.module.css # Styles (if using CSS Modules)
│   ├── Button.test.tsx   # Tests
│   └── index.ts          # Re-export
```

### Component Pattern

```tsx
import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={`btn btn--${variant} btn--${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;
```

### Styling Options

**CSS Modules**:
```tsx
import styles from './Button.module.css';

<button className={styles.button} />
```

**Tailwind**:
```tsx
<button className="px-4 py-2 bg-blue-500 text-white rounded-lg" />
```

**Styled Components**:
```tsx
import styled from 'styled-components';

const StyledButton = styled.button`
  padding: 0.5rem 1rem;
  background: var(--color-primary);
`;
```

**Emotion**:
```tsx
import { css } from '@emotion/react';

const buttonStyle = css`
  padding: 0.5rem 1rem;
  background: var(--color-primary);
`;
```

---

## Vue 3

### File Structure

```
components/
├── Button.vue           # Single File Component
└── __tests__/
    └── Button.spec.ts   # Tests
```

### Component Pattern (Composition API)

```vue
<template>
  <button
    :class="[
      'btn',
      `btn--${variant}`,
      `btn--${size}`,
      { 'btn--disabled': disabled }
    ]"
    :disabled="disabled"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
});

const emit = defineEmits<{
  click: [];
}>();
</script>

<style scoped>
.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn--primary {
  background: var(--color-primary);
  color: white;
}

.btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

### Styling Options

**Scoped CSS** (default):
```vue
<style scoped>
.button { /* styles */ }
</style>
```

**CSS Modules**:
```vue
<style module>
.button { /* styles */ }
</style>

<template>
  <button :class="$style.button" />
</template>
```

**Tailwind**:
```vue
<template>
  <button class="px-4 py-2 bg-blue-500 text-white rounded-lg" />
</template>
```

---

## Svelte

### File Structure

```
components/
├── Button.svelte        # Component
└── Button.test.ts       # Tests
```

### Component Pattern

```svelte
<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
</script>

<button
  class="btn btn--{variant} btn--{size}"
  class:btn--disabled={disabled}
  {disabled}
  on:click
>
  <slot />
</button>

<style>
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn--primary {
    background: var(--color-primary);
    color: white;
  }

  .btn--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
```

### Styling Options

**Component Styles** (default):
```svelte
<style>
  /* Scoped by default */
  .button { /* styles */ }
</style>
```

**Global Styles**:
```svelte
<style global>
  .button { /* global styles */ }
</style>
```

**Tailwind**:
```svelte
<button class="px-4 py-2 bg-blue-500 text-white rounded-lg" />
```

---

## HTML (Vanilla)

### File Structure

```
components/
├── button.html          # Component HTML
├── button.css           # Component CSS
└── button.js            # Optional JavaScript
```

### Component Pattern

```html
<!-- button.html -->
<button class="btn btn--primary btn--md">
  Button Text
</button>
```

```css
/* button.css */
.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn--primary {
  background: var(--color-primary, #2563eb);
  color: white;
}

.btn--primary:hover {
  background: var(--color-primary-dark, #1d4ed8);
}

.btn--secondary {
  background: var(--color-gray-100, #f3f4f6);
  color: var(--color-gray-900, #111827);
}

.btn--ghost {
  background: transparent;
  color: var(--color-gray-700, #374151);
}

.btn--sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn--md {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.btn--lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

.btn:disabled,
.btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## Common Patterns

### Variant Classes

All frameworks use a consistent variant pattern:

```
.component--variant
.component--size
.component--state
```

Examples:
- `.btn--primary`, `.btn--secondary`, `.btn--ghost`
- `.btn--sm`, `.btn--md`, `.btn--lg`
- `.btn--disabled`, `.btn--loading`

### Prop/Attribute Naming

| Concept | React | Vue | Svelte |
|---------|-------|-----|--------|
| Style variant | `variant` | `variant` | `variant` |
| Size | `size` | `size` | `size` |
| Disabled | `disabled` | `disabled` | `disabled` |
| Click handler | `onClick` | `@click` | `on:click` |
| Children | `children` | `<slot />` | `<slot />` |

### Accessibility

All generated components include:

1. **Proper semantics** - Use native elements (`<button>`, `<input>`)
2. **Keyboard support** - Focus styles, keyboard handlers
3. **ARIA attributes** - When native semantics insufficient
4. **Focus management** - Visible focus indicators

### Dark Mode Support

When `--dark-mode` is enabled:

```css
/* Light mode (default) */
.btn {
  background: white;
  color: #111827;
}

/* Dark mode */
.dark .btn,
[data-theme="dark"] .btn {
  background: #1f2937;
  color: white;
}

/* Or using media query */
@media (prefers-color-scheme: dark) {
  .btn {
    background: #1f2937;
    color: white;
  }
}
```

### Animation Levels

| Level | Description | Usage |
|-------|-------------|-------|
| `none` | No animations | Accessibility, performance |
| `subtle` | Micro-interactions | Most components |
| `expressive` | Bold animations | Hero sections, CTAs |

```css
/* Subtle */
.btn {
  transition: all 0.2s ease-out;
}

/* Expressive */
.btn {
  transition: all 0.3s ease-out;
}
.btn:hover {
  transform: scale(1.05);
}
.btn:active {
  transform: scale(0.95);
}
```

---

## Best Practices

1. **Use semantic HTML** - `<button>` for buttons, `<a>` for links
2. **Include TypeScript types** - For React and Vue
3. **Support variants** - Primary, secondary, ghost at minimum
4. **Include sizes** - sm, md, lg
5. **Handle disabled state** - Visual and functional
6. **Add focus styles** - Visible focus indicators
7. **Respect motion preferences** - `prefers-reduced-motion`
8. **Use CSS custom properties** - For theming flexibility
