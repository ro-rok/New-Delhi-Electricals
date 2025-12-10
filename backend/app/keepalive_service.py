"""
Keep-alive service for Render deployment.
Runs as a background task to ping the backend every 14 minutes.
"""

import asyncio
import aiohttp
import logging
from datetime import datetime
import os

logger = logging.getLogger(__name__)

class KeepAliveService:
    def __init__(self):
        self.running = False
        self.task = None
        # Use environment variable or construct from Render's PORT
        port = os.getenv('PORT', '8000')
        self.backend_url = os.getenv('RENDER_EXTERNAL_URL', f'http://localhost:{port}')
        self.ping_interval = int(os.getenv('KEEPALIVE_INTERVAL', '840'))  # 14 minutes default
        
    async def ping_self(self):
        """Ping our own keep-alive endpoint"""
        try:
            keepalive_url = f"{self.backend_url}/api/keepalive"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(keepalive_url, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        # NOTE: Avoid emojis here because Windows cp1252 console encoding
                        # can raise UnicodeEncodeError when logging them.
                        logger.info(f"Self-ping successful: {data.get('message', 'OK')}")
                        return True
                    else:
                        logger.warning(f"Self-ping returned status {response.status}")
                        return False
                        
        except asyncio.TimeoutError:
            logger.warning("Self-ping timed out")
            return False
        except Exception as e:
            logger.warning(f"Self-ping failed: {str(e)}")
            return False
    
    async def keep_alive_loop(self):
        """Main keep-alive loop"""
        # Avoid emojis in logs to prevent UnicodeEncodeError on some Windows consoles
        logger.info("Starting keep-alive service")
        logger.info(f"Backend URL: {self.backend_url}")
        logger.info(f"Ping interval: {self.ping_interval} seconds ({self.ping_interval/60:.1f} minutes)")
        
        # Wait 2 minutes before first ping to let the app fully start
        await asyncio.sleep(120)
        
        while self.running:
            try:
                await self.ping_self()
                await asyncio.sleep(self.ping_interval)
            except asyncio.CancelledError:
                logger.info("Keep-alive service cancelled")
                break
            except Exception as e:
                logger.error(f"Error in keep-alive loop: {str(e)}")
                # Wait 1 minute before retrying on error
                await asyncio.sleep(60)
        
        logger.info("Keep-alive service stopped")
    
    def start(self):
        """Start the keep-alive service"""
        if not self.running:
            self.running = True
            self.task = asyncio.create_task(self.keep_alive_loop())
            logger.info("Keep-alive service started")
    
    async def stop(self):
        """Stop the keep-alive service"""
        if self.running:
            self.running = False
            if self.task:
                self.task.cancel()
                try:
                    await self.task
                except asyncio.CancelledError:
                    pass
            logger.info("Keep-alive service stopped")

# Global instance
keepalive_service = KeepAliveService()