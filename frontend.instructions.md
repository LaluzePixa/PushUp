# Instrucciones Específicas para Frontend React

## Framework y Tecnologías
- React 18+ con TypeScript
- Vite como bundler
- Tailwind CSS para estilos
- React Router para navegación

## Patrones de Componentes

### Estructura de Componentes
```typescript
interface ComponentProps {
  // Definir props aquí
}

export const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Hooks al inicio
  // Lógica del componente
  // Return JSX
}
```

### Custom Hooks
- Prefijo "use" obligatorio
- Lógica reutilizable extraída de componentes
- Return objeto con nombres descriptivos

### Context Pattern
```typescript
interface ContextType {
  // Definir tipo del contexto
}

export const Context = createContext<ContextType | undefined>(undefined);

export const useContext = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error('useContext must be used within Provider');
  }
  return context;
}
```

## Estilos y UI

### Tailwind CSS
- Usar utility classes
- Responsive design mobile-first
- Componentes reutilizables en carpeta ui/
- Dark mode support cuando sea aplicable

### Componentes UI
- Usar shadcn/ui patterns
- Props consistentes (variant, size, disabled, etc.)
- Forward refs para componentes base
- Composición sobre herencia

## Estado y Datos

### Estado Local
- useState para estado simple
- useReducer para estado complejo
- useCallback y useMemo para optimización

### Estado Global
- Context API para estado de aplicación
- Local storage para persistencia cuando necesario
- Separar estado de UI del estado de datos

## Gestión de Errores
- Error boundaries para capturar errores
- Try/catch en async operations
- Mostrar mensajes de error user-friendly
- Logs de errores para debugging

## Performance
- Lazy loading para rutas
- Code splitting por feature
- Memoización apropiada
- Virtualization para listas largas

## Accesibilidad
- Semantic HTML
- ARIA labels cuando necesario
- Keyboard navigation
- Screen reader friendly

Generar siempre código React que siga estos patrones y sea type-safe.