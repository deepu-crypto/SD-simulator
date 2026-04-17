import os
import json
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
import redis

# Load environment variables from the parent directory's .env
load_dotenv(dotenv_path="../.env")

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, db=0)

def create_and_run_crew(topic):
    # Extremely basic Crew AI setup for demonstration
    researcher = Agent(
        role='Senior Research Analyst',
        goal=f'Uncover cutting-edge developments in {topic}',
        backstory="You work at a leading tech think tank.",
        verbose=True,
        allow_delegation=False
    )

    writer = Agent(
        role='Tech Content Strategist',
        goal=f'Craft a compelling article summarizing insights on {topic}',
        backstory="You are a renowned Content Strategist.",
        verbose=True,
        allow_delegation=False
    )

    task1 = Task(
        description=f'Conduct a comprehensive analysis of {topic}.',
        expected_output='A full analysis report in bullet points.',
        agent=researcher
    )

    task2 = Task(
        description=f'Using the insights provided, develop an engaging blog post.',
        expected_output='A 3-paragraph blog post.',
        agent=writer
    )

    crew = Crew(
        agents=[researcher, writer],
        tasks=[task1, task2],
        verbose=True
    )

    result = crew.kickoff()
    return result

print("🔄 Python Worker is listening for CrewAI jobs on Redis...")

while True:
    try:
        # Block until a job is pushed to the 'crewai_queue' (timeout 0 = block forever)
        # bzpopmin or similar can be used for sorted sets, but we used lpush, so we use brpop
        queue, message = r.brpop('crewai_queue')
        
        job_data = json.loads(message.decode('utf-8'))
        job_id = job_data['id']
        payload = job_data['payload']
        topic = payload.get('topic', 'Artificial Intelligence')
        
        print(f"✅ Received job {job_id} with topic: {topic}")
        
        # Execute the Agentic Workflow
        print(f"🚀 Starting CrewAI pipeline...")
        result = create_and_run_crew(topic)
        
        # Update Redis with the final result
        completed_job = {
            'id': job_id,
            'status': 'completed',
            'result': str(result)
        }
        r.set(f"crewai_job:{job_id}", json.stringify(completed_job))
        
        print(f"🎉 Job {job_id} completed and saved to Redis.")
        
    except Exception as e:
        print(f"❌ Error processing job: {e}")
