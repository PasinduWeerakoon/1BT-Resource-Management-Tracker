"""
Documents Handler
Routes document generation requests to appropriate handlers
"""

from .excel_handler import (
    generate_report, 
    generate_allocation_report, 
    generate_bench_report, 
    generate_summary_report,
    generate_non_billing_report,
    generate_projects_report
)
from .pdf_handler import generate_report as generate_pdf_report


def generate_summary_excel(event, context):
    """Generate summary report Excel"""
    return generate_summary_report(event, context)


def generate_non_billing_excel(event, context):
    """Generate non-billing (critical shadows) report Excel"""
    return generate_non_billing_report(event, context)


def generate_projects_excel(event, context):
    """Generate projects report Excel"""
    return generate_projects_report(event, context)

# Excel handlers
def generate_excel(event, context):
    """Route Excel generation requests based on report type"""
    try:
        import json
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
        report_type = body.get('reportType', 'general')
        
        if report_type == 'summary':
            return generate_summary_report(event, context)
        elif report_type == 'bench':
            return generate_bench_report(event, context)
        elif report_type == 'allocation':
            return generate_allocation_report(event, context)
        else:
            return generate_report(event, context)
    except Exception as e:
        from ..utils.response import error
        return error(f"Failed to route Excel generation: {str(e)}")


def generate_pdf(event, context):
    """Generate PDF report"""
    return generate_pdf_report(event, context)


def get_document(event, context):
    """Get a generated document"""
    # TODO: Implement document retrieval from S3
    from ..utils.response import error
    return error("Not implemented", 501)


def list_documents(event, context):
    """List generated documents"""
    # TODO: Implement document listing from S3
    from ..utils.response import error
    return error("Not implemented", 501)


def delete_document(event, context):
    """Delete a generated document"""
    # TODO: Implement document deletion from S3
    from ..utils.response import error
    return error("Not implemented", 501)
