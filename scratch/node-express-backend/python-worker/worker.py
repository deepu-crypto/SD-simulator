import os
import json
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
import redis

# Load environment variables from the parent directory's .env
load_dotenv(dotenv_path="../.env")

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, db=0)
MAX_TOPIC_LENGTH = 120

def normalize_topic(raw_topic):
    if not isinstance(raw_topic, str):
        return 'Artificial Intelligence'

    topic = ' '.join(raw_topic.strip().split())
    if not topic:
        return 'Artificial Intelligence'

    return topic[:MAX_TOPIC_LENGTH]

def create_and_run_crew(topic):
    # This worker has no web/search tools, so agents must avoid claiming live research.
    researcher = Agent(
        role='Source-Aware Research Analyst',
        goal=f'Provide a cautious, clearly scoped analysis of {topic} without inventing current facts.',
        backstory=(
            "You are careful about uncertainty. You do not fabricate sources, citations, dates, "
            "benchmarks, or cutting-edge claims when no retrieval tools are available."
        ),
        verbose=True,
        allow_delegation=False
    )

    writer = Agent(
        role='Grounded Technical Writer',
        goal=f'Summarize the analysis of {topic} while preserving uncertainty and assumptions.',
        backstory=(
            "You write useful technical summaries, but you label assumptions and unknowns instead "
            "of presenting them as verified facts."
        ),
        verbose=True,
        allow_delegation=False
    )

    task1 = Task(
        description=(
            f'Analyze {topic} using only general knowledge available to the model. '
            'Do not claim live research, recent developments, citations, statistics, or named sources. '
            'Clearly separate supported general principles, assumptions, and unknowns.'
        ),
        expected_output='A bullet-point report with sections: General principles, Assumptions, Unknowns, and Follow-up research needed.',
        agent=researcher
    )

    task2 = Task(
        description=(
            'Using the prior analysis, develop a concise technical summary. '
            'Keep uncertainty labels intact and do not add unsupported claims.'
        ),
        expected_output='A 3-paragraph summary that labels assumptions and avoids unverifiable claims.',
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
    job_id = None
    try:
        # Block until a job is pushed to the 'crewai_queue' (timeout 0 = block forever)
        # bzpopmin or similar can be used for sorted sets, but we used lpush, so we use brpop
        queue, message = r.brpop('crewai_queue')
        
        job_data = json.loads(message.decode('utf-8'))
        job_id = job_data['id']
        payload = job_data['payload']
        topic = normalize_topic(payload.get('topic', 'Artificial Intelligence'))
        
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
        r.set(f"crewai_job:{job_id}", json.dumps(completed_job))
        
        print(f"🎉 Job {job_id} completed and saved to Redis.")
        
    except Exception as e:
        print(f"❌ Error processing job: {e}")
        if job_id:
            failed_job = {
                'id': job_id,
                'status': 'failed',
                'error': str(e)
            }
            r.set(f"crewai_job:{job_id}", json.dumps(failed_job))
