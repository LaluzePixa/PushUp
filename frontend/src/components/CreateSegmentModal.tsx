'use client'
import { useState, useEffect } from 'react';
import { segmentsService, SegmentFormData } from '@/services/api';
import { useSiteContext } from '@/contexts/SiteContext';

interface CreateSegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ConditionType =
  // Site Behavior
  | 'weeksSinceLastVisit'
  // Subscription
  | 'dateOfSubscription'
  | 'daysSinceSubscription'
  | 'createdAt'
  // Location
  | 'city'
  | 'state'
  | 'country'
  // Device Info
  | 'deviceType'
  | 'browser'
  | 'browserLanguage'
  | 'operatingSystem'
  | 'userAgent'
  // Site
  | 'siteId';

export default function CreateSegmentModal({ isOpen, onClose, onSuccess }: CreateSegmentModalProps) {
  const { selectedSite, sites } = useSiteContext();
  const [formData, setFormData] = useState<SegmentFormData>({
    name: '',
    description: '',
    siteId: undefined,
    conditions: {},
    maxSize: 10000
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conditionType, setConditionType] = useState<ConditionType>('country');

  // Inicializar el siteId con el sitio seleccionado
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

    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await segmentsService.create(formData);
      onSuccess();
      onClose();
      resetForm();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el segmento';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      siteId: selectedSite?.id, // Mantener el sitio seleccionado
      conditions: {},
      maxSize: 10000
    });
    setConditionType('country');
    setError(null);
  };

  const handleConditionChange = (field: string, value: string | number | string[] | undefined) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [conditionType]: {
          ...(prev.conditions[conditionType] || {}),
          [field]: value
        }
      }
    }));
  };

  const addCondition = (type: ConditionType) => {
    if (!type) return;

    const newCondition = { ...formData.conditions };

    // Inicializar la condición si no existe
    if (!newCondition[type]) {
      newCondition[type] = {};
    }

    setFormData(prev => ({ ...prev, conditions: newCondition }));
  };

  const handleConditionTypeChange = (newType: ConditionType) => {
    // Si la condición ya no existe, agregarla automáticamente
    if (!formData.conditions[newType]) {
      addCondition(newType);
    }
    setConditionType(newType);
  };

  const removeCondition = (type: keyof SegmentFormData['conditions']) => {
    const newConditions = { ...formData.conditions };
    delete newConditions[type];
    setFormData(prev => ({ ...prev, conditions: newConditions }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#222] p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
          Crear Nuevo Segmento
        </h3>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Segmento *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                placeholder="Ej: Usuarios Premium"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                placeholder="Descripción opcional del segmento"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sitio
              </label>
              <select
                value={formData.siteId || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  siteId: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
              >
                <option value="">Todos los sitios</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>
                    {site.name} ({site.domain})
                    {site.id === selectedSite?.id && ' - Sitio actual'}
                  </option>
                ))}
              </select>
              {selectedSite && (
                <p className="mt-1 text-sm text-gray-500">
                  Por defecto se asigna al sitio actual: <strong>{selectedSite.name}</strong>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tamaño Máximo del Segmento
              </label>
              <input
                type="number"
                min="1"
                max="100000"
                value={formData.maxSize || 10000}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  maxSize: parseInt(e.target.value) || 10000
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                placeholder="10000"
              />
              <p className="mt-1 text-sm text-gray-500">
                Límite de suscriptores en este segmento (1-100,000). Default: 10,000
              </p>
            </div>
          </div>

          {/* Condiciones */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Condiciones del Segmento
            </h4>

            {/* Selector de tipo de condición */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agregar Condición
              </label>
              <div className="flex space-x-2">
                <select
                  value={conditionType}
                  onChange={(e) => handleConditionTypeChange(e.target.value as ConditionType)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                >
                  <option value="" disabled>Select a condition</option>
                  <optgroup label="Site Behavior">
                    <option value="weeksSinceLastVisit">Weeks Since Last Visit</option>
                  </optgroup>
                  <optgroup label="Subscription">
                    <option value="dateOfSubscription">Date of Subscription</option>
                    <option value="daysSinceSubscription">Days Since Subscription</option>
                  </optgroup>
                  <optgroup label="Location">
                    <option value="city">City</option>
                    <option value="state">Region/State</option>
                    <option value="country">Country</option>
                  </optgroup>
                  <optgroup label="Device Info">
                    <option value="deviceType">Device Type (Mobile/Desktop)</option>
                    <option value="browser">Browser</option>
                    <option value="browserLanguage">Browser Language</option>
                    <option value="operatingSystem">Operating System</option>
                  </optgroup>
                </select>
                <button
                  type="button"
                  onClick={() => addCondition(conditionType)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Condiciones existentes */}
            <div className="space-y-4">
              {/* User Agent Conditions */}
              {formData.conditions.userAgent && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium text-gray-900 dark:text-white">Condiciones de User Agent</h5>
                    <button
                      type="button"
                      onClick={() => removeCondition('userAgent')}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Contiene</label>
                      <input
                        type="text"
                        value={formData.conditions.userAgent?.contains || ''}
                        onChange={(e) => handleConditionChange('contains', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                        placeholder="Ej: Chrome, Mobile"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">No Contiene</label>
                      <input
                        type="text"
                        value={formData.conditions.userAgent?.notContains || ''}
                        onChange={(e) => handleConditionChange('notContains', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                        placeholder="Ej: Bot"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Created At Conditions */}
              {formData.conditions.createdAt && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium text-gray-900 dark:text-white">Condiciones de Fecha</h5>
                    <button
                      type="button"
                      onClick={() => removeCondition('createdAt')}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Después de</label>
                      <input
                        type="date"
                        value={formData.conditions.createdAt?.after || ''}
                        onChange={(e) => handleConditionChange('after', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Antes de</label>
                      <input
                        type="date"
                        value={formData.conditions.createdAt?.before || ''}
                        onChange={(e) => handleConditionChange('before', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Site ID Conditions */}
              {formData.conditions.siteId && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium text-gray-900 dark:text-white">Condiciones de Sitio</h5>
                    <button
                      type="button"
                      onClick={() => removeCondition('siteId')}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Sitio específico</label>
                    <select
                      value={formData.conditions.siteId?.equals || ''}
                      onChange={(e) => handleConditionChange('equals', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Seleccionar sitio</option>
                      {sites.map(site => (
                        <option key={site.id} value={site.id}>
                          {site.name} ({site.domain})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Country Conditions */}
              {formData.conditions.country && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium text-gray-900 dark:text-white">🌍 Condiciones de País</h5>
                    <button
                      type="button"
                      onClick={() => removeCondition('country')}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Igual a</label>
                      <input
                        type="text"
                        value={formData.conditions.country?.equals || ''}
                        onChange={(e) => handleConditionChange('equals', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                        placeholder="Ej: United States, Mexico"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Diferente a</label>
                      <input
                        type="text"
                        value={formData.conditions.country?.notEquals || ''}
                        onChange={(e) => handleConditionChange('notEquals', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                        placeholder="Ej: Spain"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Incluir países (separados por coma)</label>
                    <input
                      type="text"
                      value={formData.conditions.country?.in?.join(', ') || ''}
                      onChange={(e) => handleConditionChange('in', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                      placeholder="Ej: United States, Canada, Mexico"
                    />
                  </div>
                </div>
              )}

              {/* State Conditions */}
              {formData.conditions.state && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium text-gray-900 dark:text-white">🗺️ Condiciones de Estado/Región</h5>
                    <button
                      type="button"
                      onClick={() => removeCondition('state')}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Igual a</label>
                      <input
                        type="text"
                        value={formData.conditions.state?.equals || ''}
                        onChange={(e) => handleConditionChange('equals', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                        placeholder="Ej: California, Texas"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Diferente a</label>
                      <input
                        type="text"
                        value={formData.conditions.state?.notEquals || ''}
                        onChange={(e) => handleConditionChange('notEquals', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                        placeholder="Ej: Alaska"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Incluir estados (separados por coma)</label>
                    <input
                      type="text"
                      value={formData.conditions.state?.in?.join(', ') || ''}
                      onChange={(e) => handleConditionChange('in', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                      placeholder="Ej: California, New York, Texas"
                    />
                  </div>
                </div>
              )}

              {/* City Conditions */}
              {formData.conditions.city && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium text-gray-900 dark:text-white">📍 Condiciones de Ciudad</h5>
                    <button
                      type="button"
                      onClick={() => removeCondition('city')}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Igual a</label>
                      <input
                        type="text"
                        value={formData.conditions.city?.equals || ''}
                        onChange={(e) => handleConditionChange('equals', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                        placeholder="Ej: Los Angeles, New York"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Diferente a</label>
                      <input
                        type="text"
                        value={formData.conditions.city?.notEquals || ''}
                        onChange={(e) => handleConditionChange('notEquals', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                        placeholder="Ej: Miami"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Incluir ciudades (separadas por coma)</label>
                    <input
                      type="text"
                      value={formData.conditions.city?.in?.join(', ') || ''}
                      onChange={(e) => handleConditionChange('in', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
                      placeholder="Ej: San Francisco, Seattle, Portland"
                    />
                  </div>
                </div>
              )}
            </div>

            {Object.keys(formData.conditions).length === 0 && (
              <p className="text-gray-500 text-sm">
                Sin condiciones específicas - incluirá todos los usuarios
              </p>
            )}
          </div>

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
              {loading ? 'Creando...' : 'Crear Segmento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}