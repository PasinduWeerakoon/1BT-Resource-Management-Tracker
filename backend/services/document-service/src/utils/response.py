"""
Response utilities for Python Lambda functions
"""

import json
from typing import Any, Optional


def success(data: Any, status_code: int = 200) -> dict:
    """Return a successful response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True
        },
        'body': json.dumps({
            'success': True,
            'data': data
        })
    }


def error(message: str, status_code: int = 500, details: Optional[Any] = None) -> dict:
    """Return an error response"""
    body = {
        'success': False,
        'error': message
    }
    if details:
        body['details'] = details
    
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True
        },
        'body': json.dumps(body)
    }


def file_response(content: bytes, filename: str, content_type: str) -> dict:
    """Return a file download response"""
    import base64
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': content_type,
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True
        },
        'body': base64.b64encode(content).decode('utf-8'),
        'isBase64Encoded': True
    }
