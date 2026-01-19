"""
PDF Generation Handler
Generates PDF reports for allocations and summaries
"""

import json
import logging
import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

from ..utils.database import query, close_connection
from ..utils.response import success, error, file_response

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def generate_report(event, context):
    """
    Generate a PDF report from provided data
    POST /documents/pdf/generate
    """
    try:
        body = json.loads(event.get('body', '{}'))
        
        title = body.get('title', 'Report')
        headers = body.get('headers', [])
        data = body.get('data', [])
        
        if not headers or not data:
            return error('Headers and data are required', 400)
        
        # Create PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30
        )
        
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=20,
            alignment=1  # Center
        )
        elements.append(Paragraph(title, title_style))
        
        # Timestamp
        timestamp_style = ParagraphStyle(
            'Timestamp',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.gray,
            spaceAfter=20
        )
        elements.append(Paragraph(
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            timestamp_style
        ))
        
        elements.append(Spacer(1, 0.25 * inch))
        
        # Create table data
        table_data = [headers] + data
        
        # Create table
        table = Table(table_data, repeatRows=1)
        
        # Style the table
        style = TableStyle([
            # Header styling
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            
            # Data styling
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            
            # Alternating row colors
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
        ])
        
        table.setStyle(style)
        elements.append(table)
        
        # Build PDF
        doc.build(elements)
        
        buffer.seek(0)
        
        filename = f"{title.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return file_response(
            buffer.getvalue(),
            filename,
            'application/pdf'
        )
        
    except Exception as e:
        logger.error(f"Failed to generate PDF report: {str(e)}")
        return error(f"Failed to generate report: {str(e)}")
    finally:
        close_connection()
