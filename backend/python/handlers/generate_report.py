import json
import os
import boto3
import psycopg2
import pandas as pd
from datetime import datetime
import uuid

# Initialize S3 client
s3 = boto3.client('s3')

def get_db_connection():
    return psycopg2.connect(
        host=os.environ['DATABASE_HOST'],
        database=os.environ['DATABASE_NAME'],
        user=os.environ['DATABASE_USER'],
        password=os.environ['DATABASE_PASSWORD'],
        port=os.environ['DATABASE_PORT']
    )

def handler(event, context):
    """
    Generate Excel report and return presigned URL
    """
    print("Event:", json.dumps(event))
    
    try:
        # Parse query parameters
        params = event.get('queryStringParameters', {}) or {}
        report_type = params.get('type')
        
        if not report_type:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing report type'})
            }

        conn = get_db_connection()
        
        # Define query based on report type
        if report_type == 'allocations':
            query = """
                SELECT 
                    p.project_name, c.client_name, r.name as resource_name, 
                    a.allocation_percentage, a.start_date, a.end_date, a.status
                FROM allocations a
                JOIN projects p ON a.project_id = p.id
                JOIN resources r ON a.resource_id = r.id
                JOIN clients c ON p.client_id = c.id
                WHERE a.deleted_at IS NULL
            """
            filename = f"Allocations_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            
        elif report_type == 'bench':
            query = """
                 WITH resource_allocations AS (
                    SELECT resource_id, SUM(allocation_percentage) as total_allocation
                    FROM allocations
                    WHERE status = 'ACTIVE' AND (end_date IS NULL OR end_date >= CURRENT_DATE)
                    AND deleted_at IS NULL
                    GROUP BY resource_id
                )
                SELECT r.name, r.email, t.name as track, 
                       (100 - COALESCE(ra.total_allocation, 0)) as available_capacity
                FROM resources r
                LEFT JOIN resource_allocations ra ON r.id = ra.resource_id
                LEFT JOIN tracks t ON r.track_id = t.id
                WHERE r.status = 'ACTIVE' 
                AND (ra.total_allocation IS NULL OR ra.total_allocation < 100)
            """
            filename = f"Bench_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            
        else:
             return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid report type'})
            }

        # Execute query and create DataFrame
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        # Save to /tmp
        tmp_path = f"/tmp/{filename}"
        df.to_excel(tmp_path, index=False)
        
        # Upload to S3
        bucket_name = os.environ['DOCUMENTS_BUCKET']
        s3_key = f"reports/{filename}"
        s3.upload_file(tmp_path, bucket_name, s3_key)
        
        # Generate presigned URL
        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': s3_key},
            ExpiresIn=300 # 5 minutes
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True,
            },
            'body': json.dumps({'url': url, 'filename': filename})
        }
        
    except Exception as e:
        print("Error:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
