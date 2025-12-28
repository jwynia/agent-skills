#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * generate-component.ts - Component Template Generator
 *
 * Generates component templates with design-focused styling
 * for multiple frameworks (React, Vue, Svelte, HTML).
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { resolve, join } from "jsr:@std/path@1.0.8";
import { ensureDir } from "jsr:@std/fs@1.0.8/ensure-dir";

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "generate-component";

type Framework = "react" | "vue" | "svelte" | "html";
type Styling = "css" | "tailwind" | "css-modules" | "styled-components" | "emotion";
type Aesthetic = "minimal" | "bold" | "organic" | "brutalist" | "glassmorphism" | "neumorphism";
type Animation = "none" | "subtle" | "expressive";
type ComponentType = "button" | "card" | "input" | "modal" | "navigation" | "hero" | "custom";

// === Types ===
export interface ComponentSpec {
  name: string;
  type: ComponentType;
  framework: Framework;
  styling: Styling;
  aesthetic?: {
    style?: Aesthetic;
    animation?: Animation;
    darkMode?: boolean;
  };
  tokens?: string;
  props?: Record<string, { type: string; default?: string; required?: boolean }>;
  slots?: string[];
  variants?: string[];
}

interface GenerateOptions {
  specFile?: string;
  name: string;
  type: ComponentType;
  framework: Framework;
  styling: Styling;
  aesthetic?: Aesthetic;
  animation: Animation;
  darkMode: boolean;
  tokens?: string;
  outputDir: string;
}

// === Style Templates ===

const AESTHETIC_STYLES: Record<Aesthetic, Record<string, string>> = {
  minimal: {
    base: "border border-gray-200 bg-white text-gray-900",
    hover: "hover:border-gray-300",
    focus: "focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
    active: "active:bg-gray-50",
    transition: "transition-colors duration-150",
  },
  bold: {
    base: "bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold",
    hover: "hover:from-purple-700 hover:to-pink-700 hover:scale-105",
    focus: "focus:outline-none focus:ring-4 focus:ring-purple-300",
    active: "active:scale-95",
    transition: "transition-all duration-200 transform",
  },
  organic: {
    base: "bg-amber-50 text-amber-900 border-2 border-amber-200 rounded-3xl",
    hover: "hover:bg-amber-100 hover:border-amber-300",
    focus: "focus:outline-none focus:ring-2 focus:ring-amber-400",
    active: "active:bg-amber-200",
    transition: "transition-all duration-300 ease-out",
  },
  brutalist: {
    base: "bg-black text-white border-4 border-black font-mono uppercase tracking-wider",
    hover: "hover:bg-white hover:text-black",
    focus: "focus:outline-none focus:ring-0 focus:border-yellow-400",
    active: "active:translate-x-1 active:translate-y-1",
    transition: "transition-all duration-100",
  },
  glassmorphism: {
    base: "bg-white/20 backdrop-blur-lg border border-white/30 text-white shadow-xl",
    hover: "hover:bg-white/30",
    focus: "focus:outline-none focus:ring-2 focus:ring-white/50",
    active: "active:bg-white/40",
    transition: "transition-all duration-200",
  },
  neumorphism: {
    base: "bg-gray-100 text-gray-700 rounded-xl shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff]",
    hover: "hover:shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff]",
    focus: "focus:outline-none focus:shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff]",
    active: "active:shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff]",
    transition: "transition-shadow duration-200",
  },
};

const ANIMATION_STYLES: Record<Animation, string> = {
  none: "",
  subtle: "transition-all duration-200 ease-out",
  expressive: "transition-all duration-300 ease-out hover:scale-105 active:scale-95",
};

// === Component Templates ===

