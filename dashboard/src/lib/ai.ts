/**
 * AI Comment Generation for the Dashboard
 * 
 * Uses Google Gemini API directly from the browser.
 * API key is loaded from root .env file during build (via vite.config.ts).
 * 
 * Uses the same GEMINI_API_KEY as the Python bot.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

interface RedditPost {
  title: string
  subreddit: string
  selftext: string
  score: number
  num_comments: number
}

const SYSTEM_PROMPT = `You are a casual Reddit user writing a comment. IMPORTANT RULES:

1. DIRECTLY respond to the post's question or topic - don't be generic
2. Sound like a real person chatting, not an AI
3. Use lowercase and casual language
4. Be 1-3 sentences, conversational
5. Share a personal opinion, experience, or take on the SPECIFIC topic
6. Use natural filler words sparingly: "honestly", "tbh", "ngl", "lol"

CRITICAL - Your comment MUST:
- Actually answer/address what the post is asking about
- Be specific to the topic, not a generic response
- Feel like you actually read and understood the post

DON'T:
- Give generic responses that could fit any post
- Be formal or use bullet points
- Start with "Great question!" or "That's interesting!"
- Sound like customer service or AI
- Be preachy or give lectures
- Use phrases like "As someone who..." at the start

EXAMPLES:
Post: "Why do programmers make so much?"
Good: "their work scales - one person can write code that millions use. plus theres way more demand than supply rn"
Bad: "honestly thats a great question, ive wondered this too"

Post: "What skill took you forever to learn?"
Good: "parallel parking lol. took me like 2 years of driving before i could do it without having a panic attack"
Bad: "there are many skills that take time to learn, its different for everyone"

Post: "ELI5: Why does time go faster as you age?"
Good: "each year is a smaller % of your total life. when youre 5, a year is 20% of everything youve known. at 50 its just 2%"
Bad: "time perception is really interesting and varies from person to person"`

export async function generateComment(post: RedditPost): Promise<string> {
  if (!GEMINI_API_KEY) {
    // Return demo comment if no API key
    return generateDemoComment(post)
  }

  const userPrompt = `Write a Reddit comment that DIRECTLY responds to this post:

SUBREDDIT: r/${post.subreddit}
POST TITLE: ${post.title}
${post.selftext ? `POST CONTENT: ${post.selftext.slice(0, 800)}` : ''}

Your comment MUST specifically address "${post.title}" - don't give a generic response.
Write 1-3 casual sentences that show you understood the post.`

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: userPrompt }]
        }],
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 256,
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Gemini API error:', error)
      throw new Error('Failed to generate comment')
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('Empty response from Gemini')
    }

    return text.trim()
  } catch (error) {
    console.error('Error generating comment:', error)
    return generateDemoComment(post)
  }
}

// When no API key is configured, return a helpful message
function generateDemoComment(_post: RedditPost): string {
  return `⚠️ No API key configured. Add GEMINI_API_KEY to your .env file for real AI-generated comments.

Example comment structure:
- Start lowercase, be casual
- Address the specific topic
- 1-3 sentences max
- Sound like a real person`
}

export function isAIConfigured(): boolean {
  return !!GEMINI_API_KEY
}

