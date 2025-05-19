
/**
 * Re-export utility functions from the refactored files
 * This maintains backward compatibility with existing code that imports from routeProcessing.ts
 */

export { extractAndStoreRoutePoints } from './routeExtraction';
export { processRouteBatch } from './routeBatchProcessing';
export { processRouteWithWindAndEnergy } from './weatherProcessing';
export { updateRouteEnergyData, calculateMacronutrients } from './energyProcessing';
