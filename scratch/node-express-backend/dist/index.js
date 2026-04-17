"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const health_route_1 = __importDefault(require("./routes/health.route"));
const interview_route_1 = __importDefault(require("./routes/interview.route"));
const crewai_route_1 = __importDefault(require("./routes/crewai.route"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/health', health_route_1.default);
app.use('/interview', interview_route_1.default);
app.use('/crewai', crewai_route_1.default);
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
// Force event loop to stay alive
setInterval(() => { }, 1000 * 60 * 60);
