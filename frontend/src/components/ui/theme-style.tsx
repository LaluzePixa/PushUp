import React from "react";
import { THEMES } from "./theme";

/**
 * Configuración de colores por key y por theme.
 * Ejemplo:
 * {
 *   primary: { light: '#fff', dark: '#000' },
 *   secondary: { light: '#eee', dark: '#111' }
 * }
 */
export type ThemeColorConfig = {
  [key: string]: string | Partial<Record<keyof typeof THEMES, string>>;
};

/**
 * Inyecta variables CSS para los colores según el theme.
 * Usa un id único para el selector.
 */
export function ThemeStyle({ id, config }: { id: string; config: ThemeColorConfig }) {
  // Filtra solo keys con color o theme
  const colorConfig = Object.entries(config).filter(
    ([, value]) => typeof value === "string" || typeof value === "object"
  );

  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-theme-style='${id}'] {
${colorConfig
  .map(([key, value]) => {
    const color = typeof value === "string" ? value : value?.[theme as keyof typeof THEMES];
    return color ? `  --color-${key}: ${color};` : null;
  })
  .filter(Boolean)
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  );
} 