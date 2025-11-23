import anthropic
import os
from dotenv import load_dotenv
from sqlalchemy import func
from src.database import SessionLocal, SuccessfulPattern

load_dotenv()

class AIGenerator:
    def __init__(self):
        self.client = anthropic.Anthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY"),
        )
        self.model = "claude-3-5-sonnet-latest" 

    def _get_relevant_examples(self, subreddit: str, limit: int = 3) -> str:
        """
        Retrieves successful comment patterns from the DB.
        For now, we just match by subreddit and high score (Basic RAG).
        In future, we could use vector embeddings for semantic search.
        """
        db = SessionLocal()
        try:
            # Get random high-scoring examples from the same subreddit
            examples = db.query(SuccessfulPattern)\
                .filter(SuccessfulPattern.subreddit == subreddit)\
                .order_by(func.random())\
                .limit(limit)\
                .all()
            
            if not examples:
                # Fallback to any high scoring ones if no specific subreddit match
                examples = db.query(SuccessfulPattern)\
                    .order_by(SuccessfulPattern.score.desc())\
                    .limit(limit)\
                    .all()

            if not examples:
                return "No historical data available."

            formatted = "\n".join([f"- \"{e.pattern_text}\" (Score: {e.score})" for e in examples])
            return formatted
        finally:
            db.close()

    def generate_comment(self, post_title: str, post_body: str, subreddit: str) -> str:
        """
        Generates a comment using Claude, conditioned on successful past examples.
        """
        examples = self._get_relevant_examples(subreddit)
        
        prompt = f"""
You are a helpful, witty, and engaging Reddit user. 
Your goal is to write a comment that adds value to the conversation and fits the community vibe.

Here are some examples of successful high-karma comments from r/{subreddit} or similar places:
{examples}

Now, write a comment for the following post:
Title: {post_title}
Body: {post_body}
Subreddit: r/{subreddit}

Requirements:
- Keep it concise and natural.
- Do not sound like a bot.
- Be relevant to the specific topic.
- If it's a question, answer it or provide a unique perspective.
- If it's a funny post, be witty.

Reply ONLY with the comment text. Do not include quotes or "Here is the comment:".
"""
        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=300,
                temperature=0.7,
                system="You are an expert Reddit user known for high-quality contributions.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return message.content[0].text.strip()
        except Exception as e:
            print(f"Error generating comment: {e}")
            return "Interesting point! Thanks for sharing." # Fallback

