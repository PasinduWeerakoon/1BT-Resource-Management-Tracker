"""
Database connection utility for Python Lambda functions.

Uses pg8000 (pure Python, no libpq / no native .so) so imports succeed on AWS Lambda.
"""

import json
import logging
import os

import boto3
import pg8000
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

_connection = None
_cached_credentials = None


def get_credentials_from_secrets_manager():
    """Fetch database credentials from AWS Secrets Manager"""
    global _cached_credentials

    if _cached_credentials:
        return _cached_credentials

    secret_arn = os.environ.get("DB_SECRET_ARN")
    if not secret_arn:
        raise ValueError("DB_SECRET_ARN environment variable is not set")

    try:
        client = boto3.client(
            "secretsmanager",
            region_name=os.environ.get("AWS_REGION", "ap-southeast-1"),
        )
        response = client.get_secret_value(SecretId=secret_arn)
        secret = json.loads(response["SecretString"])

        _cached_credentials = {
            "host": secret.get("host") or os.environ.get("DB_HOST"),
            "port": secret.get("port", 5432),
            "database": secret.get("dbname") or os.environ.get("DB_NAME"),
            "user": secret.get("username"),
            "password": secret.get("password"),
        }

        logger.info("Database credentials retrieved from Secrets Manager")
        return _cached_credentials

    except ClientError as e:
        logger.error(f"Failed to retrieve credentials from Secrets Manager: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error retrieving credentials: {str(e)}")
        raise


def _open_connection(host, port, database, user, password):
    return pg8000.connect(
        host=host,
        port=int(port) if port is not None else 5432,
        database=database,
        user=user,
        password=password,
    )


def get_connection():
    """Get or create database connection"""
    global _connection

    if _connection is None:
        if os.environ.get("DB_SECRET_ARN"):
            credentials = get_credentials_from_secrets_manager()
            _connection = _open_connection(
                credentials["host"],
                credentials["port"],
                credentials["database"],
                credentials["user"],
                credentials["password"],
            )
        elif os.environ.get("DB_PASSWORD"):
            logger.warning(
                "Using direct database credentials from environment - not recommended for production"
            )
            _connection = _open_connection(
                os.environ.get("DB_HOST"),
                os.environ.get("DB_PORT", "5432"),
                os.environ.get("DB_NAME"),
                os.environ.get("DB_USER"),
                os.environ.get("DB_PASSWORD"),
            )
        else:
            raise ValueError(
                "No database credentials configured. Set DB_SECRET_ARN or DB_USER/DB_PASSWORD."
            )

        _connection.autocommit = True
        logger.info("Database connection established")

    return _connection


def query(sql, params=None):
    """Execute a query and return a list of dict rows (same shape as before)."""
    conn = get_connection()
    args = tuple(params) if params is not None else ()
    cursor = conn.cursor()
    try:
        cursor.execute(sql, args)
        if not cursor.description:
            return None
        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    finally:
        cursor.close()


def close_connection():
    """Close the database connection"""
    global _connection
    if _connection is not None:
        try:
            _connection.close()
        except Exception:
            pass
        _connection = None
        logger.info("Database connection closed")
