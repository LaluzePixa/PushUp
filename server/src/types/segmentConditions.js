/**
 * Segment Condition Types and Validation
 * 
 * This module defines all available condition types for audience segmentation,
 * following Adobe Target's pattern of flexible, operator-based filtering.
 * 
 * Supported condition types:
 * - userAgent: Device/browser filtering
 * - createdAt: Temporal filtering
 * - siteId: Site-specific targeting
 * - country: Geographic country-level filtering
 * - state: Geographic state/region-level filtering
 * - city: Geographic city-level filtering
 */

/**
 * Available condition field types
 */
export const CONDITION_TYPES = {
    USER_AGENT: 'userAgent',
    CREATED_AT: 'createdAt',
    SITE_ID: 'siteId',
    COUNTRY: 'country',
    STATE: 'state',
    CITY: 'city'
};

/**
 * Operators available per condition type
 */
export const OPERATORS = {
    // String operators (userAgent, country, state, city)
    STRING: {
        EQUALS: 'equals',
        NOT_EQUALS: 'notEquals',
        CONTAINS: 'contains',
        NOT_CONTAINS: 'notContains',
        IN: 'in',              // Array of values
        NOT_IN: 'notIn'        // Array of values
    },

    // Date operators (createdAt)
    DATE: {
        AFTER: 'after',
        BEFORE: 'before',
        BETWEEN: 'between'
    },

    // Numeric/ID operators (siteId)
    NUMERIC: {
        EQUALS: 'equals',
        NOT_EQUALS: 'notEquals',
        IN: 'in',              // Array of values
        NOT_IN: 'notIn'        // Array of values
    }
};

/**
 * Condition field configuration
 * Defines which operators are valid for each field type
 */
export const FIELD_CONFIG = {
    [CONDITION_TYPES.USER_AGENT]: {
        label: 'User Agent',
        type: 'string',
        operators: [
            OPERATORS.STRING.CONTAINS,
            OPERATORS.STRING.NOT_CONTAINS,
            OPERATORS.STRING.EQUALS,
            OPERATORS.STRING.NOT_EQUALS
        ]
    },
    [CONDITION_TYPES.CREATED_AT]: {
        label: 'Created At',
        type: 'date',
        operators: [
            OPERATORS.DATE.AFTER,
            OPERATORS.DATE.BEFORE,
            OPERATORS.DATE.BETWEEN
        ]
    },
    [CONDITION_TYPES.SITE_ID]: {
        label: 'Site ID',
        type: 'numeric',
        operators: [
            OPERATORS.NUMERIC.EQUALS,
            OPERATORS.NUMERIC.NOT_EQUALS,
            OPERATORS.NUMERIC.IN,
            OPERATORS.NUMERIC.NOT_IN
        ]
    },
    [CONDITION_TYPES.COUNTRY]: {
        label: 'Country',
        type: 'string',
        operators: [
            OPERATORS.STRING.EQUALS,
            OPERATORS.STRING.NOT_EQUALS,
            OPERATORS.STRING.IN,
            OPERATORS.STRING.NOT_IN
        ]
    },
    [CONDITION_TYPES.STATE]: {
        label: 'State/Region',
        type: 'string',
        operators: [
            OPERATORS.STRING.EQUALS,
            OPERATORS.STRING.NOT_EQUALS,
            OPERATORS.STRING.IN,
            OPERATORS.STRING.NOT_IN
        ]
    },
    [CONDITION_TYPES.CITY]: {
        label: 'City',
        type: 'string',
        operators: [
            OPERATORS.STRING.EQUALS,
            OPERATORS.STRING.NOT_EQUALS,
            OPERATORS.STRING.IN,
            OPERATORS.STRING.NOT_IN
        ]
    }
};

/**
 * Default segment size limits
 */
export const SEGMENT_LIMITS = {
    DEFAULT_MAX_SIZE: 10000,
    ABSOLUTE_MAX_SIZE: 100000,
    MIN_SIZE: 1
};

