"""
Excel Generation Handler
Generates Excel reports for allocations, bench, and custom reports
"""

import json
import logging
import io
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from ..utils.database import query, close_connection
from ..utils.response import success, error, file_response

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Styling constants
HEADER_FILL = PatternFill(start_color='1F4E79', end_color='1F4E79', fill_type='solid')
HEADER_FONT = Font(color='FFFFFF', bold=True, size=11)
BORDER = Border(
    left=Side(style='thin'),
    right=Side(style='thin'),
    top=Side(style='thin'),
    bottom=Side(style='thin')
)


def apply_header_style(cell):
    """Apply header styling to a cell"""
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = Alignment(horizontal='center', vertical='center')
    cell.border = BORDER


def apply_cell_style(cell):
    """Apply standard cell styling"""
    cell.border = BORDER
    cell.alignment = Alignment(vertical='center')


def auto_column_width(worksheet, min_width=10, max_width=50):
    """Auto-adjust column widths based on content"""
    for column in worksheet.columns:
        max_length = 0
        column_letter = get_column_letter(column[0].column)
        
        for cell in column:
            try:
                if cell.value:
                    max_length = max(max_length, len(str(cell.value)))
            except:
                pass
        
        adjusted_width = min(max(max_length + 2, min_width), max_width)
        worksheet.column_dimensions[column_letter].width = adjusted_width


def generate_report(event, context):
    """
    Generate a custom Excel report from provided data
    POST /documents/excel/generate
    """
    try:
        body = json.loads(event.get('body', '{}'))
        
        title = body.get('title', 'Report')
        headers = body.get('headers', [])
        data = body.get('data', [])
        
        if not headers or not data:
            return error('Headers and data are required', 400)
        
        # Create workbook
        wb = Workbook()
        ws = wb.active
        ws.title = title[:31]  # Excel sheet name limit
        
        # Add title row
        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(headers))
        title_cell = ws.cell(row=1, column=1, value=title)
        title_cell.font = Font(bold=True, size=14)
        title_cell.alignment = Alignment(horizontal='center')
        
        # Add generated timestamp
        ws.cell(row=2, column=1, value=f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Add headers (row 4)
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=4, column=col, value=header)
            apply_header_style(cell)
        
        # Add data
        for row_idx, row_data in enumerate(data, 5):
            for col_idx, value in enumerate(row_data, 1):
                cell = ws.cell(row=row_idx, column=col_idx, value=value)
                apply_cell_style(cell)
        
        auto_column_width(ws)
        
        # Save to bytes
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        filename = f"{title.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return file_response(
            output.getvalue(),
            filename,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        logger.error(f"Failed to generate Excel report: {str(e)}")
        return error(f"Failed to generate report: {str(e)}")
    finally:
        close_connection()


def generate_allocation_report(event, context):
    """
    Generate allocation report in Excel
    POST /documents/excel/allocations
    """
    try:
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
        
        # Query allocation data
        sql = """
            SELECT 
                p.project_name,
                c.client_name,
                r.name as resource_name,
                r.email,
                d.name as designation,
                t.name as track,
                a.allocation_percentage,
                a.start_date,
                a.end_date,
                a.status
            FROM allocations a
            JOIN projects p ON a.project_id = p.id
            JOIN resources r ON a.resource_id = r.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            WHERE a.status = 'ACTIVE'
            ORDER BY p.project_name, r.name
        """
        
        data = query(sql)
        
        # Create workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Allocation Report"
        
        # Title
        ws.merge_cells('A1:J1')
        title_cell = ws.cell(row=1, column=1, value="Resource Allocation Report")
        title_cell.font = Font(bold=True, size=16)
        title_cell.alignment = Alignment(horizontal='center')
        
        ws.cell(row=2, column=1, value=f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        ws.cell(row=2, column=5, value=f"Total Records: {len(data)}")
        
        # Headers
        headers = ['Project', 'Client', 'Resource', 'Email', 'Designation', 
                   'Track', 'Allocation %', 'Start Date', 'End Date', 'Status']
        
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=4, column=col, value=header)
            apply_header_style(cell)
        
        # Data
        for row_idx, row in enumerate(data, 5):
            cells = [
                row.get('project_name'),
                row.get('client_name', 'N/A'),
                row.get('resource_name'),
                row.get('email'),
                row.get('designation'),
                row.get('track'),
                row.get('allocation_percentage'),
                str(row.get('start_date', ''))[:10] if row.get('start_date') else '',
                str(row.get('end_date', ''))[:10] if row.get('end_date') else 'Ongoing',
                row.get('status')
            ]
            
            for col_idx, value in enumerate(cells, 1):
                cell = ws.cell(row=row_idx, column=col_idx, value=value)
                apply_cell_style(cell)
        
        auto_column_width(ws)
        
        # Save to bytes
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        filename = f"allocation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return file_response(
            output.getvalue(),
            filename,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        logger.error(f"Failed to generate allocation report: {str(e)}")
        return error(f"Failed to generate report: {str(e)}")
    finally:
        close_connection()


