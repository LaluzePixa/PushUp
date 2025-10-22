'use client'
import { useState, useEffect } from 'react';
import { campaignsService, sitesService, Site, CampaignFormData } from '@/services/api';
import { useSiteContext } from '@/contexts/SiteContext';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCampaignModal({ isOpen, onClose, onSuccess }: CreateCampaignModalProps) {
  const { selectedSite } = useSiteContext();
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    title: '',
    body: '',
    iconUrl: '',
    imageUrl: '',
    clickUrl: '',
    badgeUrl: '',
    siteId: selectedSite?.id || undefined,
    sendType: 'immediate',
    scheduledAt: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actualizar siteId cuando cambie el sitio seleccionado
  useEffect(() => {
    if (selectedSite && isOpen) {
      setFormData(prev => ({
        ...prev,
        siteId: selectedSite.id
      }));
    }
  }, [selectedSite, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.title.trim() || !formData.body.trim()) {
      setError('El nombre, título y mensaje son requeridos');
      return;
    }

    if (!selectedSite) {
      setError('Debes tener un sitio seleccionado para crear una campaña');
      return;
    }

    if (formData.sendType === 'scheduled' && !formData.scheduledAt) {
      setError('La fecha de programación es requerida para envíos programados');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const campaignData = {
        name: formData.name.trim(),
        title: formData.title.trim(),
        body: formData.body.trim(),
        iconUrl: formData.iconUrl?.trim() || undefined,
        imageUrl: formData.imageUrl?.trim() || undefined,
        clickUrl: formData.clickUrl?.trim() || undefined,
        badgeUrl: formData.badgeUrl?.trim() || undefined,
        siteId: formData.siteId,
        sendType: formData.sendType,
        scheduledAt: formData.sendType === 'scheduled' ? formData.scheduledAt : undefined
      };

      console.log('📤 Enviando campaña:', campaignData);

      const response = await campaignsService.createCampaign(campaignData);

      console.log('✅ Respuesta de crear campaña:', response);

      if (response.success) {
        onSuccess();
        onClose();
        resetForm();

        const message = formData.sendType === 'scheduled'
          ? 'Campaña programada exitosamente'
          : formData.sendType === 'immediate'
            ? 'Campaña enviada exitosamente'
            : 'Campaña creada exitosamente';

        alert(message);
      } else {
        setError('Error al crear la campaña');
      }
    } catch (err: any) {
      console.error('❌ Error creating campaign:', err);

      let errorMessage = 'Error al crear la campaña';

      if (err.status === 400) {
        errorMessage = 'Datos de campaña inválidos. Verifica los campos requeridos.';
      } else if (err.status === 401) {
        errorMessage = 'No estás autenticado. Por favor, inicia sesión nuevamente.';
      } else if (err.status === 403) {
        errorMessage = 'No tienes permisos para crear campañas.';
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      body: '',
      iconUrl: '',
      imageUrl: '',
      clickUrl: '',
      badgeUrl: '',
      siteId: selectedSite?.id, // Mantener el sitio seleccionado
      sendType: 'immediate',
      scheduledAt: ''
    });
    setError(null);
  };

  if (!isOpen) return null;

  // Si no hay sitio seleccionado, mostrar mensaje de error
  if (!selectedSite) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-[#222] p-6 rounded-lg max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Sitio Requerido
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Debes seleccionar un sitio antes de crear una campaña. Por favor, selecciona un sitio desde el selector en la barra lateral.
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#222] p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
          Crear Nueva Campaña
        </h3>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de la Campaña *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                placeholder="Ej: Promoción de Verano"
                required
              />
            </div>

            {/* Mostrar sitio seleccionado como información */}
            {selectedSite && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Sitio:</strong> {selectedSite.name} ({selectedSite.domain})
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  La campaña se enviará a los suscriptores de este sitio
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título de la Notificación *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
              placeholder="Ej: ¡Nueva promoción disponible!"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mensaje *
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
              placeholder="Escribe el mensaje de tu notificación push..."
              rows={3}
              required
            />
          </div>

          {/* URLs opcionales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL de Destino (Opcional)
              </label>
              <input
                type="url"
                value={formData.clickUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, clickUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                placeholder="https://ejemplo.com/promocion"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL del Icono (Opcional)
              </label>
              <input
                type="url"
                value={formData.iconUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, iconUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                placeholder="https://ejemplo.com/icono.png"
              />
            </div>
          </div>

          {/* Tipo de envío */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Envío
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="immediate"
                  checked={formData.sendType === 'immediate'}
                  onChange={(e) => setFormData(prev => ({ ...prev, sendType: e.target.value as 'immediate' | 'scheduled' | 'draft' }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enviar inmediatamente</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="draft"
                  checked={formData.sendType === 'draft'}
                  onChange={(e) => setFormData(prev => ({ ...prev, sendType: e.target.value as 'immediate' | 'scheduled' | 'draft' }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Guardar como borrador</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="scheduled"
                  checked={formData.sendType === 'scheduled'}
                  onChange={(e) => setFormData(prev => ({ ...prev, sendType: e.target.value as 'immediate' | 'scheduled' | 'draft' }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Programar envío</span>
              </label>
            </div>
          </div>

          {/* Fecha de programación */}
          {formData.sendType === 'scheduled' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha y Hora de Envío *
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' :
                formData.sendType === 'immediate' ? 'Crear y Enviar' :
                  formData.sendType === 'scheduled' ? 'Programar' :
                    'Crear Borrador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}