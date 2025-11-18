'use client';
import { useState, useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSiteContext } from "@/contexts/SiteContext";
import { optinsService, OptinConfigFormData } from "@/services/api";

export default function Optinp() {
  const { selectedSite } = useSiteContext();
  const { isSupported, isSubscribed, loading, error, subscribe, permission } = usePushNotifications();

  const [selectedType, setSelectedType] = useState("lightbox1");
  const [whenToShow, setWhenToShow] = useState("Show Immediately");
  const [animation, setAnimation] = useState("Drop-in");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [headline, setHeadline] = useState("");
  const [headlineEnabled, setHeadlineEnabled] = useState(false);
  const [text, setText] = useState("Would you like to receive notifications on latest updates?");
  const [textEnabled, setTextEnabled] = useState(true);
  const [cancelButton, setCancelButton] = useState("NOT YET");
  const [cancelBgColor, setCancelBgColor] = useState("#ffffff");
  const [cancelTextColor, setCancelTextColor] = useState("#000000");
  const [approveButton, setApproveButton] = useState("YES");
  const [approveBgColor, setApproveBgColor] = useState("#2563eb");
  const [approveTextColor, setApproveTextColor] = useState("#ffffff");
  const [rePromptDelay, setRePromptDelay] = useState("0");

  // Estados para guardar configuración
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [configId, setConfigId] = useState<number | null>(null);

  // Cargar configuración existente al cambiar de sitio
  useEffect(() => {
    const loadConfig = async () => {
      if (!selectedSite) return;

      try {
        const response = await optinsService.getConfig(selectedSite.id);
        if (response.success && response.data) {
          const config = response.data;
          setConfigId(config.id || null);
          setSelectedType(config.type);
          setWhenToShow(config.whenToShow);
          setAnimation(config.animation);
          setBackgroundColor(config.backgroundColor);
          setHeadline(config.headline);
          setHeadlineEnabled(config.headlineEnabled);
          setText(config.text);
          setTextEnabled(config.textEnabled);
          setCancelButton(config.cancelButton);
          setCancelBgColor(config.cancelBgColor);
          setCancelTextColor(config.cancelTextColor);
          setApproveButton(config.approveButton);
          setApproveBgColor(config.approveBgColor);
          setApproveTextColor(config.approveTextColor);
          setRePromptDelay(config.rePromptDelay);
        }
      } catch (error) {
        console.log('No hay configuración existente o error al cargar:', error);
        // No mostramos error porque es normal no tener configuración inicial
      }
    };

    loadConfig();
  }, [selectedSite]);

  // Función para guardar la configuración
  const handleSaveConfig = async () => {
    if (!selectedSite) {
      alert('Debe seleccionar un sitio primero');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const configData: OptinConfigFormData = {
        siteId: selectedSite.id,
        type: selectedType as 'lightbox1' | 'lightbox2' | 'bellIcon',
        whenToShow: whenToShow as 'Show Immediately' | 'After 5 seconds' | 'On exit intent',
        animation,
        backgroundColor,
        headline,
        headlineEnabled,
        text,
        textEnabled,
        cancelButton,
        cancelBgColor,
        cancelTextColor,
        approveButton,
        approveBgColor,
        approveTextColor,
        rePromptDelay
      };

      let response;
      if (configId) {
        // Actualizar configuración existente
        response = await optinsService.updateConfig(configId, configData);
      } else {
        // Crear nueva configuración
        response = await optinsService.saveConfig(configData);
      }

      if (response.success && response.data) {
        setConfigId(response.data.id || null);
        setLastSaved(new Date());
        alert('✅ Configuración guardada exitosamente');
      } else {
        setSaveError('Error al guardar la configuración');
      }
    } catch (error: unknown) {
      console.error('Error saving config:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar la configuración';
      setSaveError(errorMessage);
      alert(`❌ Error al guardar: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Función para manejar la suscripción cuando el usuario haga clic en "YES"
  const handleSubscribe = async () => {
    if (!selectedSite) {
      alert('Debe seleccionar un sitio primero');
      return;
    }

    const success = await subscribe(selectedSite.id);
    if (success) {
      alert('¡Te has suscrito exitosamente a las notificaciones!');
    } else if (error) {
      alert(`Error al suscribirse: ${error}`);
    }
  };

  // Función para mostrar el estado de las notificaciones
  const getNotificationStatus = () => {
    if (!isSupported) {
      return 'Las notificaciones no están soportadas en este navegador';
    }

    if (permission === 'denied') {
      return 'Permisos de notificación denegados';
    }

    if (isSubscribed) {
      return '✅ Ya estás suscrito a las notificaciones';
    }

    return 'Haz clic en "YES" en el preview para suscribirte';
  };

  const promptTypes = [
    {
      id: "lightbox1",
      name: "Lightbox 1",
      icon: (
        <div className="w-16 h-12 bg-neutral-100 dark:bg-neutral-800 rounded border-2 border-neutral-300 dark:border-neutral-600 flex items-center justify-center">
          <div className="w-8 h-6 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded flex items-center justify-center">
            <div className="w-4 h-1 bg-green-600 rounded"></div>
          </div>
        </div>
      )
    },
    {
      id: "lightbox2",
      name: "Lightbox 2",
      icon: (
        <div className="w-16 h-12 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-600 flex items-center justify-center">
          <div className="w-10 h-2 bg-green-600 rounded"></div>
        </div>
      )
    },
    {
      id: "bellIcon",
      name: "Bell Icon",
      icon: (
        <div className="w-16 h-12 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-600 flex items-center justify-center">
          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">🔔</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="flex gap-8 p-6 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      {/* Formulario a la izquierda */}
      <div className="flex-1 max-w-md">
        {/* Estado de las notificaciones */}
        <div className="mb-6 p-4 bg-white dark:bg-neutral-900 rounded-lg border-2 border-neutral-300 dark:border-neutral-700">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Estado de Notificaciones Push</h3>
          <p className="text-sm text-neutral-700 dark:text-neutral-300">{getNotificationStatus()}</p>
          {error && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Error: {error}</p>
              <button
                onClick={async () => {
                  if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    console.log('Registros SW:', registrations);
                    for (const reg of registrations) {
                      console.log('Desregistrando SW:', reg);
                      await reg.unregister();
                    }
                    alert('Service Workers eliminados. Recarga la página (F5)');
                  }
                }}
                className="mt-2 text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
              >
                🔄 Reiniciar Service Worker
              </button>
            </div>
          )}
          {selectedSite && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Sitio activo: {selectedSite.name} ({selectedSite.domain})
              {configId && <span className="ml-2 text-green-700 dark:text-green-300">• Config guardada (ID: {configId})</span>}
            </p>
          )}
          {!selectedSite && (
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
              ⚠️ Selecciona un sitio desde el menú lateral
            </p>
          )}
          {lastSaved && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              ✅ Última actualización: {lastSaved.toLocaleTimeString()}
            </p>
          )}
          {saveError && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              ❌ Error al guardar: {saveError}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            When to Show:
          </label>
          <select
            value={whenToShow}
            onChange={(e) => setWhenToShow(e.target.value)}
            className="w-full p-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option className="text-black dark:text-white bg-white dark:bg-neutral-900">Show Immediately</option>
            <option className="text-black dark:text-white bg-white dark:bg-neutral-900">After 5 seconds</option>
            <option className="text-black dark:text-white bg-white dark:bg-neutral-900">On exit intent</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-4">
            Select Custom-prompt Type:
          </label>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {promptTypes.map((type) => (
              <label key={type.id} className="cursor-pointer">
                <input
                  type="radio"

                  value={type.id}
                  checked={selectedType === type.id}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="sr-only"
                />
                <div className={`p-3 rounded-lg border-2 text-center transition-colors ${selectedType === type.id
                  ? 'border-green-600 bg-green-50 dark:bg-green-950/50'
                  : 'border-neutral-300 dark:border-neutral-700 hover:border-green-600 dark:hover:border-green-500 bg-white dark:bg-neutral-900'
                  }`}>
                  <div className="flex justify-center mb-2">
                    {type.icon}
                  </div>
                  <div className="flex items-center justify-center">
                    <input
                      type="radio"
                      checked={selectedType === type.id}
                      onChange={() => { }}
                      className="w-4 h-4 text-green-600 accent-green-600 mr-2"
                    />
                    <span className="text-xs text-neutral-700 dark:text-neutral-300">{type.name}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100 w-24">
              Animation:
            </label>
            <select
              value={animation}
              onChange={(e) => setAnimation(e.target.value)}
              className="flex-1 p-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option className="text-black dark:text-white bg-white dark:bg-neutral-900">Drop-in</option>
              <option className="text-black dark:text-white bg-white dark:bg-neutral-900">Fade-in</option>
              <option className="text-black dark:text-white bg-white dark:bg-neutral-900">Slide-up</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100 w-24">
              Background Color:
            </label>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-700 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100 w-24">
              Headline:
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="flex-1 p-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-neutral-900 text-black dark:text-white"
            />
            <input
              type="checkbox"
              checked={headlineEnabled}
              onChange={(e) => setHeadlineEnabled(e.target.checked)}
              className="w-4 h-4 text-green-600 accent-green-600"
            />
          </div>

          <div className="flex items-start gap-4">
            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100 w-24 pt-2">
              Text:
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="flex-1 p-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 resize-none bg-white dark:bg-neutral-900 text-black dark:text-white"
            />
            <input
              type="checkbox"
              checked={textEnabled}
              onChange={(e) => setTextEnabled(e.target.checked)}
              className="w-4 h-4 text-green-600 accent-green-600 mt-2"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100 w-24">
              Icon:
            </label>
            <button className="px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-md text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-neutral-900">
              Upload
            </button>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100 w-24">
              Cancel Button:
            </label>
            <input
              type="text"
              value={cancelButton}
              onChange={(e) => setCancelButton(e.target.value)}
              className="flex-1 p-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-neutral-900 text-black dark:text-white"
            />
            <input
              type="color"
              value={cancelBgColor}
              onChange={(e) => setCancelBgColor(e.target.value)}
              className="w-6 h-6 border-2 border-neutral-300 dark:border-neutral-700 rounded cursor-pointer"
            />
            <input
              type="color"
              value={cancelTextColor}
              onChange={(e) => setCancelTextColor(e.target.value)}
              className="w-6 h-6 border-2 border-neutral-300 dark:border-neutral-700 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100 w-24">
              Approve Button:
            </label>
            <input
              type="text"
              value={approveButton}
              onChange={(e) => setApproveButton(e.target.value)}
              className="flex-1 p-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-neutral-900 text-black dark:text-white"
            />
            <input
              type="color"
              value={approveBgColor}
              onChange={(e) => setApproveBgColor(e.target.value)}
              className="w-6 h-6 border-2 border-neutral-300 dark:border-neutral-700 rounded cursor-pointer"
            />
            <input
              type="color"
              value={approveTextColor}
              onChange={(e) => setApproveTextColor(e.target.value)}
              className="w-6 h-6 border-2 border-neutral-300 dark:border-neutral-700 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100 w-24">
              Re-prompt Delay:
            </label>
            <input
              type="number"
              value={rePromptDelay}
              onChange={(e) => setRePromptDelay(e.target.value)}
              className="w-20 p-2 border-2 border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-neutral-900 text-black dark:text-white"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">day(s)</span>
          </div>
        </div>
      </div>

      {/* Preview a la derecha */}
      <div className="flex-1 max-w-lg">
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            Preview:
          </label>
        </div>

        <div className="bg-neutral-100 dark:bg-neutral-900 p-8 rounded-lg h-96 flex items-center justify-center border-2 border-neutral-300 dark:border-neutral-700">
          {selectedType === "lightbox1" && (
            <div
              className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full"
              style={{ backgroundColor: backgroundColor }}
            >
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-12 h-12 mx-auto bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🔔</span>
                  </div>
                </div>
                {headline && headlineEnabled && (
                  <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">{headline}</h3>
                )}
                {text && textEnabled && (
                  <p className="text-neutral-700 dark:text-neutral-300 mb-6 text-sm">{text}</p>
                )}
                <div className="flex gap-3 justify-center">
                  <button
                    className="px-6 py-2 rounded-md text-sm font-medium hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: cancelBgColor,
                      color: cancelTextColor
                    }}
                    onClick={() => console.log('Usuario canceló la suscripción')}
                  >
                    {cancelButton}
                  </button>
                  <button
                    className="px-6 py-2 rounded-md text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                    style={{
                      backgroundColor: approveBgColor,
                      color: approveTextColor
                    }}
                    onClick={handleSubscribe}
                    disabled={loading || !selectedSite || isSubscribed}
                  >
                    {loading ? 'Suscribiendo...' : isSubscribed ? '✓ Suscrito' : approveButton}
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedType === "lightbox2" && (
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-lg max-w-xs w-full border-2 border-neutral-300 dark:border-neutral-700">
              <div className="h-2 bg-green-600 rounded mb-4"></div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4">{text}</p>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-1 text-xs border-2 border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  onClick={() => console.log('Usuario canceló la suscripción')}
                >
                  {cancelButton}
                </button>
                <button
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  onClick={handleSubscribe}
                  disabled={loading || !selectedSite || isSubscribed}
                >
                  {loading ? 'Suscribiendo...' : isSubscribed ? '✓ Suscrito' : approveButton}
                </button>
              </div>
            </div>
          )}

          {selectedType === "bellIcon" && (
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-lg border-2 border-neutral-300 dark:border-neutral-700">
              <button
                className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700 disabled:opacity-50"
                onClick={handleSubscribe}
                disabled={loading || !selectedSite || isSubscribed}
                title={isSubscribed ? 'Ya estás suscrito' : 'Suscribirse a notificaciones'}
              >
                {loading ? '⏳' : isSubscribed ? '✓' : '🔔'}
              </button>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="mt-6 space-y-3">
          <button
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            onClick={handleSaveConfig}
            disabled={isSaving || !selectedSite}
          >
            {isSaving ? 'Guardando...' : 'Guardar Configuración'}
          </button>

          <button
            className="w-full bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            onClick={async () => {
              try {
                let script;
                if (configId && selectedSite) {
                  // Usar configuración guardada
                  const response = await optinsService.generateCode(configId, 'javascript', selectedSite.id);
                  script = response.data?.code || generateIntegrationScript();
                } else {
                  // Usar configuración actual (no guardada)
                  script = generateIntegrationScript();
                }

                await navigator.clipboard.writeText(script);
                alert('✅ Código de integración copiado al portapapeles');
              } catch (error) {
                console.error('Error copying code:', error);
                // Fallback: usar configuración local
                const script = generateIntegrationScript();
                await navigator.clipboard.writeText(script);
                alert('✅ Código de integración copiado al portapapeles (configuración local)');
              }
            }}
            disabled={!selectedSite}
          >
            Copiar Código de Integración
          </button>

          <button
            className="w-full border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-4 py-2 rounded-md transition-colors font-medium"
            onClick={() => {
              if (!selectedSite) {
                alert('⚠️ Selecciona un sitio primero');
                return;
              }
              const url = generatePreviewUrl();
              console.log('Abriendo vista previa:', url);
              window.open(url, '_blank');
            }}
            disabled={!selectedSite}
          >
            Vista Previa en Sitio Web
          </button>
        </div>
      </div>
    </div>
  );

  // Función para generar el script de integración
  function generateIntegrationScript() {
    const config = {
      type: selectedType,
      whenToShow,
      animation,
      backgroundColor,
      headline: headlineEnabled ? headline : '',
      text: textEnabled ? text : '',
      cancelButton,
      cancelBgColor,
      cancelTextColor,
      approveButton,
      approveBgColor,
      approveTextColor,
      siteId: selectedSite?.id
    };

    return `<!-- PushSaaS Opt-in Prompt -->
<script>
(function() {
  var config = ${JSON.stringify(config, null, 2)};
  var script = document.createElement('script');
  script.src = '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/pushsaas.js';
  script.onload = function() {
    if (window.PushSaaS) {
      window.PushSaaS.init(config);
    }
  };
  document.head.appendChild(script);
})();
</script>`;
  }

  // Función para generar URL de vista previa
  function generatePreviewUrl() {
    const config = {
      type: selectedType,
      whenToShow,
      animation,
      backgroundColor,
      headline: headlineEnabled ? headline : '',
      text: textEnabled ? text : '',
      cancelButton,
      cancelBgColor,
      cancelTextColor,
      approveButton,
      approveBgColor,
      approveTextColor,
      siteId: selectedSite?.id
    };

    const encodedConfig = encodeURIComponent(JSON.stringify(config));
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/demo.html?config=${encodedConfig}`;
  }
}