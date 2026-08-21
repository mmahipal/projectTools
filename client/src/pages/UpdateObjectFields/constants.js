// Constants for UpdateObjectFields component

export const OBJECT_OPTIONS = [
  { value: 'project', label: 'Project' },
  { value: 'project objective', label: 'Project Objective' },
  { value: 'contributor project', label: 'Contributor Project' }
];

export const UPDATE_MODE_TYPES = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
  MAPPING: 'mapping'
};

export const UPDATE_MODES = {
  ALL: 'all',
  SPECIFIC: 'specific'
};

export const TRANSFORMATION_TYPES = {
  COPY: 'copy',
  UPPERCASE: 'uppercase',
  LOWERCASE: 'lowercase',
  TEXT_REPLACE: 'textReplace',
  CONCATENATE: 'concatenate',
  FORMULA: 'formula',
  DATE_FORMAT: 'dateFormat',
  NUMBER_FORMAT: 'numberFormat',
  VALUE_MAP: 'valueMap',
  SWITCH: 'switch',
  CONDITIONAL: 'conditional',
  DEFAULT_VALUE: 'defaultValue',
  TYPE_CONVERSION: 'typeConversion',
  VALIDATE_FORMAT: 'validateFormat',
  REMOVE_SPECIAL_CHARS: 'removeSpecialChars'
};

export const DEFAULT_FIELD_MAPPING = {
  id: Date.now(),
  targetField: '',
  sourceField: '',
  transformation: TRANSFORMATION_TYPES.COPY,
  formula: '',
  concatenateFields: [],
  separator: ' ',
  dateFormat: 'YYYY-MM-DD',
  numberFormat: '0.00',
  valueMappings: [{ from: '', to: '' }],
  conditionField: '',
  conditionValue: '',
  conditionOperator: 'equals',
  thenValue: '',
  elseValue: '',
  conditions: [{ id: Date.now(), field: '', operator: 'equals', value: '', logicalOperator: 'AND' }],
  findText: '',
  replaceText: '',
  replaceMode: 'all',
  caseSensitive: false,
  useRegex: false,
  defaultValue: '',
  applyWhen: 'empty',
  targetType: 'string',
  conversionFormat: '',
  validationType: 'email',
  customPattern: '',
  onInvalid: 'default',
  removeMode: 'removeAll',
  cases: [{ value: '', targetValue: '' }],
  switchDefaultValue: '',
  errorHandling: 'default'
};

export const DEFAULT_MULTIPLE_FIELD_UPDATE = {
  id: Date.now(),
  fieldName: '',
  updateMode: UPDATE_MODES.ALL,
  currentValue: '',
  newValue: '',
  fieldInfo: null,
  picklistValues: [],
  referenceSearchTerm: '',
  referenceSearchResults: [],
  searchingReference: false,
  showReferenceDropdown: false,
  currentValueReferenceSearchTerm: '',
  currentValueReferenceSearchResults: [],
  searchingCurrentValueReference: false,
  showCurrentValueReferenceDropdown: false
};

export const DEFAULT_FILTERS = {
  projectId: '',
  projectName: '',
  projectObjectiveId: '',
  projectObjectiveName: '',
  status: '',
  type: ''
};

export const DATE_FORMAT_OPTIONS = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g., 2024-01-15)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g., 01/15/2024)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g., 15/01/2024)' },
  { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD (e.g., 2024/01/15)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (e.g., 15-01-2024)' }
];

export const CONDITION_OPERATORS = [
  { value: 'equals', label: 'Equals (=)' },
  { value: 'notEquals', label: 'Not Equals (≠)' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'greaterThan', label: 'Greater Than (>)' },
  { value: 'lessThan', label: 'Less Than (<)' },
  { value: 'greaterThanOrEqual', label: 'Greater Than or Equal (≥)' },
  { value: 'lessThanOrEqual', label: 'Less Than or Equal (≤)' },
  { value: 'isEmpty', label: 'Is Empty' },
  { value: 'isNotEmpty', label: 'Is Not Empty' },
  { value: 'isNull', label: 'Is Null' },
  { value: 'isNotNull', label: 'Is Not Null' }
];

export const LOGICAL_OPERATORS = [
  { value: 'AND', label: 'AND' },
  { value: 'OR', label: 'OR' }
];

export const REPLACE_MODES = [
  { value: 'all', label: 'Replace All' },
  { value: 'first', label: 'Replace First' },
  { value: 'last', label: 'Replace Last' }
];

export const APPLY_WHEN_OPTIONS = [
  { value: 'empty', label: 'Empty String' },
  { value: 'null', label: 'Null Value' },
  { value: 'emptyOrNull', label: 'Empty or Null' },
  { value: 'invalid', label: 'Invalid/Invalid Type' }
];

export const TARGET_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' }
];

export const VALIDATION_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'url', label: 'URL' },
  { value: 'postalCode', label: 'Postal Code' },
  { value: 'custom', label: 'Custom Regex' }
];

export const ON_INVALID_OPTIONS = [
  { value: 'default', label: 'Use Default Value' },
  { value: 'skip', label: 'Skip Update' },
  { value: 'error', label: 'Throw Error' }
];

export const REMOVE_MODES = [
  { value: 'removeAll', label: 'Remove All Special Characters' },
  { value: 'keepOnlyNumbers', label: 'Keep Only Numbers' },
  { value: 'keepOnlyLetters', label: 'Keep Only Letters' },
  { value: 'keepOnlyAlphanumeric', label: 'Keep Only Letters and Numbers' }
];

export const BATCH_SIZE = 200;
export const MAX_HISTORY_STATES = 50;

