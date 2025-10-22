# Guía de Prompts Personalizados para GitHub Copilot

## 📋 Resumen

Este proyecto está configurado con prompts personalizados para GitHub Copilot que siguen las convenciones específicas de PushSaaS. Los archivos de instrucciones guían a Copilot para generar código consistente con nuestro stack tecnológico y mejores prácticas.

## 📁 Archivos de Configuración

### Instrucciones Principales
- **`.github/copilot-instructions.md`** - Instrucciones generales del proyecto
- **`frontend.instructions.md`** - Patrones específicos para React/TypeScript
- **`backend.instructions.md`** - Patrones específicos para Node.js/Express

### Prompts Reutilizables
- **`react-component.prompt.md`** - Template para crear componentes React
- **`api-endpoint.prompt.md`** - Template para crear endpoints de API

### Configuración VS Code
- **`.vscode/settings.json`** - Configuración para habilitar las instrucciones

## 🚀 Cómo Usar

### 1. Generación de Código con Contexto

Copilot ahora usará automáticamente las instrucciones del proyecto. Simplemente escribe prompts naturales:

```
# Chat de Copilot
Crea un componente para mostrar las campañas de notificaciones

# Copilot generará un componente React siguiendo:
# - TypeScript estricto
# - Tailwind CSS
# - Patrones de PushSaaS
# - Error handling
# - Accesibilidad
```

### 2. Usando Prompts Reutilizables

En el chat de Copilot, puedes usar los prompts predefinidos:

```
@workspace /react-component crear componente para dashboard de campañas
@workspace /api-endpoint crear endpoint para obtener estadísticas
```

### 3. Variables de Chat Útiles

- `#codebase` - Añade contexto del proyecto completo
- `#selection` - Incluye código seleccionado
- `#problems` - Incluye errores del panel de problemas
- `#testFailure` - Contexto de tests fallidos

### 4. Comandos Específicos

```bash
# Generar tests
/tests

# Configurar testing framework
/setupTests

# Generar documentación
/docs

# Explicar código seleccionado
/explain
```

## 💡 Ejemplos Prácticos

### Crear Componente de Notificación

```
Prompt: "Crea un componente NotificationCard que muestre el título, mensaje y estado de una notificación push. Debe tener acciones para marcar como leída y eliminar."

Resultado: Componente con TypeScript, Tailwind, props tipadas, handlers de eventos, y accesibilidad.
```

### Crear API para Campañas

```
Prompt: "Crea un endpoint POST /api/campaigns para crear una nueva campaña de notificaciones. Debe validar datos, autenticar usuario y manejar errores."

Resultado: Route handler con validación, middleware de auth, manejo de errores, y formato de respuesta consistente.
```

### Generar Tests

```
Prompt: "Genera tests para el componente CampaignForm"

Resultado: Tests con React Testing Library, casos edge, mocking de servicios, y assertions apropiadas.
```

## ⚙️ Configuración Avanzada

### Personalizar Instrucciones

Puedes editar cualquier archivo `.instructions.md` para ajustar los patrones:

```markdown
# En frontend.instructions.md
## Nuevos Patrones
- Usar React Query para data fetching
- Implementar virtualization para listas grandes
```

### Añadir Nuevos Prompts

Crea archivos `*.prompt.md` para tareas específicas:

```markdown
---
description: "Crear hook personalizado para manejo de estado"
---

# Custom Hook Template

Generar un custom hook que:
- Use TypeScript
- Maneje loading/error states
- Return interface consistente
- Incluya cleanup
```

### Configurar por Tecnología

Las instrucciones se aplican automáticamente según el contexto del archivo:
- Archivos `.tsx/.ts` en `/frontend` → usa `frontend.instructions.md`
- Archivos `.js` en `/server` → usa `backend.instructions.md`

## 🔧 Troubleshooting

### Las instrucciones no se aplican
1. Verifica que `github.copilot.chat.codeGeneration.useInstructionFiles` esté en `true`
2. Reinicia VS Code
3. Asegúrate que los archivos estén en las ubicaciones correctas

### Respuestas inconsistentes
1. Sé más específico en tus prompts
2. Incluye contexto relevante con variables como `#codebase`
3. Usa los prompts predefinidos para casos comunes

### Conflictos entre instrucciones
Las instrucciones se aplican en este orden:
1. Instrucciones generales (`.github/copilot-instructions.md`)
2. Instrucciones específicas (`frontend.instructions.md`, etc.)
3. Prompts reutilizables (`*.prompt.md`)

## 📚 Recursos Adicionales

- [Documentación oficial de GitHub Copilot](https://docs.github.com/copilot)
- [VS Code Copilot Extension](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)
- [Mejores prácticas para prompts](https://github.com/microsoft/copilot-docs)

---

**Nota:** Estas instrucciones se actualizarán automáticamente con cada cambio en los archivos de configuración. El objetivo es mantener la consistencia y calidad del código en todo el proyecto PushSaaS.