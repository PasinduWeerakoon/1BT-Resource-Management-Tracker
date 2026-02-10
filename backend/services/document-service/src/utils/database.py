"""
Database connection utility for Python Lambda functions
"""

import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

_connection = None
_cached_credentials = None

def get_credentials_from_secrets_manager():
    """Fetch database credentials from AWS Secrets Manager"""
    global _cached_credentials
    
    if _cached_credentials:
        return _cached_credentials
    
    secret_arn = os.environ.get('DB_SECRET_ARN')
    if not secret_arn:
        raise ValueError("DB_SECRET_ARN environment variable is not set")
    
    try:
        # Create a Secrets Manager client
        client = boto3.client('secretsmanager', region_name=os.environ.get('AWS_REGION', 'ap-southeast-1'))
        
        # Retrieve the secret value
        response = client.get_secret_value(SecretId=secret_arn)
        secret = json.loads(response['SecretString'])
        
        _cached_credentials = {
            'host': secret.get('host') or os.environ.get('DB_HOST'),
            'port': secret.get('port', 5432),
            'database': secret.get('dbname') or os.environ.get('DB_NAME'),
            'user': secret.get('username'),
            'password': secret.get('password')
        }
        
        logger.info("Database credentials retrieved from Secrets Manager")
        return _cached_credentials
        
    except ClientError as e:
        logger.error(f"Failed to retrieve credentials from Secrets Manager: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error retrieving credentials: {str(e)}")
        raise

def get_connection():
    """Get or create database connection"""
    global _connection
    
    if _connection is None or _connection.closed:
        # Try Secrets Manager first
        if os.environ.get('DB_SECRET_ARN'):
            credentials = get_credentials_from_secrets_manager()
            _connection = psycopg2.connect(
                host=credentials['host'],
                port=credentials['port'],
                database=credentials['database'],
                user=credentials['user'],
                password=credentials['password'],
                cursor_factory=RealDictCursor
            )
        # Fallback to environment variables (for local development)
        elif os.environ.get('DB_PASSWORD'):
            logger.warning("Using direct database credentials from environment - not recommended for production")
            _connection = psycopg2.connect(
                host=os.environ.get('DB_HOST'),
                port=os.environ.get('DB_PORT', '5432'),
                database=os.environ.get('DB_NAME'),
                user=os.environ.get('DB_USER'),
                password=os.environ.get('DB_PASSWORD'),
                cursor_factory=RealDictCursor
            )
        else:
            raise ValueError("No database credentials configured. Set DB_SECRET_ARN or DB_USER/DB_PASSWORD.")
        
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
