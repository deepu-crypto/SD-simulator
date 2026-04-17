"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthStatus = void 0;
const health_service_1 = require("../services/health.service");
const getHealthStatus = (req, res) => {
    const status = (0, health_service_1.checkHealth)();
    res.status(200).json(status);
};
exports.getHealthStatus = getHealthStatus;
