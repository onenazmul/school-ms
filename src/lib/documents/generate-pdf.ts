// lib/documents/generate-pdf.ts
// Server-side helper — wraps @react-pdf/renderer's renderToBuffer.
// Import and use this in all /app/api/documents/** route handlers.

import { renderToBuffer as _renderToBuffer } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

/**
 * Renders a @react-pdf/renderer <Document> element to a Buffer.
 * Returns a Uint8Array suitable for Next.js Response bodies.
 */
export async function renderToBuffer(element: ReactElement): Promise<Uint8Array> {
  const buf = await _renderToBuffer(element as any);
  return new Uint8Array(buf);
}

/**
 * Convenience: create element + render to buffer in one call.
 */
export async function renderComponentToBuffer<P extends object>(
  Component: (props: P) => ReactElement,
  props: P,
): Promise<Uint8Array> {
  const element = createElement(Component, props);
  return renderToBuffer(element);
}
