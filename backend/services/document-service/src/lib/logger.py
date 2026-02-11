"""
Logger utility for Document Service

Mirrors the Node.js shared layer logger functionality.
"""

import logging
import json
import os
from datetime import datetime


def get_logger(name='document-service'):
    """
    Get a configured logger instance
    
    Args:
        name: Logger name (default: 'document-service')
        
    Returns:
        logging.Logger: Configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Only configure if not already configured
    if not logger.handlers:
        handler = logging.StreamHandler()
        
        # Use JSON formatting for CloudWatch
        formatter = JsonFormatter()
        handler.setFormatter(formatter)
        
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        
        # Don't propagate to root logger
        logger.propagate = False
    
    return logger


class JsonFormatter(logging.Formatter):
    """
    JSON formatter for structured logging in CloudWatch
    """
    
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'message': record.getMessage(),
            'logger': record.name,
        }
        
        # Add extra fields if present
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        # Add any extra attributes
        if hasattr(record, 'extra'):
            log_data.update(record.extra)
        
        return json.dumps(log_data)


# Create default logger instance
logger = get_logger()
