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


def generate_summary_report(event, context):
    """
    Generate summary report in Excel format matching the dashboard view
    POST /documents/excel/summary
    """
    try:
        report_date = datetime.now().strftime('%Y-%m-%d')
        
        # Get resource counts from dashboard_stats table (summary table)
        summary_query = """
            SELECT resource_counts
            FROM dashboard_stats
            WHERE stats_type = 'resource_counts'
            ORDER BY stats_date DESC
            LIMIT 1
        """
        
        summary_result = query(summary_query)
        resource_counts = {}
        
        if summary_result and len(summary_result) > 0:
            # resource_counts is stored as JSONB, psycopg2 with RealDictCursor returns it as dict
            resource_counts_data = summary_result[0].get('resource_counts')
            if resource_counts_data:
                if isinstance(resource_counts_data, dict):
                    resource_counts = resource_counts_data
                elif isinstance(resource_counts_data, str):
                    import json
                    resource_counts = json.loads(resource_counts_data)
        
        # Extract values from summary table
        billing_resource_count = float(resource_counts.get('billingResourceCount', 0) or 0)
        billable_resource_count = float(resource_counts.get('billableResourceCount', 0) or 0)
        bench_resource_count = float(resource_counts.get('benchResourceCount', 0) or 0)
        shadow_count = float(resource_counts.get('shadowCount', 0) or 0)
        intern_count = float(resource_counts.get('internsCount', 0) or 0)
        
        # Calculate billing utilization percentage
        billing_utilization_percent = 0
        if billable_resource_count > 0:
            billing_utilization_percent = round((billing_resource_count / billable_resource_count) * 100, 0)
        
        # Calculate Allocated Utilization % using custom formula:
        # 1. Sum of all allocation_percentage (excluding Bench project allocations)
        # 2. Divide by 100 to convert to FTE count
        # 3. Divide by total billable resource count
        allocated_utilization_percent = 0
        if billable_resource_count > 0:
            allocation_util_query = """
                WITH active_employees AS (
                    SELECT e.id
                    FROM employees e
                    WHERE e.status = 'Active'
                      AND e.deleted_at IS NULL
                ),
                employee_allocations AS (
                    SELECT 
                        a.employee_id,
                        SUM(a.allocation_percentage) as total_allocation
                    FROM allocations a
                    JOIN projects p ON a.project_id = p.id
                    WHERE a.is_active = true 
                      AND a.deleted_at IS NULL
                      AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                      AND (p.project_name IS NULL OR p.project_name <> 'Bench')
                    GROUP BY a.employee_id
                )
                SELECT 
                    COALESCE(SUM(COALESCE(ea.total_allocation, 0)), 0) as sum_allocation_non_bench
                FROM active_employees ae
                LEFT JOIN employee_allocations ea ON ae.id = ea.employee_id
            """
            
            allocation_util_result = query(allocation_util_query)
            if allocation_util_result and len(allocation_util_result) > 0:
                sum_allocation_non_bench = float(allocation_util_result[0].get('sum_allocation_non_bench', 0) or 0)
                # Convert total allocation percentage to FTE count
                fte_non_bench = sum_allocation_non_bench / 100.0
                if billable_resource_count > 0:
                    allocated_utilization_percent = round((fte_non_bench / billable_resource_count) * 100, 0)
        
        # Prepare billing stats row
        billing_row = {
            'billable_resource_count': billable_resource_count,
            'billing_resource_count': billing_resource_count,
            'billing_utilization_percent': billing_utilization_percent
        }
        
        # Prepare allocation stats row
        allocation_row = {
            'billing_resource_count': billing_resource_count,
            'critical_shadow_count': shadow_count,
            'allocated_utilization_percent': allocated_utilization_percent,
            'bench_resources': bench_resource_count,
            'intern_count': intern_count
        }
        
        # Query Bench Analysis (Name, Tier, Focused Area, Allocation)
        # Note: tier_id and track_id are stored on employees as INTEGER config IDs (not DB table references)
        # Also includes track information for track-wise summary calculation
        bench_analysis_query = """
            WITH bench_allocations AS (
                SELECT 
                    a.employee_id,
                    SUM(a.allocation_percentage) as bench_allocation_percentage,
                    STRING_AGG(DISTINCT p.project_name, ', ') as focused_areas
                FROM allocations a
                LEFT JOIN projects p ON a.project_id = p.id
                WHERE a.is_active = true 
                AND a.deleted_at IS NULL
                AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                AND (a.billing_status_id = 3 OR p.is_bench_project = true)
                GROUP BY a.employee_id
            ),
            total_allocations AS (
                SELECT 
                    employee_id,
                    SUM(allocation_percentage) as total_allocation
                FROM allocations
                WHERE is_active = true 
                AND deleted_at IS NULL
                AND (deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE)
                GROUP BY employee_id
            )
            SELECT 
                r.name,
                r.tier_id,
                COALESCE(ba.focused_areas, 'Bench') as focused_area,
                COALESCE(ta.total_allocation, 0) as total_allocation,
                COALESCE(ba.bench_allocation_percentage, 0) as bench_allocation,
                r.track_id
            FROM employees r
            INNER JOIN bench_allocations ba ON r.id = ba.employee_id
            LEFT JOIN total_allocations ta ON r.id = ta.employee_id
            WHERE r.status = 'Active'
            AND r.deleted_at IS NULL
            ORDER BY ba.bench_allocation_percentage DESC, r.name ASC
        """
        
        bench_analysis = query(bench_analysis_query)
        
        # Calculate Track Wise Summary from bench_analysis results
        # Since tracks are configurations (not a DB table), we group by track_id
        # Track names would need to be resolved from configs, but for now we'll use track_id
        track_summary_dict = {}
        for row in bench_analysis:
            track_id = row.get('track_id')
            # Use track_id as key since tracks are configs, not DB table
            track_key = f"Track {track_id}" if track_id else 'Unassigned'
            bench_allocation = float(row.get('bench_allocation', 0) or 0)
            
            if track_key not in track_summary_dict:
                track_summary_dict[track_key] = 0
            track_summary_dict[track_key] += bench_allocation
        
        # Convert to list format and divide by 100 to get count
        track_summary = []
        for track_name, total_bench_allocation in sorted(track_summary_dict.items()):
            bench_count = round(total_bench_allocation / 100.0, 2)
            track_summary.append({
                'track_name': track_name,
                'bench_count': bench_count
            })
        
        # Create workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Summary Report"
        
        current_row = 1
        
        # Title
        ws.merge_cells(f'A{current_row}:D{current_row}')
        title_cell = ws.cell(row=current_row, column=1, value="Resource Management Dashboard")
        title_cell.font = Font(bold=True, size=16)
        title_cell.alignment = Alignment(horizontal='center')
        current_row += 1
        
        # Date
        date_cell = ws.cell(row=current_row, column=1, value=f"Date: {report_date}")
        date_cell.font = Font(bold=True, size=12)
        current_row += 2
        
        # Note about exclusions
        note_cell = ws.cell(row=current_row, column=1, value="(Excluding Synergy, Interns, Shared Services)")
        note_cell.font = Font(italic=True, size=10)
        current_row += 2
        
        # Resource Billing Stats
        ws.cell(row=current_row, column=1, value="Resource Billing Stats").font = Font(bold=True, size=12)
        current_row += 1
        
        billing_headers = ['Metric', 'Value']
        for col, header in enumerate(billing_headers, 1):
            cell = ws.cell(row=current_row, column=col, value=header)
            apply_header_style(cell)
        current_row += 1
        
        billing_data = [
            ['Billable Resource Count', billing_row.get('billable_resource_count', 0)],
            ['Billing Resource Count', billing_row.get('billing_resource_count', 0)],
            ['Billing Utilization %', f"{billing_row.get('billing_utilization_percent', 0)}%"]
        ]
        
        for row_data in billing_data:
            for col_idx, value in enumerate(row_data, 1):
                cell = ws.cell(row=current_row, column=col_idx, value=value)
                apply_cell_style(cell)
                # Highlight percentage in red if needed
                if col_idx == 2 and isinstance(value, str) and '%' in value:
                    cell.font = Font(color='FF0000', bold=True)
            current_row += 1
        
        current_row += 1
        
        # Resource Allocation Stats
        ws.cell(row=current_row, column=1, value="Resource Allocation Stats").font = Font(bold=True, size=12)
        current_row += 1
        
        allocation_headers = ['Metric', 'Value']
        for col, header in enumerate(allocation_headers, 1):
            cell = ws.cell(row=current_row, column=col, value=header)
            apply_header_style(cell)
        current_row += 1
        
        allocation_data = [
            ['Billing Resource Count', allocation_row.get('billing_resource_count', 0)],
            ['Critical Shadow Count', allocation_row.get('critical_shadow_count', 0)],
            ['Allocated Utilization %', f"{allocation_row.get('allocated_utilization_percent', 0)}%"],
            ['Bench Resources', allocation_row.get('bench_resources', 0)],
            ['Intern Count', allocation_row.get('intern_count', 0)]
        ]
        
        for row_data in allocation_data:
            for col_idx, value in enumerate(row_data, 1):
                cell = ws.cell(row=current_row, column=col_idx, value=value)
                apply_cell_style(cell)
                # Highlight percentage in red if needed
                if col_idx == 2 and isinstance(value, str) and '%' in value:
                    cell.font = Font(color='FF0000', bold=True)
            current_row += 1
        
        current_row += 1
        
        # Bench Analysis
        ws.cell(row=current_row, column=1, value="Bench Analysis").font = Font(bold=True, size=12)
        current_row += 1
        
        bench_headers = ['Name', 'Tier', 'Focused Area', 'Allocation']
        for col, header in enumerate(bench_headers, 1):
            cell = ws.cell(row=current_row, column=col, value=header)
            apply_header_style(cell)
        current_row += 1
        
        for row_data in bench_analysis:
            tier_id = row_data.get('tier_id')
            tier_display = f"Tier {tier_id}" if tier_id else 'Unassigned'
            cells = [
                row_data.get('name', ''),
                tier_display,
                row_data.get('focused_area', 'Bench'),
                f"{row_data.get('bench_allocation', 0)}%"
            ]
            for col_idx, value in enumerate(cells, 1):
                cell = ws.cell(row=current_row, column=col_idx, value=value)
                apply_cell_style(cell)
            current_row += 1
        
        current_row += 1
        
        # Track Wise Summary
        ws.cell(row=current_row, column=1, value="Track Wise Summary").font = Font(bold=True, size=12)
        current_row += 1
        
        track_headers = ['Track', 'Bench Resource Count']
        for col, header in enumerate(track_headers, 1):
            cell = ws.cell(row=current_row, column=col, value=header)
            apply_header_style(cell)
        current_row += 1
        
        # Use all tracks from the query result
        if track_summary:
            for track_row in track_summary:
                track_name = track_row.get('track_name', 'Unassigned')
                bench_count = float(track_row.get('bench_count', 0) or 0)
                track_data = [track_name, bench_count]
                
                for col_idx, value in enumerate(track_data, 1):
                    cell = ws.cell(row=current_row, column=col_idx, value=value)
                    apply_cell_style(cell)
                current_row += 1
        else:
            # Fallback if no data
            track_data = [['No data', 0]]
            for row_data in track_data:
                for col_idx, value in enumerate(row_data, 1):
                    cell = ws.cell(row=current_row, column=col_idx, value=value)
                    apply_cell_style(cell)
                current_row += 1
        
        auto_column_width(ws)
        
        # Save to bytes
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        filename = f"summary_report_{datetime.now().strftime('%Y%m%d')}.xlsx"
        
        return file_response(
            output.getvalue(),
            filename,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        logger.error(f"Failed to generate summary report: {str(e)}", exc_info=True)
        return error(f"Failed to generate summary report: {str(e)}")
    finally:
        close_connection()
