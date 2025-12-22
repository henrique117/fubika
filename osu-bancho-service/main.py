#!/usr/bin/env python3.11
from __future__ import annotations

import logging
import asyncio
import uvicorn

import app.logging
import app.settings
import app.utils
from app.state import services

app.logging.configure_logging()

async def async_main() -> int:
    app.utils.display_startup_dialog()

    asyncio.create_task(services.run_redis_listener())

    config = uvicorn.Config(
        "app.api.init_api:asgi_app",
        reload=app.settings.DEBUG,
        log_level=logging.WARNING,
        server_header=False,
        date_header=False,
        headers=[("bancho-version", app.settings.VERSION)],
        host=app.settings.APP_HOST,
        port=app.settings.APP_PORT,
    )
    
    server = uvicorn.Server(config)
    
    await server.serve()
    
    return 0

def main() -> int:
    return asyncio.run(async_main())

if __name__ == "__main__":
    exit(main())