/**
 * Validate a single condition
 * 
 * @param {string} field - The field name (e.g., 'country', 'userAgent')
 * @param {object} condition - The condition object with operator and value
 * @returns {string|null} - Error message if invalid, null if valid
 */
export const validateCondition = (field, condition) => {
    // Check if field type exists
    const fieldConfig = FIELD_CONFIG[field];
    if (!fieldConfig) {
        return `Campo de condición desconocido: ${field}`;
    }

    // Check if condition has an operator
    if (!condition || typeof condition !== 'object' || Object.keys(condition).length === 0) {
        return `La condición para ${field} debe tener al menos un operador`;
    }

    // Validate each operator in the condition
    for (const [operator, value] of Object.entries(condition)) {
        // Check if operator is valid for this field
        if (!fieldConfig.operators.includes(operator)) {
            return `Operador inválido '${operator}' para el campo ${field}. Operadores válidos: ${fieldConfig.operators.join(', ')}`;
        }

        // Validate value based on operator
        if (operator === OPERATORS.STRING.IN || operator === OPERATORS.STRING.NOT_IN ||
            operator === OPERATORS.NUMERIC.IN || operator === OPERATORS.NUMERIC.NOT_IN) {
            if (!Array.isArray(value) || value.length === 0) {
                return `El operador '${operator}' requiere un array no vacío de valores`;
            }
        } else if (operator === OPERATORS.DATE.BETWEEN) {
            if (!Array.isArray(value) || value.length !== 2) {
                return `El operador 'between' requiere un array con dos fechas [start, end]`;
            }
            if (new Date(value[0]) >= new Date(value[1])) {
                return `La fecha de inicio debe ser anterior a la fecha de fin`;
            }
        } else if (operator === OPERATORS.DATE.AFTER || operator === OPERATORS.DATE.BEFORE) {
            if (!value || isNaN(Date.parse(value))) {
                return `El operador '${operator}' requiere una fecha válida`;
            }
        } else {
            // For other operators, just check value exists
            if (value === undefined || value === null || value === '') {
                return `El operador '${operator}' requiere un valor`;
            }
        }
    }

    return null; // Valid
};

/**
 * Validate segment data structure
 * 
 * @param {object} data - Segment data to validate
 * @returns {string[]} - Array of error messages (empty if valid)
 */
export const validateSegmentData = (data) => {
    const errors = [];

    // Required fields
    if (!data.name?.trim()) {
        errors.push('El nombre del segmento es requerido');
    }

    if (!data.conditions || typeof data.conditions !== 'object') {
        errors.push('Las condiciones son requeridas');
        return errors; // Cannot continue validation without conditions
    }

    // Validate max_size
    if (data.max_size !== undefined && data.max_size !== null) {
        if (typeof data.max_size !== 'number' || data.max_size < SEGMENT_LIMITS.MIN_SIZE) {
            errors.push(`max_size debe ser un número mayor o igual a ${SEGMENT_LIMITS.MIN_SIZE}`);
        } else if (data.max_size > SEGMENT_LIMITS.ABSOLUTE_MAX_SIZE) {
            errors.push(`max_size no puede exceder ${SEGMENT_LIMITS.ABSOLUTE_MAX_SIZE}`);
        }
    }

    // Validate each condition
    for (const [field, condition] of Object.entries(data.conditions)) {
        const conditionError = validateCondition(field, condition);
        if (conditionError) {
            errors.push(conditionError);
        }
    }

    return errors;
};

/**
 * Get default segment configuration
 * 
 * @returns {object} - Default segment structure
 */
export const getDefaultSegment = () => ({
    name: '',
    description: '',
    conditions: {},
    max_size: SEGMENT_LIMITS.DEFAULT_MAX_SIZE,
    site_id: null
});

/**
 * Export all for convenience
 */
export default {
    CONDITION_TYPES,
    OPERATORS,
    FIELD_CONFIG,
    SEGMENT_LIMITS,
    validateCondition,
    validateSegmentData,
    getDefaultSegment
};
