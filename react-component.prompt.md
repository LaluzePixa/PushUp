---
description: "Generar un componente React con TypeScript siguiendo las mejores prácticas de PushSaaS"
---

# Crear Componente React

Generar un componente React funcional con TypeScript que siga estos patrones:

## Estructura del Componente

1. **Imports ordenados:**
   - React y hooks de React
   - Librerías externas
   - Componentes internos
   - Tipos e interfaces
   - Utilidades y helpers

2. **Interface para Props:**
   ```typescript
   interface ComponentNameProps {
     // Props tipadas con JSDoc comments
   }
   ```

3. **Componente funcional:**
   ```typescript
   export const ComponentName: React.FC<ComponentNameProps> = ({ ...props }) => {
     // Hooks al principio
     // Lógica del componente
     // Event handlers
     // Return JSX
   }
   ```

## Características Requeridas

- **TypeScript estricto:** Todos los tipos explícitos
- **Hooks apropiados:** useState, useEffect, useCallback según necesidad
- **Error handling:** Try/catch para operaciones async
- **Accesibilidad:** ARIA labels y semantic HTML
- **Tailwind CSS:** Para todos los estilos
- **Responsive design:** Mobile-first approach
- **Props validation:** Interface TypeScript completa
- **Performance:** useMemo/useCallback cuando sea apropiado

## Patrones Específicos

- **Event handlers:** Prefijo "handle" (handleClick, handleSubmit)
- **Custom hooks:** Extraer lógica reutilizable cuando sea complejo
- **Conditional rendering:** Usar early returns cuando sea posible
- **Error states:** Manejar loading, error, y success states
- **CSS classes:** Usar clsx para conditional classes

## JSDoc Documentation

Incluir comentarios JSDoc para:
- Descripción del componente
- Cada prop con ejemplo
- Eventos complejos
- Cualquier lógica no obvia

Generar código listo para producción que siga las convenciones de PushSaaS.