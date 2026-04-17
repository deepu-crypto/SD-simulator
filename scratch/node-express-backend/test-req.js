const problem = "Design Twitter";
const difficulty = "Senior";
fetch("http://localhost:3002/interview/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problem, difficulty })
}).then(res => res.json()).then(console.log).catch(console.error);
