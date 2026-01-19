"""
Database connection utility for Python Lambda functions
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

logger = logging.getLogger(__name__)

_connection = None

def get_connection():
    """Get or create database connection"""
    global _connection
    
    if _connection is None or _connection.closed:
        _connection = psycopg2.connect(
            host=os.environ.get('DB_HOST'),
            port=os.environ.get('DB_PORT', '5432'),
            database=os.environ.get('DB_NAME'),
            user=os.environ.get('DB_USER'),
            password=os.environ.get('DB_PASSWORD'),
            cursor_factory=RealDictCursor
        )
        _connection.autocommit = True
        logger.info("Database connection established")
    
    return _connection


def query(sql, params=None):
    """Execute a query and return results"""
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute(sql, params or [])
        if cursor.description:
            return cursor.fetchall()
        return None


def close_connection():
    """Close the database connection"""
    global _connection
    if _connection and not _connection.closed:
        _connection.close()
        _connection = None
        logger.info("Database connection closed")
