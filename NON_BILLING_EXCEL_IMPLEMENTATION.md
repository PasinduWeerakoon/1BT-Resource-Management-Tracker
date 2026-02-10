# Non-Billing (Critical Shadows) Excel Download Implementation

**Date:** 2026-02-09
**Feature:** Excel download for Non-Billing/Critical Shadows Report

## Overview

Added Excel download functionality for the Non-Billing Report (Critical Shadows) with billing percentage column included as requested.

## Backend Changes

### 1. **Excel Handler** (`backend/services/document-service/src/handlers/excel_handler.py`)

Added `generate_non_billing_report()` function:

```python
def generate_non_billing_report(event, context):
    """
    Generate non-billing (Critical Shadows) report in Excel format
    GET /documents/excel/non-billing
    """
    # Query non-billing allocations (billing_status_id = 2)
    # Includes: name, project, allocation_percentage, billing_percentage
    # Supports track_id filter via query parameters
```

**Key Features:**
- ✅ Queries allocations with `billing_status_id = 2` (Non-Billing)
- ✅ Includes **Billing Percentage** column as requested
- ✅ Supports track filter via query parameters
- ✅ Styled with red title "Critical Shadows"
- ✅ Highlights low allocation percentages in red
- ✅ File naming: `critical_shadows_report_YYYYMMDD.xlsx`

**Columns:**
1. Name
2. Project
3. Allocation (%)
4. **Billing Percentage (%)** ← NEW

### 2. **Documents Handler** (`backend/services/document-service/src/handlers/documents.py`)

Added routing function:
```python
def generate_non_billing_excel(event, context):
    """Generate non-billing (critical shadows) report Excel"""
    return generate_non_billing_report(event, context)
```

### 3. **Serverless Configuration** (`backend/services/document-service/serverless.yml`)

Added new Lambda function:
```yaml
generateNonBillingExcel:
  handler: src/handlers/documents.generate_non_billing_excel
  description: Generate non-billing (critical shadows) report Excel
  events:
    - httpApi:
        path: /api/v1/documents/excel/non-billing
        method: GET
        authorizer: ${self:custom.authorizer}
```

**Endpoint:** `GET /api/v1/documents/excel/non-billing`
**Query Parameters:** `track_id` (optional)

## Frontend Changes

### 1. **API Endpoints** (`frontend/src/api/endpoints.js`)

```javascript
DOCUMENTS: {
  EXCEL_SUMMARY: `${BASE_URL}/documents/excel/summary`,
  EXCEL_NON_BILLING: `${BASE_URL}/documents/excel/non-billing`, // NEW
},
```

### 2. **Documents Service** (`frontend/src/api/services/documents.service.js`)

Added download function with helper:
```javascript
downloadNonBillingExcel: async (params = {}) => {
  const response = await fileDownloadClient.get(
    ENDPOINTS.DOCUMENTS.EXCEL_NON_BILLING,
    { responseType: 'blob', params }
  );
  // Auto-downloads as: critical_shadows_report_YYYYMMDD.xlsx
}
```

**Features:**
- Accepts query parameters (e.g., `{ track_id: 1 }`)
- Extracts filename from Content-Disposition header
- Falls back to default filename with current date
- Triggers browser download automatically

### 3. **Non-Billing Report Page** (`frontend/src/pages/NonBillingReport/index.js`)

Added Download Excel button to header:

```javascript
<ReportHeader 
  title="NON-BILLING REPORT"
  extra={
    <Button
      type="primary"
      icon={<DownloadOutlined />}
      onClick={handleDownloadExcel}
      loading={isDownloading}
    >
      Download Excel
    </Button>
  }
/>
```

**Functionality:**
- Button in report header
- Shows loading state while downloading
- Passes current track filter to download
- Shows success/error toast notifications

## Data Flow

```
Frontend                      Backend                      Database
--------                      -------                      --------
User clicks                   Lambda receives              Query:
"Download Excel"   ─────>     GET request with       ─────> SELECT ... 
                              track_id param               FROM allocations
                                                           WHERE billing_status_id = 2
                                  │
                                  ↓
                              Generate Excel
                              with openpyxl:
                              - Name
                              - Project  
                              - Allocation %
                              - Billing % ✓
                                  │
                                  ↓
                              Return Excel
Browser downloads  <─────     file as blob
Excel file
```

## Excel Report Format

```
┌──────────────────────────────────────┐
│      Critical Shadows (Red Title)     │
├──────────────────────────────────────┤
│ Generated: 2026-02-09 15:30:00       │
│ Total Records: 45                    │
├────────┬──────────┬────────┬─────────┤
│ Name   │ Project  │Allocn │Billing% │
├────────┼──────────┼────────┼─────────┤
│ Akeel  │ Lynear W │ 100%  │  100%   │
│ Danthila│Lynear W │ 100%  │  100%   │
│ Himasha│Healthfin │ 100%  │  100%   │
│ ...    │   ...    │  ...  │   ...   │
└────────┴──────────┴────────┴─────────┘
```

**Styling:**
- Title in red bold (Critical Shadows theme)
- Header row with blue background
- Allocations < 100% highlighted in red
- Auto-sized columns
- Cell borders

## Testing Checklist

- [ ] Deploy backend changes (`serverless deploy`)
- [ ] Test download without filter: `GET /api/v1/documents/excel/non-billing`
- [ ] Test download with track filter: `GET /api/v1/documents/excel/non-billing?track_id=1`
- [ ] Verify Excel file opens correctly
- [ ] Verify all 4 columns present (Name, Project, Allocation %, **Billing %**)
- [ ] Verify billing percentage values are correct
- [ ] Test frontend button click
- [ ] Verify filter is passed to API
- [ ] Verify loading state works
- [ ] Verify success toast appears
- [ ] Verify filename includes date

## Files Changed

### Backend (3 files)
1. `backend/services/document-service/src/handlers/excel_handler.py` - Added generation function
2. `backend/services/document-service/src/handlers/documents.py` - Added router
3. `backend/services/document-service/serverless.yml` - Added endpoint

### Frontend (3 files)
1. `frontend/src/api/endpoints.js` - Added endpoint constant
2. `frontend/src/api/services/documents.service.js` - Added download service
3. `frontend/src/pages/NonBillingReport/index.js` - Added download button

## API Reference

**Endpoint:** `GET /api/v1/documents/excel/non-billing`

**Query Parameters:**
- `track_id` (optional): Filter by track ID

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="critical_shadows_report_YYYYMMDD.xlsx"`

**Authentication:** Requires JWT token (Cognito)

## Notes

- ✅ Billing percentage column is now included in the Excel export
- ✅ Matches the frontend table structure (from screenshot)
- ✅ Uses same query logic as the report API (`billing_status_id = 2`)
- ✅ Supports filtering by track
- ✅ File naming consistent with other reports
- ✅ Error handling with toast notifications
- ✅ Loading states for better UX

## Deployment

```bash
# Backend
cd backend/services/document-service
serverless deploy --stage dev

# Frontend  
cd frontend
npm run build
# Deploy to S3/CloudFront
```

## Future Enhancements

- Add more filter options (designation, project, etc.)
- Add summary statistics to Excel
- Add chart/visualization to Excel
- Support multiple export formats (CSV, PDF)