function getButtonTemplate(options: GenerateOptions): { styles: string; component: string } {
  const aesthetic = options.aesthetic || "minimal";
  const styles = AESTHETIC_STYLES[aesthetic];
  const animation = ANIMATION_STYLES[options.animation];

  const cssClasses = [
    "px-4 py-2 rounded-lg font-medium",
    styles.base,
    styles.hover,
    styles.focus,
    styles.active,
    animation || styles.transition,
  ].join(" ");

  if (options.styling === "tailwind") {
    return {
      styles: "",
      component: cssClasses,
    };
  }

  // CSS version
  const cssStyles = `
.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  ${aesthetic === "minimal" ? `
  border: 1px solid #e5e7eb;
  background: white;
  color: #111827;
  ` : ""}
  ${aesthetic === "bold" ? `
  background: linear-gradient(to right, #9333ea, #ec4899);
  color: white;
  font-weight: 700;
  border: none;
  ` : ""}
  transition: all 0.2s ease-out;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

.btn:active {
  transform: translateY(0);
}
${options.darkMode ? `
.dark .btn {
  background: #1f2937;
  color: white;
  border-color: #374151;
}
` : ""}`;

  return { styles: cssStyles, component: "btn" };
}

function getCardTemplate(options: GenerateOptions): { styles: string; component: string } {
  const aesthetic = options.aesthetic || "minimal";

  if (options.styling === "tailwind") {
    const classes: Record<Aesthetic, string> = {
      minimal: "bg-white border border-gray-200 rounded-lg shadow-sm p-6",
      bold: "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl p-8 shadow-2xl",
      organic: "bg-amber-50 border-2 border-amber-200 rounded-3xl p-8",
      brutalist: "bg-white border-4 border-black p-6",
      glassmorphism: "bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl p-6 shadow-xl",
      neumorphism: "bg-gray-100 rounded-2xl p-6 shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff]",
    };
    return { styles: "", component: classes[aesthetic] };
  }

  const cssStyles = `
.card {
  padding: 1.5rem;
  border-radius: 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.card-body {
  color: #374151;
}

.card-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}
${options.darkMode ? `
.dark .card {
  background: #1f2937;
  border-color: #374151;
  color: white;
}
` : ""}`;

  return { styles: cssStyles, component: "card" };
}

function getInputTemplate(options: GenerateOptions): { styles: string; component: string } {
  if (options.styling === "tailwind") {
    return {
      styles: "",
      component: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    };
  }

  const cssStyles = `
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.input {
  width: 100%;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-error {
  border-color: #ef4444;
}

.input-error-message {
  font-size: 0.875rem;
  color: #ef4444;
}
${options.darkMode ? `
.dark .input {
  background: #1f2937;
  border-color: #4b5563;
  color: white;
}
` : ""}`;

  return { styles: cssStyles, component: "input" };
}

// === Framework Generators ===

function generateReact(options: GenerateOptions, template: { styles: string; component: string }): string {
  const { name } = options;
  const propsInterface = `export interface ${name}Props {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}`;

  if (options.styling === "tailwind") {
    return `import React from 'react';

${propsInterface}

const variants = {
  primary: '${template.component}',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  ghost: 'bg-transparent hover:bg-gray-100',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function ${name}({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
}: ${name}Props) {
  return (
    <button
      className={\`\${variants[variant]} \${sizes[size]} \${className} \${disabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default ${name};
`;
  }

  if (options.styling === "css-modules") {
    return `import React from 'react';
import styles from './${name}.module.css';

${propsInterface}

export function ${name}({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
}: ${name}Props) {
  const classes = [
    styles.${template.component},
    styles[variant],
    styles[size],
    disabled ? styles.disabled : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

export default ${name};
`;
  }

  // Default CSS
  return `import React from 'react';
import './${name}.css';

${propsInterface}

export function ${name}({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
}: ${name}Props) {
  const classes = [
    '${template.component}',
    \`${template.component}--\${variant}\`,
    \`${template.component}--\${size}\`,
    disabled ? '${template.component}--disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

export default ${name};
`;
}

function generateVue(options: GenerateOptions, template: { styles: string; component: string }): string {
  const { name } = options;

  if (options.styling === "tailwind") {
    return `<template>
  <button
    :class="[
      '${template.component}',
      variants[variant],
      sizes[size],
      { 'opacity-50 cursor-not-allowed': disabled }
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}>();

defineEmits<{
  click: [];
}>();

const variants = {
  primary: '',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  ghost: 'bg-transparent hover:bg-gray-100',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};
</script>
`;
  }

  return `<template>
  <button
    :class="[
      '${template.component}',
      '${template.component}--' + variant,
      '${template.component}--' + size,
      { '${template.component}--disabled': disabled }
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>

<style scoped>
${template.styles}

.${template.component}--secondary {
  background: #f3f4f6;
  color: #111827;
}

.${template.component}--ghost {
  background: transparent;
  border: none;
}

.${template.component}--sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.${template.component}--lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

.${template.component}--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
`;
}

function generateSvelte(options: GenerateOptions, template: { styles: string; component: string }): string {
  const { name: _name } = options;

  if (options.styling === "tailwind") {
    return `<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;

  const variants = {
    primary: '${template.component}',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    ghost: 'bg-transparent hover:bg-gray-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
</script>

<button
  class="{variants[variant]} {sizes[size]} {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
  {disabled}
  on:click
>
  <slot />
</button>
`;
  }

  return `<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
</script>

<button
  class="${template.component} ${template.component}--{variant} ${template.component}--{size}"
  class:${template.component}--disabled={disabled}
  {disabled}
  on:click
>
  <slot />
</button>

<style>
${template.styles}

.${template.component}--secondary {
  background: #f3f4f6;
  color: #111827;
}

.${template.component}--ghost {
  background: transparent;
  border: none;
}

.${template.component}--sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.${template.component}--lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

.${template.component}--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
`;
}

function generateHTML(options: GenerateOptions, template: { styles: string; component: string }): string {
  const { name } = options;

  if (options.styling === "tailwind") {
    return `<!-- ${name} Component -->
<!-- Add Tailwind CSS to your project for these styles to work -->

<button class="${template.component}">
  Button Text
</button>

<!-- Variants -->
<button class="${template.component}">Primary</button>
<button class="bg-gray-100 text-gray-900 hover:bg-gray-200 px-4 py-2 rounded-lg">Secondary</button>
<button class="bg-transparent hover:bg-gray-100 px-4 py-2 rounded-lg">Ghost</button>
`;
  }

  return `<!-- ${name} Component -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} Component</title>
  <style>
${template.styles}

    .${template.component}--secondary {
      background: #f3f4f6;
      color: #111827;
    }

    .${template.component}--ghost {
      background: transparent;
      border: none;
    }

    .${template.component}--sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }

    .${template.component}--lg {
      padding: 0.75rem 1.5rem;
      font-size: 1.125rem;
    }

    .${template.component}--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <button class="${template.component}">Primary Button</button>
  <button class="${template.component} ${template.component}--secondary">Secondary Button</button>
  <button class="${template.component} ${template.component}--ghost">Ghost Button</button>
</body>
</html>
`;
}

// === File Extension Mapping ===

function getFileExtension(framework: Framework, styling: Styling): string {
  switch (framework) {
    case "react":
      return styling === "styled-components" || styling === "emotion" ? "tsx" : "tsx";
    case "vue":
      return "vue";
    case "svelte":
      return "svelte";
    case "html":
      return "html";
    default:
      return "txt";
  }
}

// === Core Generation Function ===

export async function generateComponent(options: GenerateOptions): Promise<Map<string, string>> {
  const outputs = new Map<string, string>();

  // Get template based on component type
  let template: { styles: string; component: string };

  switch (options.type) {
    case "button":
      template = getButtonTemplate(options);
      break;
    case "card":
      template = getCardTemplate(options);
      break;
    case "input":
      template = getInputTemplate(options);
      break;
    default:
      template = getButtonTemplate(options); // Default to button
  }

  // Generate component based on framework
  let componentCode: string;

  switch (options.framework) {
    case "react":
      componentCode = generateReact(options, template);
      break;
    case "vue":
      componentCode = generateVue(options, template);
      break;
    case "svelte":
      componentCode = generateSvelte(options, template);
      break;
    case "html":
      componentCode = generateHTML(options, template);
      break;
    default:
      throw new Error(`Unknown framework: ${options.framework}`);
  }

  const ext = getFileExtension(options.framework, options.styling);
  const fileName = `${options.name}.${ext}`;
  outputs.set(fileName, componentCode);

  // Generate separate CSS file if needed
  if (options.styling === "css" && template.styles && options.framework !== "html") {
    outputs.set(`${options.name}.css`, template.styles);
  }

  if (options.styling === "css-modules" && template.styles) {
    outputs.set(`${options.name}.module.css`, template.styles);
  }

  return outputs;
}

// === Help Text ===

function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Component Template Generator

Generates component templates with design-focused styling
for multiple frameworks (React, Vue, Svelte, HTML).

Usage:
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts [options] <output-dir>

Arguments:
  <output-dir>         Directory for output files

Options:
  -h, --help           Show this help message
  -v, --version        Show version
  --spec <file>        JSON specification file
  --name <name>        Component name (PascalCase)
  --type <type>        Component type: button, card, input, modal, navigation, hero
  --framework <fw>     Framework: react, vue, svelte, html
  --styling <type>     Styling: css, tailwind, css-modules, styled-components, emotion
  --aesthetic <type>   Aesthetic: minimal, bold, organic, brutalist, glassmorphism, neumorphism
  --animation <level>  Animation: none, subtle, expressive
  --dark-mode          Include dark mode support
  --tokens <file>      Use design tokens file

Examples:
  # Generate React button with Tailwind
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    --name Button --framework react --styling tailwind --aesthetic bold ./components/

  # Generate Vue card with CSS modules
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    --name Card --type card --framework vue --styling css-modules ./components/

  # Generate Svelte input with minimal aesthetic
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    --name Input --type input --framework svelte --aesthetic minimal ./components/

  # Generate from spec file
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    --spec component-spec.json ./components/
`);
}

// === Main CLI Handler ===

async function main(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    boolean: ["help", "version", "dark-mode"],
    string: ["spec", "name", "type", "framework", "styling", "aesthetic", "animation", "tokens"],
    alias: { h: "help", v: "version" },
    default: {
      type: "button",
      framework: "react",
      styling: "css",
      animation: "subtle",
      "dark-mode": false,
    },
  });

  if (parsed.help) {
    printHelp();
    Deno.exit(0);
  }

  if (parsed.version) {
    console.log(`${SCRIPT_NAME} v${VERSION}`);
    Deno.exit(0);
  }

  const outputDir = parsed._[0] as string;

  if (!outputDir) {
    console.error("Error: Output directory required");
    console.error("Use --help for usage information");
    Deno.exit(1);
  }

  if (!parsed.spec && !parsed.name) {
    console.error("Error: Component name required (--name or --spec)");
    console.error("Use --help for usage information");
    Deno.exit(1);
  }

  const validFrameworks: Framework[] = ["react", "vue", "svelte", "html"];
  const validStyling: Styling[] = ["css", "tailwind", "css-modules", "styled-components", "emotion"];
  const validAesthetics: Aesthetic[] = ["minimal", "bold", "organic", "brutalist", "glassmorphism", "neumorphism"];
  const validTypes: ComponentType[] = ["button", "card", "input", "modal", "navigation", "hero", "custom"];
  const validAnimations: Animation[] = ["none", "subtle", "expressive"];

  if (!validFrameworks.includes(parsed.framework as Framework)) {
    console.error(`Error: Invalid framework '${parsed.framework}'`);
    console.error(`Valid frameworks: ${validFrameworks.join(", ")}`);
    Deno.exit(1);
  }

  if (!validStyling.includes(parsed.styling as Styling)) {
    console.error(`Error: Invalid styling '${parsed.styling}'`);
    console.error(`Valid styling options: ${validStyling.join(", ")}`);
    Deno.exit(1);
  }

  if (parsed.aesthetic && !validAesthetics.includes(parsed.aesthetic as Aesthetic)) {
    console.error(`Error: Invalid aesthetic '${parsed.aesthetic}'`);
    console.error(`Valid aesthetics: ${validAesthetics.join(", ")}`);
    Deno.exit(1);
  }

  if (!validTypes.includes(parsed.type as ComponentType)) {
    console.error(`Error: Invalid type '${parsed.type}'`);
    console.error(`Valid types: ${validTypes.join(", ")}`);
    Deno.exit(1);
  }

  if (!validAnimations.includes(parsed.animation as Animation)) {
    console.error(`Error: Invalid animation '${parsed.animation}'`);
    console.error(`Valid animations: ${validAnimations.join(", ")}`);
    Deno.exit(1);
  }

  const options: GenerateOptions = {
    specFile: parsed.spec,
    name: parsed.name || "Component",
    type: parsed.type as ComponentType,
    framework: parsed.framework as Framework,
    styling: parsed.styling as Styling,
    aesthetic: parsed.aesthetic as Aesthetic | undefined,
    animation: parsed.animation as Animation,
    darkMode: parsed["dark-mode"],
    tokens: parsed.tokens,
    outputDir,
  };

  try {
    const outputs = await generateComponent(options);
    const outPath = resolve(outputDir);

    await ensureDir(outPath);

    for (const [fileName, content] of outputs) {
      const filePath = join(outPath, fileName);
      await Deno.writeTextFile(filePath, content);
      console.log(`Generated: ${filePath}`);
    }

    console.log(`\nSuccessfully generated ${outputs.size} file(s)`);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    Deno.exit(1);
  }
}

// === Entry Point ===

if (import.meta.main) {
  main(Deno.args);
}
