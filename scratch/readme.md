frontend:
TAB1:start redis locally(powershell):
docker run -d --name crewai-redis -p 6379:6379 redis:alpine
run the executable file:.\venv\Scripts\python.exe worker.py
TAB2:Start backend(cmd)
backend:switch to scratch/node-express-backend:npm run start

TAB3:START ai(cmd)
switch to python-worker:python worker.py

last run crew job id : Crew Execution Started                                                                                                                        │
│  Name: crew                                                                                                                                                                               │
│  ID: 0b5e665d-5a40-4d6a-90fd-48bb05bb3c02  
