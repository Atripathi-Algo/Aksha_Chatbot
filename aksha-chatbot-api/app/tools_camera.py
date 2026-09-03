"""Camera Operations tools — Phase 1, green (Section 1.2). Reads only."""

from pydantic import BaseModel, Field

from app.node_client import get
from app.tool_registry import ToolSpec, register_tool


class GetCamerasInput(BaseModel):
    pass


def _get_cameras(_: GetCamerasInput) -> dict:
    cameras = get("/api/camera")
    return {"cameras": cameras}


class GetCameraGroupsInput(BaseModel):
    group_id: str = Field(default="", description="Optional specific group id; empty for all groups.")


def _get_camera_groups(params: GetCameraGroupsInput) -> dict:
    path = f"/api/camgroup/{params.group_id}" if params.group_id else "/api/camgroup"
    groups = get(path)
    return {"groups": groups}


def register() -> None:
    register_tool(
        ToolSpec(
            name="get_cameras",
            domain="camera_operations",
            description="List all cameras with their status, priority, FPS, and detection features.",
            input_model=GetCamerasInput,
            handler=_get_cameras,
        )
    )
    register_tool(
        ToolSpec(
            name="get_camera_groups",
            domain="camera_operations",
            description="List camera groups, or one group by id, including which cameras belong to each and their notification settings.",
            input_model=GetCameraGroupsInput,
            handler=_get_camera_groups,
        )
    )
