"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crewai_controller_1 = require("../controllers/crewai.controller");
const router = (0, express_1.Router)();
router.post('/job', crewai_controller_1.startCrewAIJob);
router.get('/job/:id', crewai_controller_1.getCrewAIJobStatus);
exports.default = router;
