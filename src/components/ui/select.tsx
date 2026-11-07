"use client";

import * as React from "react";
import SearchableSelect, { type SelectOption } from "./searchable-select";

/**
 * Compatibility layer: keeps the `<Select><SelectTrigger><SelectValue/></…>`
 * shape that 7 files already use, but renders the one select the whole app
 * shares - so every dropdown gets type-ahead, full untruncated labels, and the
 * same panel, without rewriting each call site.
 *
 * `SelectItem`/`SelectContent`/`SelectTrigger` are never mounted as elements.
 * They are descriptors: `Select` walks its children, reads the placeholder off
 * `SelectValue` and the options off the `SelectItem`s, and renders
 * `SearchableSelect` instead. That is why they return null.
 */

type ItemProps = {
  value: string;
  children?: React.ReactNode;
  disabled?: boolean;
  /** Accepted for call-site compatibility; the shared panel styles the rows. */
  className?: string;
};

/** Flattens an item's children to the plain string the option list needs. */
function textOf(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement(node)) {
    return textOf((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}

function collectItems(node: React.ReactNode, out: SelectOption[] = []): SelectOption[] {
  React.Children.toArray(node).forEach((child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === SelectItem) {
      const p = child.props as ItemProps;
      out.push({ value: p.value, label: textOf(p.children) || p.value });
      return;
    }
    const p = child.props as { children?: React.ReactNode };
    if (p?.children) collectItems(p.children, out);
  });
  return out;
}

function findIn(
  node: React.ReactNode,
  match: (el: React.ReactElement) => boolean
): React.ReactElement | null {
  let found: React.ReactElement | null = null;
  React.Children.toArray(node).forEach((child) => {
    if (found || !React.isValidElement(child)) return;
    if (match(child)) {
      found = child;
      return;
    }
    const p = child.props as { children?: React.ReactNode };
    if (p?.children) found = findIn(p.children, match);
  });
  return found;
}

function Select({
  value,
  defaultValue,
  onValueChange,
  disabled,
  children,
}: {
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  // Uncontrolled callers (defaultValue only) still need their value to stick.
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const current = isControlled ? value ?? "" : internal;

  const options = React.useMemo(() => collectItems(children), [children]);

  const trigger = findIn(children, (el) => el.type === SelectTrigger);
  const valueEl = findIn(children, (el) => el.type === SelectValue);
  const placeholder =
    (valueEl?.props as { placeholder?: string } | undefined)?.placeholder ?? "Select…";
  const triggerClass = (trigger?.props as { className?: string } | undefined)?.className ?? "";

  return (
    <SearchableSelect
      value={current}
      onChange={(v) => {
        if (!isControlled) setInternal(v);
        onValueChange?.(v);
      }}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      // Call sites size their own trigger (often with `!` utilities, which win).
      className={triggerClass}
    />
  );
}

/* Descriptors - read by Select, never rendered. Declared without parameters so
   there is no unused binding; the prop types still check at every call site. */
const SelectTrigger: React.FC<{ className?: string; children?: React.ReactNode }> = () => null;
const SelectValue: React.FC<{ placeholder?: string; className?: string }> = () => null;
const SelectContent: React.FC<{ className?: string; children?: React.ReactNode }> = () => null;
const SelectItem: React.FC<ItemProps> = () => null;
const SelectGroup: React.FC<{ className?: string; children?: React.ReactNode }> = () => null;
const SelectLabel: React.FC<{ className?: string; children?: React.ReactNode }> = () => null;
const SelectSeparator: React.FC<{ className?: string }> = () => null;
const SelectScrollUpButton: React.FC<{ className?: string }> = () => null;
const SelectScrollDownButton: React.FC<{ className?: string }> = () => null;

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
