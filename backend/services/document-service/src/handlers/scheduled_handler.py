"""
Scheduled Reports Handler
Generates and sends scheduled reports via email
"""

import json
import logging
import os
from datetime import datetime

from ..utils.database import query, close_connection
from ..utils.response import success, error

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def weekly_report(event, context):
    """
    Generate and distribute weekly summary report
    Triggered by CloudWatch Events every Monday at 8 AM UTC
    """
    try:
        logger.info("Starting weekly report generation")
        
        # Get summary statistics
        stats = get_weekly_stats()
        
        # In a real implementation, you would:
        # 1. Generate Excel/PDF report
        # 2. Upload to S3
        # 3. Send email via SES with report attached or link
        
        logger.info(f"Weekly report generated: {json.dumps(stats)}")
        
        return success({
            'message': 'Weekly report generated successfully',
            'stats': stats,
            'generatedAt': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to generate weekly report: {str(e)}")
        return error(f"Failed to generate weekly report: {str(e)}")
    finally:
        close_connection()


def get_weekly_stats():
    """Get statistics for the weekly report"""
    
    # Resource count by status
    resource_stats = query("""
        SELECT status, COUNT(*) as count
        FROM resources
        WHERE deleted_at IS NULL
        GROUP BY status
    """)
    
    # Bench resources
    bench_count = query("""
        WITH resource_allocations AS (
            SELECT resource_id, SUM(allocation_percentage) as total
            FROM allocations
            WHERE status = 'ACTIVE' AND (end_date IS NULL OR end_date >= CURRENT_DATE)
            GROUP BY resource_id
        )
        SELECT COUNT(*) as count
        FROM resources r
        LEFT JOIN resource_allocations ra ON r.id = ra.resource_id
        WHERE r.status = 'ACTIVE' AND r.deleted_at IS NULL
        AND (ra.total IS NULL OR ra.total < 100)
    """)
    
    # New allocations this week
    new_allocations = query("""
        SELECT COUNT(*) as count
        FROM allocations
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    """)
    
    # Active projects
    active_projects = query("""
        SELECT COUNT(*) as count
        FROM projects
        WHERE status = 'ACTIVE' AND deleted_at IS NULL
    """)
    
    return {
        'resourcesByStatus': {row['status']: row['count'] for row in resource_stats} if resource_stats else {},
        'benchCount': bench_count[0]['count'] if bench_count else 0,
        'newAllocationsThisWeek': new_allocations[0]['count'] if new_allocations else 0,
        'activeProjects': active_projects[0]['count'] if active_projects else 0,
        'reportPeriod': {
            'start': (datetime.now().replace(hour=0, minute=0, second=0) - 
                     __import__('datetime').timedelta(days=7)).isoformat(),
            'end': datetime.now().isoformat()
        }
    }
