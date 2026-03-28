export const EXECUTION_TIMEOUTS = {
  cpp: 3000,
  java: 4000,
  javascript: 2500,
  python: 3000,
};

export const MEMORY_LIMITS = {
  cpp: 256,
  java: 512,
  javascript: 128,
  python: 256,
};

export const OUTPUT_CHARACTER_LIMIT = 10000;
export const MAX_RECURSION_DEPTH = 1000;

export const getExecutionTimeout = (language) => {
  return EXECUTION_TIMEOUTS[language] || 3000;
};

export const getMemoryLimit = (language) => {
  return MEMORY_LIMITS[language] || 256;
};
