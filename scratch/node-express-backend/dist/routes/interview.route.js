"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const interview_controller_1 = require("../controllers/interview.controller");
const router = (0, express_1.Router)();
// REST Endpoint: POST /interview/start
router.post('/start', interview_controller_1.startInterviewSession);
// REST Endpoint: POST /interview/next
router.post('/next', interview_controller_1.continueInterviewSession);
// REST Endpoint: POST /interview/final
router.post('/final', interview_controller_1.finalizeInterviewSession);
exports.default = router;
