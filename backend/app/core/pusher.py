import logging
import pusher
from app.config import settings

logger = logging.getLogger(__name__)

_client = None
_init_attempted = False


def get_pusher_client():
    """
    Lazily creates the Pusher client on first use, instead of at
    import time. Pusher's SDK validates credentials immediately in
    its constructor and raises if they're missing/invalid - if that
    happened at import time, a blank/wrong Pusher key in .env would
    crash the ENTIRE backend on startup (courses, attendance, auth,
    everything), not just the chat feature. Lazy init means only
    chat endpoints fail (with a clear error) if Pusher isn't
    configured correctly; the rest of the app stays up.
    """
    global _client, _init_attempted
    if _client is not None:
        return _client
    if _init_attempted:
        raise RuntimeError(
            "Pusher client failed to initialize earlier - check "
            "PUSHER_APP_ID/PUSHER_KEY/PUSHER_SECRET/PUSHER_CLUSTER in .env"
        )

    _init_attempted = True
    try:
        _client = pusher.Pusher(
            app_id=settings.pusher_app_id,
            key=settings.pusher_key,
            secret=settings.pusher_secret,
            cluster=settings.pusher_cluster,
            ssl=True
        )
        return _client
    except Exception as exc:
        logger.error(f"Pusher client initialization failed: {exc}")
        raise RuntimeError(
            "Pusher is not configured correctly - check "
            "PUSHER_APP_ID/PUSHER_KEY/PUSHER_SECRET/PUSHER_CLUSTER in .env"
        ) from exc