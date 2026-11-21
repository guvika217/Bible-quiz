"""Structured logging configuration."""

import logging
import sys


def setup_logging(debug: bool = False) -> None:
    """Configure standard application logging."""
    log_level = logging.DEBUG if debug else logging.INFO
    log_format = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"

    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )


logger = logging.getLogger("bible_quiz_api")
