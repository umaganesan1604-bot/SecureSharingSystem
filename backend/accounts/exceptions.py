"""
Custom REST Framework exception handler for SecureShare.
Ensures consistent JSON errors without exposing internal stack traces.
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        # Standardize error response structure
        error_msg = None
        if isinstance(response.data, dict):
            if 'detail' in response.data:
                error_msg = str(response.data['detail'])
            elif 'error' in response.data:
                error_msg = str(response.data['error'])
            else:
                # Format first validation error message
                first_key = next(iter(response.data))
                val = response.data[first_key]
                if isinstance(val, list) and len(val) > 0:
                    error_msg = f"{first_key}: {val[0]}"
                else:
                    error_msg = f"{first_key}: {val}"
        elif isinstance(response.data, list) and len(response.data) > 0:
            error_msg = str(response.data[0])
        else:
            error_msg = str(response.data)

        response.data = {
            'error': error_msg or 'An unexpected error occurred.',
            'status_code': response.status_code
        }
        return response

    # Unhandled 500 error: log internally but don't leak internal traces to client
    logger.error(f"Unhandled exception in request: {exc}", exc_info=True)
    return Response(
        {
            'error': 'An internal server error occurred. Please try again later.',
            'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
