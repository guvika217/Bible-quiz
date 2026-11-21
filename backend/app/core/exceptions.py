"""Centralized custom exceptions."""

from typing import Any


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Any | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details


class ResourceNotFoundException(AppException):
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            message=f"{resource} with identifier '{identifier}' was not found.",
            status_code=404,
        )


class BadRequestException(AppException):
    def __init__(self, message: str, details: Any | None = None):
        super().__init__(message=message, status_code=400, details=details)
