"""
Excel Generation Handler
Generates Excel reports for allocations, bench, and custom reports
"""

import json
import io
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from ..utils.database import query, close_connection
from ..utils.response import success, error, file_response
from ..lib import (
    get_logger,
    get_track_name,
    get_tier_name,
    get_tech_stack_name,
    get_project_status_name,
    BILLABLE_RESOURCE_TRACK_IDS
)

# Initialize logger
logger = get_logger(__name__)

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


def generate_non_billing_report(event, context):
    """
    Generate non-billing (Critical Shadows) report in Excel format
    Based on DASHBOARD_QUERIES.md Query #10 (Shadow calculation)
    Shows resources allocated to billing projects where allocation > billing
    GET /documents/excel/non-billing
    """
    try:
        # Extract query parameters for filtering
        query_params = event.get('queryStringParameters', {}) or {}
        track_id = query_params.get('track_id')
        
        # Build WHERE clause for track filter
        track_filter = ''
        if track_id:
            track_filter = f'AND e.track_id = {int(track_id)}'
        
        # Query Critical Shadows using dashboard query logic
        # Based on Query #10: Shadow = (allocation on billing projects) - (billing on billing projects)
        # Shows resources where allocation_percentage > billing_percentage on billing projects
        sql = f"""
            WITH resource_shadow AS (
            SELECT 
                    e.id as employee_id,
                e.name,
                    e.track_id,
                    e.tier_id,
                    e.designation_id,
                    a.project_id,
                p.project_name,
                a.allocation_percentage,
                a.billing_percentage,
                    (a.allocation_percentage - a.billing_percentage) as shadow_amount,
                    -- Calculate total allocation on billing projects (excluding bench)
                    SUM(CASE 
                        WHEN p.is_bench_project = true THEN 0
                        ELSE a.allocation_percentage 
                    END) OVER (PARTITION BY e.id) as total_allocation_on_billing,
                    -- Calculate total billing on billing projects
                    SUM(a.billing_percentage) OVER (PARTITION BY e.id) as total_billing,
                    -- Calculate total shadow in the window function
                    (
                        SUM(CASE 
                            WHEN p.is_bench_project = true THEN 0
                            ELSE a.allocation_percentage 
                        END) OVER (PARTITION BY e.id) - 
                        SUM(a.billing_percentage) OVER (PARTITION BY e.id)
                    ) as total_shadow
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
            JOIN projects p ON a.project_id = p.id
                JOIN billing_statuses pbs ON p.billing_status_id = pbs.id
                WHERE a.is_active = true 
              AND a.deleted_at IS NULL
                  AND e.status = 'Active'
              AND e.deleted_at IS NULL
                  AND LOWER(pbs.name) = 'billing'
                  AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)
                  AND e.employee_type_id != 3
                  AND e.is_external = false
              {track_filter}
            )
            SELECT 
                rs.name,
                rs.project_name,
                rs.allocation_percentage,
                rs.billing_percentage,
                rs.shadow_amount,
                rs.total_allocation_on_billing,
                rs.total_billing,
                rs.total_shadow,
                rs.track_id,
                rs.tier_id,
                d.name as designation
            FROM resource_shadow rs
            LEFT JOIN designations d ON rs.designation_id = d.id
            WHERE rs.allocation_percentage > rs.billing_percentage
              AND rs.shadow_amount > 0
            ORDER BY rs.total_shadow DESC, rs.shadow_amount DESC, rs.name ASC
        """
        
        data = query(sql)
        
        # Create workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Critical Shadows"
        
        # Title
        ws.merge_cells('A1:I1')
        title_cell = ws.cell(row=1, column=1, value="Critical Shadows (Billing Projects: Allocation > Billing)")
        title_cell.font = Font(bold=True, size=14, color='FF0000')
        title_cell.alignment = Alignment(horizontal='center')
        
        # Date and count
        ws.cell(row=2, column=1, value=f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        ws.cell(row=2, column=7, value=f"Total Records: {len(data)}")
        
        # Headers
        headers = [
            'Name', 
            'Designation',
            'Track',
            'Project', 
            'Allocation %', 
            'Billing %', 
            'Shadow (Per Project)',
            'Total Allocation',
            'Total Billing',
            'Total Shadow'
        ]
        
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=4, column=col, value=header)
            apply_header_style(cell)
        
        # Data
        for row_idx, row in enumerate(data, 5):
            allocation_pct = float(row.get('allocation_percentage', 0) or 0)
            billing_pct = float(row.get('billing_percentage', 0) or 0)
            shadow_amount = float(row.get('shadow_amount', 0) or 0)
            total_allocation = float(row.get('total_allocation_on_billing', 0) or 0)
            total_billing = float(row.get('total_billing', 0) or 0)
            total_shadow = float(row.get('total_shadow', 0) or 0)
            
            # Get track and tier names
            track_id = row.get('track_id')
            track_name = get_track_name(track_id)
            
            cells = [
                row.get('name', ''),
                row.get('designation', ''),
                track_name,
                row.get('project_name', ''),
                f"{allocation_pct}%",
                f"{billing_pct}%",
                f"{shadow_amount}%",
                f"{total_allocation}%",
                f"{total_billing}%",
                f"{total_shadow}%"
            ]
            
            for col_idx, value in enumerate(cells, 1):
                cell = ws.cell(row=row_idx, column=col_idx, value=value)
                apply_cell_style(cell)
                
                # Highlight shadow amounts in red
                if col_idx in [7, 10]:  # Shadow columns
                    cell.font = Font(color='FF0000', bold=True)
        
        auto_column_width(ws)
        
        # Save to bytes
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        filename = f"critical_shadows_report_{datetime.now().strftime('%Y%m%d')}.xlsx"
        
        return file_response(
            output.getvalue(),
            filename,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        logger.error(f"Failed to generate non-billing report: {str(e)}")
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
        
        # Calculate all stats in real-time using the same queries as dashboard.mjs
        # Based on DASHBOARD_QUERIES.md - Combined Dashboard Query
        logger.info(f"=== CALCULATING DASHBOARD STATS IN REAL-TIME ===")
        
        # Billable tracks (same as BILLABLE_TRACK_IDS in configs)
        billable_tracks = "1, 2, 3, 4, 5, 8, 11"
        
        stats_query = f"""
            WITH active_employees AS (
                SELECT id, track_id, tier_id, employee_type_id, is_external
                FROM employees
                WHERE status = 'Active' AND deleted_at IS NULL
            ),
            billable_allocations AS (
            SELECT 
                    SUM(CASE 
                        WHEN p.is_bench_project = true THEN 0
                        ELSE a.allocation_percentage 
                    END) as total_allocation
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                LEFT JOIN projects p ON a.project_id = p.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND e.track_id IN ({billable_tracks})
                  AND e.employee_type_id != 3
                  AND e.is_external = false
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
            ),
            all_billing AS (
                SELECT 
                    SUM(a.billing_percentage) as total_billing
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
            ),
            shadow_allocation AS (
                SELECT 
                    SUM(CASE 
                        WHEN p.is_bench_project = true THEN 0
                        ELSE a.allocation_percentage 
                    END) as total_allocation
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                LEFT JOIN projects p ON a.project_id = p.id
                LEFT JOIN billing_statuses pbs ON p.billing_status_id = pbs.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
                  AND e.track_id IN ({billable_tracks})
                  AND e.employee_type_id != 3
                  AND e.is_external = false
                  AND LOWER(pbs.name) = 'billing'
            ),
            shadow_billing AS (
                SELECT 
                    SUM(a.billing_percentage) as total_billing
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                JOIN projects p ON a.project_id = p.id
                JOIN billing_statuses pbs ON p.billing_status_id = pbs.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
                  AND LOWER(pbs.name) = 'billing'
            ),
            bench_allocations AS (
                SELECT 
                    SUM(a.allocation_percentage) as total_bench
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                JOIN projects p ON a.project_id = p.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
                  AND p.is_bench_project = true
                  AND e.track_id IN (1, 2, 3, 4, 5, 8, 10, 11)
         
            ),
            internal_non_billing AS (
                SELECT 
                    SUM(a.allocation_percentage) as total_allocation
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                JOIN projects p ON a.project_id = p.id
                LEFT JOIN billing_statuses pbs ON p.billing_status_id = pbs.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
                  AND p.is_bench_project = false
                  AND e.track_id IN ({billable_tracks})
                  AND e.employee_type_id != 3
                  AND e.is_external = false
                  AND (pbs.name IS NULL OR LOWER(pbs.name) != 'billing')
            ),
            training_allocations AS (
                SELECT 
                    SUM(a.allocation_percentage) as total_training
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                JOIN projects p ON a.project_id = p.id
                JOIN project_types pt ON p.project_type_id = pt.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
                  AND LOWER(pt.name) = 'training'
            )
            SELECT
                GREATEST(COUNT(CASE 
                    WHEN ae.track_id IN ({billable_tracks}) 
                    AND ae.employee_type_id != 3 
                    AND ae.is_external = false 
                    AND ae.tier_id != 7
                    THEN 1 
                END), 0) as billable_resource_count,
                
                GREATEST(COALESCE((SELECT total_billing / 100.0 FROM all_billing), 0), 0) as billing_resource_count,
                
                GREATEST(COALESCE((SELECT total_bench / 100.0 FROM bench_allocations), 0), 0) as bench_resource_count,
                
                GREATEST(
                    COALESCE(
                        ((SELECT total_allocation FROM shadow_allocation) - (SELECT total_billing FROM shadow_billing)) / 100.0,
                        0
                    ),
                    0
                ) as shadow_count,
                
                GREATEST(COUNT(CASE WHEN ae.employee_type_id = 3 THEN 1 END), 0) as intern_count,
                
                GREATEST(COALESCE((SELECT total_allocation / 100.0 FROM internal_non_billing), 0), 0) as internal_non_billing_count,
                
                GREATEST(COALESCE((SELECT total_training / 100.0 FROM training_allocations), 0), 0) as training_count,
                
                GREATEST(COALESCE((SELECT total_allocation / 100.0 FROM billable_allocations), 0), 0) as allocated_resource_count,
                
                GREATEST(COUNT(CASE WHEN ae.is_external = false THEN 1 END), 0) as total_active_employees
            FROM active_employees ae
        """
        
        stats_result = query(stats_query)
        
        logger.info(f"Stats query returned {len(stats_result) if stats_result else 0} rows")
        
        if not stats_result or len(stats_result) == 0:
            raise Exception("Failed to calculate dashboard stats")
        
        row = stats_result[0]
        
        # Extract values from query result
        billable_resource_count = float(row.get('billable_resource_count', 0) or 0)
        billing_resource_count = float(row.get('billing_resource_count', 0) or 0)
        bench_resource_count = float(row.get('bench_resource_count', 0) or 0)
        shadow_count = float(row.get('shadow_count', 0) or 0)
        intern_count = float(row.get('intern_count', 0) or 0)
        internal_non_billing_count = float(row.get('internal_non_billing_count', 0) or 0)
        training_count = float(row.get('training_count', 0) or 0)
        allocated_resource_count = float(row.get('allocated_resource_count', 0) or 0)
        total_active_employees = int(row.get('total_active_employees', 0) or 0)
        
        # Calculate utilization percentages (average per billable employee)
        # Formula: (FTE / billable_count) * 100
        billing_utilization_percent = round((billing_resource_count / billable_resource_count * 100), 1) if billable_resource_count > 0 else 0
        allocated_utilization_percent = round((allocated_resource_count / billable_resource_count * 100), 1) if billable_resource_count > 0 else 0
        
        logger.info(f"Calculated counts: billable={billable_resource_count}, billing={billing_resource_count}, bench={bench_resource_count}, shadow={shadow_count}, intern={intern_count}, internal_non_billing={internal_non_billing_count}, training={training_count}")
        logger.info(f"Calculated percentages: billing_util={billing_utilization_percent}%, allocated_util={allocated_utilization_percent}%")
        
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
            'internal_non_billing_count': internal_non_billing_count,
            'training_count': training_count,
            'intern_count': intern_count
        }
        
        logger.info(f"=== EXCEL DATA TO BE WRITTEN ===")
        logger.info(f"Billing row: {billing_row}")
        logger.info(f"Allocation row: {allocation_row}")
        
        # Query Bench Analysis (Name, Tier, Focused Area, Allocation, Track)
        # Note: Bench includes ALL employees (all tracks, including interns, external, etc.)
        # Note: tier_id and track_id are stored on employees as INTEGER config IDs (not DB table references)
        # Also includes track information for track-wise summary calculation
        bench_analysis_query = """
            SELECT 
                e.name,
                e.tier_id,
                e.track_id,
                STRING_AGG(DISTINCT p.project_name, ', ') as focused_area,
                SUM(a.allocation_percentage) as bench_allocation
            FROM allocations a
            JOIN employees e ON a.employee_id = e.id
            JOIN projects p ON a.project_id = p.id
            WHERE a.is_active = true 
              AND a.deleted_at IS NULL
              AND e.status = 'Active'
              AND e.deleted_at IS NULL
              AND p.is_bench_project = true
              AND e.track_id IN (1, 2, 3, 4, 5, 8, 10, 11)
            GROUP BY e.id, e.name, e.tier_id, e.track_id
            ORDER BY SUM(a.allocation_percentage) DESC, e.name ASC
        """
        
        logger.info(f"=== BENCH ANALYSIS QUERY ===")
        bench_analysis = query(bench_analysis_query)
        logger.info(f"Bench analysis returned {len(bench_analysis) if bench_analysis else 0} rows")
        
        if bench_analysis and len(bench_analysis) > 0:
            logger.info(f"Sample bench row: {bench_analysis[0]}")
        
        # Query Internal Non-Billing Project Allocations (Name, Tier, Project, Allocation, Track)
        # Based on DASHBOARD_QUERIES.md Query #12
        internal_non_billing_query = """
            SELECT 
                e.name,
                e.tier_id,
                e.track_id,
                p.project_name,
                a.allocation_percentage as allocation
            FROM allocations a
            JOIN employees e ON a.employee_id = e.id
            JOIN projects p ON a.project_id = p.id
            LEFT JOIN billing_statuses pbs ON p.billing_status_id = pbs.id
            WHERE a.is_active = true 
              AND a.deleted_at IS NULL
              AND e.status = 'Active'
              AND e.deleted_at IS NULL
              AND p.is_bench_project = false
              AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)
              AND e.employee_type_id != 3
              AND e.is_external = false
              AND (pbs.name IS NULL OR LOWER(pbs.name) != 'billing')
            ORDER BY a.allocation_percentage DESC, e.name ASC
        """
        
        logger.info(f"=== INTERNAL NON-BILLING QUERY ===")
        internal_non_billing_analysis = query(internal_non_billing_query)
        logger.info(f"Internal non-billing analysis returned {len(internal_non_billing_analysis) if internal_non_billing_analysis else 0} rows")
        
        if internal_non_billing_analysis and len(internal_non_billing_analysis) > 0:
            logger.info(f"Sample internal non-billing row: {internal_non_billing_analysis[0]}")
        
        # Calculate Track Wise Summary from bench_analysis results
        # Group by track_id and resolve track names from configs
        track_summary_dict = {}
        for row in bench_analysis:
            track_id = row.get('track_id')
            track_name = get_track_name(track_id)
            bench_allocation = float(row.get('bench_allocation', 0) or 0)
            
            if track_name not in track_summary_dict:
                track_summary_dict[track_name] = 0
            track_summary_dict[track_name] += bench_allocation
        
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
        title_cell.font = Font(bold=True, size=16, color='FF0000')
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
        ws.cell(row=current_row, column=1, value="Resource Billing Stats").font = Font(bold=True, size=12, color='FF0000')
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
        ws.cell(row=current_row, column=1, value="Resource Allocation Stats").font = Font(bold=True, size=12, color='FF0000')
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
            ['Bench Resources (FTE)', allocation_row.get('bench_resources', 0)],
            ['Internal Non-Billing (FTE)', allocation_row.get('internal_non_billing_count', 0)],
            ['Training Resources (FTE)', allocation_row.get('training_count', 0)],
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
        ws.cell(row=current_row, column=1, value="Bench Analysis").font = Font(bold=True, size=12, color='FF0000')
        current_row += 1
        
        bench_headers = ['Name', 'Tier', 'Focused Area', 'Allocation']
        for col, header in enumerate(bench_headers, 1):
            cell = ws.cell(row=current_row, column=col, value=header)
            apply_header_style(cell)
        current_row += 1
        
        for row_data in bench_analysis:
            tier_id = row_data.get('tier_id')
            tier_display = get_tier_name(tier_id)
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
        ws.cell(row=current_row, column=1, value="Track Wise Summary").font = Font(bold=True, size=12, color='FF0000')
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
        
        current_row += 1
        
        # Internal Non-Billing Project Allocations
        ws.cell(row=current_row, column=1, value="Internal Non-Billing Project Allocations").font = Font(bold=True, size=12, color='FF0000')
        current_row += 1
        
        non_billing_headers = ['Name', 'Tier', 'Project', 'Allocation', 'Track']
        for col, header in enumerate(non_billing_headers, 1):
            cell = ws.cell(row=current_row, column=col, value=header)
            apply_header_style(cell)
        current_row += 1
        
        if internal_non_billing_analysis:
            for row_data in internal_non_billing_analysis:
                tier_id = row_data.get('tier_id')
                tier_display = get_tier_name(tier_id)
                track_id = row_data.get('track_id')
                track_display = get_track_name(track_id)
                cells = [
                    row_data.get('name', ''),
                    tier_display,
                    row_data.get('project_name', ''),
                    f"{row_data.get('allocation', 0)}%",
                    track_display
                ]
                for col_idx, value in enumerate(cells, 1):
                    cell = ws.cell(row=current_row, column=col_idx, value=value)
                    apply_cell_style(cell)
                current_row += 1
        else:
            # Fallback if no data
            no_data_row = ['No data', '', '', '0%', '']
            for col_idx, value in enumerate(no_data_row, 1):
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


