import telegram
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, CallbackQueryHandler, MessageHandler, filters
import os
from dotenv import load_dotenv
import asyncio
import time

load_dotenv()

class TelegramBotHandler:
    def __init__(self):
        self.token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID")
        self.app = ApplicationBuilder().token(self.token).build()
        self.loop = asyncio.new_event_loop()
        
        # State to hold the current approval status
        # 'pending', 'approved', 'rejected', 'edited: <text>'
        self.approval_status = {} 

    async def send_approval_request(self, post_title, post_url, proposed_comment, post_id):
        """
        Sends a message to the user with the proposed comment and buttons.
        """
        bot = self.app.bot
        
        message_text = (
            f"📢 *New Reddit Post*\n"
            f"**Title:** {post_title}\n"
            f"🔗 [Link]({post_url})\n\n"
            f"🤖 **Proposed Comment:**\n"
            f"`{proposed_comment}`\n\n"
            f"Reply 'yes' to approve, 'skip' to reject, or type a new comment."
        )
        
        # We can use InlineKeyboard for better UX, but for the "wait for reply" logic,
        # simple text replies are easiest to poll in a script without a webhook server.
        # However, let's add buttons for quick actions.
        keyboard = [
            [
                InlineKeyboardButton("✅ Approve", callback_data=f"approve:{post_id}"),
                InlineKeyboardButton("❌ Skip", callback_data=f"skip:{post_id}"),
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        try:
            await bot.send_message(
                chat_id=self.chat_id, 
                text=message_text, 
                parse_mode='Markdown', 
                reply_markup=reply_markup
            )
            return True
        except Exception as e:
            print(f"Error sending Telegram message: {e}")
            return False

    async def wait_for_approval(self, post_id: str, timeout=300) -> dict:
        """
        Polls for updates to check for user response.
        Returns: {'action': 'approve'|'reject'|'edit', 'content': str}
        """
        bot = self.app.bot
        offset = None
        start_time = time.time()

        print(f"Waiting for approval on Telegram for {post_id}...")

        while (time.time() - start_time) < timeout:
            try:
                updates = await bot.get_updates(offset=offset, timeout=10)
                for u in updates:
                    offset = u.update_id + 1
                    
                    # Check for Callback Query (Buttons)
                    if u.callback_query:
                        data = u.callback_query.data
                        if ":" in data:
                            action, pid = data.split(":", 1)
                            if pid == post_id:
                                await u.callback_query.answer()
                                await bot.send_message(chat_id=self.chat_id, text=f"Action received: {action}")
                                return {'action': 'approve' if action == 'approve' else 'reject', 'content': None}
                    
                    # Check for Text Message (Reply/Edit)
                    if u.message and str(u.message.chat.id) == str(self.chat_id):
                        text = u.message.text.strip()
                        
                        if text.lower() == 'yes':
                            return {'action': 'approve', 'content': None}
                        elif text.lower() in ['skip', 'no']:
                            return {'action': 'reject', 'content': None}
                        else:
                            # Treat as an edit
                            return {'action': 'edit', 'content': text}
                
                await asyncio.sleep(1)
            except Exception as e:
                print(f"Polling error: {e}")
                await asyncio.sleep(5)

        return {'action': 'timeout', 'content': None}

    # Synchronous wrapper for calling from main loop
    def request_approval_sync(self, post_title, post_url, proposed_comment, post_id):
        return self.loop.run_until_complete(
            self.send_approval_request(post_title, post_url, proposed_comment, post_id)
        )

    def wait_for_approval_sync(self, post_id):
        return self.loop.run_until_complete(
            self.wait_for_approval(post_id)
        )

