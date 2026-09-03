"""Insights & Analytics tools — Phase 1, green.
Matches the exact contract in AkshaV2-UIUX/backend/src/routes/insightReport.js:
all four of startDate/endDate/startTime/endTime are required by that route,
so the tool schema requires them too rather than defaulting silently."""

from pydantic import BaseModel, Field

from app.node_client import NodeApiError, post
from app.tool_registry import ToolSpec, register_tool


class GetInsightReportInput(BaseModel):
    start_date: str = Field(description="YYYY-MM-DD")
    end_date: str = Field(description="YYYY-MM-DD")
    start_time: str = Field(default="00:00:00", description="HH:MM:SS")
    end_time: str = Field(default="23:59:59", description="HH:MM:SS")
    camera_names: list[str] = Field(default_factory=list, description="Empty means all cameras.")


def _get_insight_report(params: GetInsightReportInput) -> dict:
    body = {
        "startDate": params.start_date,
        "endDate": params.end_date,
        "startTime": params.start_time,
        "endTime": params.end_time,
        "cameras": params.camera_names,
    }
    try:
        return post("/api/insightReport", body)
    except NodeApiError as e:
        # Confirmed live 2026-08-25: this route 400s with "No data found for
        # the requested date range" when no report files exist yet for that
        # window — a legitimate empty result, not a broken request. Surfacing
        # it as ok=True with no data lets the agent say "no data for that
        # range" instead of a misleading "service unavailable, try again".
        if e.error_code == "VALIDATION" and "no data found" in e.message.lower():
            return {"cameras": {}}
        raise


def register() -> None:
    register_tool(
        ToolSpec(
            name="get_insight_report",
            domain="insights_analytics",
            description="Get alert counts and object-detection breakdowns per camera over a date/time range.",
            input_model=GetInsightReportInput,
            handler=_get_insight_report,
        )
    )