def generate_monthly_allocation_report(event, context):
    """
    Generate monthly allocation report in Excel format
    Queries both allocations (current) and allocation_history (deallocated) tables
    to get a complete picture of allocations for a given month.
    GET /documents/excel/monthly-allocation?year=2026&month=2&track_id=1
    
    Columns: emp_num, epf_num, employee name, designation, tier, tech stack,
    project short code, project name, project allocated date, project deallocated date,
    billing status, billing percentage, allocation percentage, total billing percentage,
    total allocation percentage, resource active status, global employee id
    """
    try:
        # Extract query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        year = query_params.get('year')
        month = query_params.get('month')
        track_id = query_params.get('track_id')

        # Default to current month if not provided
        now = datetime.now()
        target_year = int(year) if year else now.year
        target_month = int(month) if month else now.month

        # Calculate period start and end dates
        import calendar
        start_date = f"{target_year}-{str(target_month).zfill(2)}-01"
        last_day = calendar.monthrange(target_year, target_month)[1]
        end_date = f"{target_year}-{str(target_month).zfill(2)}-{str(last_day).zfill(2)}"

        month_names = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December']
        month_name = month_names[target_month - 1]

        logger.info(f"Generating monthly allocation Excel for {month_name} {target_year} (track_id={track_id})")

        # Build track filter (using %s for psycopg2 parameterized queries)
        # IMPORTANT: Parameter order must match the order of %s placeholders
        # in the SQL (dates for current query, optional track, then dates for
        # history query, optional track).
        track_filter = ''
        params = [end_date, start_date]  # for current allocations query

        if track_id:
            track_id_int = int(track_id)
            params.append(track_id_int)  # track for current allocations
            track_filter = 'AND e.track_id = %s'

        # Dates (and optional track) for history query
        params.extend([end_date, start_date])
        if track_id:
            params.append(track_id_int)  # track for history allocations

        # Combined query using UNION ALL
        # Query 1: Current active allocations from 'allocations' table
        # Query 2: Historical deallocated allocations from 'allocation_history' table (change_type = 'DELETED')
        # total_allocation and total_resource_billing are read directly from employees table (maintained by trigger)
        combined_sql = f"""
            SELECT 
                e.emp_no,
                e.epf_no,
                e.name as employee_name,
                d.name as designation,
                e.tier_id,
                e.tech_stack_id,
                p.project_code,
                p.project_name,
                a.allocated_date,
                a.deallocated_date,
                bs.name as billing_status,
                a.billing_percentage,
                a.allocation_percentage,
                e.total_resource_billing as total_billing_percentage,
                e.total_allocation as total_allocation_percentage,
                e.status as resource_status,
                e.global_employee_id
            FROM allocations a
            JOIN employees e ON a.employee_id = e.id
            JOIN projects p ON a.project_id = p.id
            LEFT JOIN designations d ON e.designation_id = d.id
            LEFT JOIN billing_statuses bs ON a.billing_status_id = bs.id
            WHERE a.is_active = true
              AND a.deleted_at IS NULL
              AND e.deleted_at IS NULL
              AND a.allocated_date <= %s
              AND (a.deallocated_date IS NULL OR a.deallocated_date >= %s)
              {track_filter}

            UNION ALL

            SELECT 
                e.emp_no,
                e.epf_no,
                e.name as employee_name,
                d.name as designation,
                e.tier_id,
                e.tech_stack_id,
                p.project_code,
                p.project_name,
                ah.allocation_start_date as allocated_date,
                ah.allocation_end_date as deallocated_date,
                bs.name as billing_status,
                ah.billing_percentage,
                ah.allocation_percentage,
                e.total_resource_billing as total_billing_percentage,
                e.total_allocation as total_allocation_percentage,
                e.status as resource_status,
                e.global_employee_id
            FROM allocation_history ah
            JOIN employees e ON ah.employee_id = e.id
            JOIN projects p ON ah.project_id = p.id
            LEFT JOIN designations d ON e.designation_id = d.id
            LEFT JOIN billing_statuses bs ON ah.billing_status_id = bs.id
            WHERE ah.change_type = 'DELETED'
              AND e.deleted_at IS NULL
              AND ah.allocation_start_date <= %s
              AND ah.allocation_end_date IS NOT NULL
              AND ah.allocation_end_date >= %s
              AND NOT EXISTS (
                  SELECT 1 FROM allocations a2 
                  WHERE a2.employee_id = ah.employee_id 
                    AND a2.project_id = ah.project_id 
                    AND a2.is_active = true 
                    AND a2.deleted_at IS NULL
              )
              {track_filter}
            ORDER BY employee_name, project_name
        """

        data = query(combined_sql, params)

        logger.info(f"Monthly allocation query returned {len(data) if data else 0} rows")

        # Create workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Monthly Allocation"

        # Title
        num_cols = 17
        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=num_cols)
        title_cell = ws.cell(row=1, column=1, value=f"Monthly Allocation Report - {month_name} {target_year}")
        title_cell.font = Font(bold=True, size=16, color='1F4E79')
        title_cell.alignment = Alignment(horizontal='center')

        # Metadata row
        ws.cell(row=2, column=1, value=f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        ws.cell(row=2, column=5, value=f"Period: {start_date} to {end_date}")
        ws.cell(row=2, column=10, value=f"Total Records: {len(data) if data else 0}")

        # Track filter info
        if track_id:
            track_name = get_track_name(int(track_id))
            ws.cell(row=3, column=1, value=f"Track Filter: {track_name}")
            ws.cell(row=3, column=1).font = Font(italic=True, size=10)

        # Headers
        headers = [
            'Emp No',
            'EPF No',
            'Employee Name',
            'Designation',
            'Tier',
            'Tech Stack',
            'Project Short Code',
            'Project Name',
            'Project Allocated Date',
            'Project Deallocated Date',
            'Billing Status',
            'Billing %',
            'Allocation %',
            'Total Billing %',
            'Total Allocation %',
            'Resource Active Status',
            'Global Employee ID'
        ]

        header_row = 5
        for col, header_text in enumerate(headers, 1):
            cell = ws.cell(row=header_row, column=col, value=header_text)
            apply_header_style(cell)

        # Data rows
        if data:
            for row_idx, row in enumerate(data, header_row + 1):
                tier_name = get_tier_name(row.get('tier_id'))
                tech_stack_name = get_tech_stack_name(row.get('tech_stack_id'))

                alloc_pct = int(row.get('allocation_percentage', 0) or 0)
                billing_pct = int(row.get('billing_percentage', 0) or 0)
                total_billing_pct = int(row.get('total_billing_percentage', 0) or 0)
                total_alloc_pct = int(row.get('total_allocation_percentage', 0) or 0)

                cells = [
                    row.get('emp_no', ''),
                    row.get('epf_no', ''),
                    row.get('employee_name', ''),
                    row.get('designation', ''),
                    tier_name,
                    tech_stack_name,
                    row.get('project_code', '') or '',
                    row.get('project_name', ''),
                    str(row.get('allocated_date', ''))[:10] if row.get('allocated_date') else '',
                    str(row.get('deallocated_date', ''))[:10] if row.get('deallocated_date') else 'Ongoing',
                    row.get('billing_status', '') or '',
                    f"{billing_pct}%",
                    f"{alloc_pct}%",
                    f"{total_billing_pct}%",
                    f"{total_alloc_pct}%",
                    row.get('resource_status', ''),
                    row.get('global_employee_id', '') or ''
                ]

                for col_idx, value in enumerate(cells, 1):
                    cell = ws.cell(row=row_idx, column=col_idx, value=value)
                    apply_cell_style(cell)

                    # Highlight ongoing allocations in green for deallocated date column
                    if col_idx == 10 and value == 'Ongoing':
                        cell.font = Font(color='008000', bold=True)

                    # Highlight over-allocated resources (total allocation > 100%)
                    if col_idx == 15 and total_alloc_pct > 100:
                        cell.font = Font(color='FF0000', bold=True)
        else:
            ws.cell(row=header_row + 1, column=1, value="No allocation data found for this period")

        auto_column_width(ws)

        # Save to bytes
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        filename = f"monthly_allocation_{month_name}_{target_year}.xlsx"

        return file_response(
            output.getvalue(),
            filename,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    except Exception as e:
        logger.error(f"Failed to generate monthly allocation report: {str(e)}", exc_info=True)
        return error(f"Failed to generate monthly allocation report: {str(e)}")
    finally:
        close_connection()


def generate_projects_report(event, context):
    """
    Generate projects report in Excel format
    GET /documents/excel/projects
    """
    try:
        # Query all projects with related data
        sql = """
            SELECT 
                p.project_name,
                p.id as project_id,
                pt.name as project_type,
                c.client_name,
                p.project_start_date,
                p.project_end_date,
                p.status,
                CONCAT(am.name, ' (', am.epf_no, ')') as account_manager,
                p.account_type,
                p.account_reg_sales_owner,
                p.team_size,
                p.budget,
                bs.name as billing_status,
                p.description,
                p.project_code,
                p.is_bench_project,
                p.is_default,
                p.created_at,
                p.updated_at
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN employees am ON p.account_manager_id = am.id
            LEFT JOIN project_types pt ON p.project_type_id = pt.id
            LEFT JOIN billing_statuses bs ON p.billing_status_id = bs.id
            WHERE p.deleted_at IS NULL
            ORDER BY p.status ASC, p.project_name ASC
        """
        
        data = query(sql)
        
        # Create workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Projects"
        
        # Title
        ws.merge_cells('A1:S1')
        title_cell = ws.cell(row=1, column=1, value="Project Details Report")
        title_cell.font = Font(bold=True, size=16, color='FF0000')
        title_cell.alignment = Alignment(horizontal='center')
        
        # Date and count
        ws.cell(row=2, column=1, value=f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        ws.cell(row=2, column=15, value=f"Total Projects: {len(data)}")
        
        # Headers
        headers = [
            'Project Name',
            'Project ID',
            'Project Type',
            'Client Name',
            'Project Start Date',
            'Project End Date',
            'Status',
            'Account Manager',
            'Account Type',
            'Account Reg Sales Owner',
            'Team Size',
            'Budget',
            'Billing Status',
            'Description',
            'Project Code',
            'Is Bench Project',
            'Is Default',
            'Created At',
            'Updated At'
        ]
        
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=4, column=col, value=header)
            apply_header_style(cell)
        
        # Data
        for row_idx, row in enumerate(data, 5):
            cells = [
                row.get('project_name', ''),
                row.get('project_id', ''),
                row.get('project_type', ''),
                row.get('client_name', ''),
                str(row.get('project_start_date', ''))[:10] if row.get('project_start_date') else '',
                str(row.get('project_end_date', ''))[:10] if row.get('project_end_date') else '',
                row.get('status', ''),
                row.get('account_manager', ''),
                row.get('account_type', ''),
                row.get('account_reg_sales_owner', ''),
                row.get('team_size', 0),
                float(row.get('budget', 0) or 0),
                row.get('billing_status', ''),
                row.get('description', ''),
                row.get('project_code', ''),
                'Yes' if row.get('is_bench_project') else 'No',
                'Yes' if row.get('is_default') else 'No',
                str(row.get('created_at', ''))[:19] if row.get('created_at') else '',
                str(row.get('updated_at', ''))[:19] if row.get('updated_at') else ''
            ]
            
            for col_idx, value in enumerate(cells, 1):
                cell = ws.cell(row=row_idx, column=col_idx, value=value)
                apply_cell_style(cell)
                
                # Format budget as currency
                if col_idx == 12 and value:
                    cell.number_format = '$#,##0.00'
                
                # Highlight status
                if col_idx == 7:
                    if value == 'Active':
                        cell.font = Font(color='008000', bold=True)
                    elif value == 'Inactive':
                        cell.font = Font(color='FF0000')
                    elif value == 'Completed':
                        cell.font = Font(color='0000FF')
        
        auto_column_width(ws)
        
        # Save to bytes
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        filename = f"projects_report_{datetime.now().strftime('%Y%m%d')}.xlsx"
        
        return file_response(
            output.getvalue(),
            filename,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        logger.error(f"Failed to generate projects report: {str(e)}", exc_info=True)
        return error(f"Failed to generate projects report: {str(e)}")
    finally:
        close_connection()
