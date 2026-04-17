"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFinalStage = exports.getNextStage = exports.getInitialStage = void 0;
const STAGE_ORDER = [
    'requirements',
    'high_level_design',
    'database',
    'scaling',
    'tradeoffs',
    'final'
];
/**
 * Returns the starting stage of a system design interview.
 */
const getInitialStage = () => {
    return STAGE_ORDER[0];
};
exports.getInitialStage = getInitialStage;
/**
 * Returns the next logical stage in the interview progression.
 * If the current stage is the last, it returns 'final'.
 */
const getNextStage = (currentStage) => {
    const currentIndex = STAGE_ORDER.indexOf(currentStage);
    // If the stage isn't found or it's already the last stage, return 'final'
    if (currentIndex === -1 || currentIndex >= STAGE_ORDER.length - 1) {
        return 'final';
    }
    return STAGE_ORDER[currentIndex + 1];
};
exports.getNextStage = getNextStage;
/**
 * Checks if the given stage is the final stage of the interview.
 */
const isFinalStage = (stage) => {
    return stage === 'final';
};
exports.isFinalStage = isFinalStage;
