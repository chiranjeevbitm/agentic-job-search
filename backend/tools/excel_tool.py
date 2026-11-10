import asyncio
from pathlib import Path
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from langchain_core.tools import tool

OUTPUT_DIR = Path(__file__).parent.parent / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
EXCEL_FILE = OUTPUT_DIR / "job_results.xlsx"

HEADERS = [
    "Search Date", "Search ID", "Job Title", "Company", "Location",
    "Score", "Is Suitable", "Match Reason", "Job Description", "Cover Letter", "Job URL",
    "Job Level", "Years of Experience"
]
HEADER_FILL = PatternFill(start_color="1E1B4B", end_color="1E1B4B", fill_type="solid")
SUITABLE_FILL = PatternFill(start_color="D1FAE5", end_color="D1FAE5", fill_type="solid")
UNSUITABLE_FILL = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")
HEADER_FONT = Font(bold=True, color="FFFFFF", size=11)
THIN = Border(
    left=Side(style="thin"), right=Side(style="thin"),
    top=Side(style="thin"), bottom=Side(style="thin"),
)
COL_WIDTHS = [18, 20, 30, 25, 20, 8, 12, 55, 80, 80, 45, 15, 20]


def _get_or_create_workbook():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Job Results"
    for col_idx, header in enumerate(HEADERS, start=1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = HEADER_FONT
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = THIN
    ws.row_dimensions[1].height = 30
    for i, w in enumerate(COL_WIDTHS, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    return wb, ws


@tool
async def save_to_excel(jobs_json: str, search_id: str = "results") -> str:
    """Save job results to a local Excel (.xlsx) file uniqueness by search_id."""
    import json
    jobs = json.loads(jobs_json)

    def _write():
        wb, ws = _get_or_create_workbook()
        next_row = ws.max_row + 1
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
        for job in jobs:
            is_suitable = job.get("is_suitable", "No")
            row_fill = SUITABLE_FILL if is_suitable == "Yes" else UNSUITABLE_FILL
            row_data = [
                now_str,
                job.get("search_id", search_id),
                job.get("title", ""),
                job.get("company", ""),
                job.get("location", ""),
                job.get("score", 0),
                is_suitable,
                job.get("match_reason", ""),
                job.get("description", "")[:2000],  # Job Description (truncated)
                job.get("cover_letter", ""),
                job.get("url", ""),
                job.get("job_level", ""),  # Job level extracted from description
                job.get("years_of_experience", "")  # Years of experience extracted from description
            ]
            for col_idx, value in enumerate(row_data, start=1):
                cell = ws.cell(row=next_row, column=col_idx, value=value)
                cell.fill = row_fill
                cell.alignment = Alignment(vertical="top", wrap_text=True)
                cell.border = THIN
            ws.row_dimensions[next_row].height = 80
            next_row += 1
        
        now = datetime.now()
        file_name = f"job_results_{now.strftime('%B_%d_%H%M%S')}.xlsx"
        file_path = OUTPUT_DIR / file_name
        wb.save(file_path)
        return str(file_path)

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _write)
