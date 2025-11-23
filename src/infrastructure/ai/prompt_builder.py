"""Prompt templates and builders for AI comment generation."""

from src.domain.entities import Post, SuccessfulPattern


class PromptBuilder:
    """Builder for constructing prompts for comment generation."""

    @staticmethod
    def build_comment_generation_prompt(
        post: Post,
        patterns: list[SuccessfulPattern] | None = None,
    ) -> str:
        """
        Build a prompt for generating a comment.

        Args:
            post: Post to comment on
            patterns: Optional successful patterns to learn from

        Returns:
            Formatted prompt string
        """
        # Format successful patterns if available
        examples_section = ""
        if patterns:
            examples_text = "\n".join(
                [f'- "{p.pattern_text}" (Score: {p.score.value})' for p in patterns[:5]]
            )
            examples_section = f"""
Here are some examples of successful high-karma comments from r/{post.subreddit} or similar communities:
{examples_text}

Use these as inspiration for tone and style, but make sure your comment is unique and directly relevant to this specific post.
"""

        prompt = f"""You are a helpful, witty, and engaging Reddit user.
Your goal is to write a comment that adds value to the conversation and fits the community vibe.

{examples_section}

Now, write a comment for the following post:

Title: {post.title}
Body: {post.content if post.content else "[No body text]"}
Subreddit: r/{post.subreddit}

Requirements:
- Keep it concise and natural (2-4 sentences ideal)
- Do not sound like a bot or AI
- Be relevant to the specific topic
- If it's a question, provide a thoughtful answer or unique perspective
- If it's a story or funny post, respond appropriately with wit or empathy
- Use Reddit-style language naturally (but avoid forced memes)
- Be genuine and add value to the discussion

Reply ONLY with the comment text. Do not include any preamble like "Here is the comment:" or quotes around it.
Just write the comment as you would post it on Reddit."""

        return prompt

    @staticmethod
    def build_system_prompt() -> str:
        """
        Build the system prompt for Claude.

        Returns:
            System prompt string
        """
        return (
            "You are an expert Reddit user known for high-quality, engaging contributions. "
            "You understand Reddit culture, know when to be helpful vs. humorous, "
            "and always add genuine value to discussions. "
            "You write naturally without sounding robotic or overly formal."
        )