def generate_bench_report(event, context):
    """
    Generate bench report in Excel
    POST /documents/excel/bench
    """
    try:
        # Query bench data
        sql = """
            WITH resource_allocations AS (
                SELECT 
                    resource_id,
                    SUM(allocation_percentage) as total_allocation
                FROM allocations
                WHERE status = 'ACTIVE' 
                AND (end_date IS NULL OR end_date >= CURRENT_DATE)
                GROUP BY resource_id
            )
            SELECT 
                r.name,
                r.email,
                d.name as designation,
                t.name as track,
                COALESCE(ra.total_allocation, 0) as current_allocation,
                (100 - COALESCE(ra.total_allocation, 0)) as available_capacity,
                r.join_date,
                r.is_intern
            FROM resources r
            LEFT JOIN resource_allocations ra ON r.id = ra.resource_id
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            WHERE r.status = 'ACTIVE'
            AND (ra.total_allocation IS NULL OR ra.total_allocation < 100)
            AND r.deleted_at IS NULL
            ORDER BY available_capacity DESC
        """
        
        data = query(sql)
        
        # Create workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Bench Report"
        
        # Title
        ws.merge_cells('A1:H1')
        title_cell = ws.cell(row=1, column=1, value="Bench Report - Available Resources")
        title_cell.font = Font(bold=True, size=16)
        title_cell.alignment = Alignment(horizontal='center')
        
        ws.cell(row=2, column=1, value=f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        ws.cell(row=2, column=5, value=f"Resources on Bench: {len(data)}")
        
        # Headers
        headers = ['Name', 'Email', 'Designation', 'Track', 
                   'Current Allocation %', 'Available Capacity %', 'Join Date', 'Intern']
        
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=4, column=col, value=header)
            apply_header_style(cell)
        
        # Data
        for row_idx, row in enumerate(data, 5):
            cells = [
                row.get('name'),
                row.get('email'),
                row.get('designation'),
                row.get('track'),
                row.get('current_allocation', 0),
                row.get('available_capacity', 100),
                str(row.get('join_date', ''))[:10] if row.get('join_date') else '',
                'Yes' if row.get('is_intern') else 'No'
            ]
            
            for col_idx, value in enumerate(cells, 1):
                cell = ws.cell(row=row_idx, column=col_idx, value=value)
                apply_cell_style(cell)
                
                # Highlight fully available resources
                if col_idx == 6 and value == 100:
                    cell.fill = PatternFill(start_color='C6EFCE', end_color='C6EFCE', fill_type='solid')
        
        auto_column_width(ws)
        
        # Save to bytes
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        filename = f"bench_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return file_response(
            output.getvalue(),
            filename,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        logger.error(f"Failed to generate bench report: {str(e)}")
        return error(f"Failed to generate report: {str(e)}")
    finally:
        close_connection()
