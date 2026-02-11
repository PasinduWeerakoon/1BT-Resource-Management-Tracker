"""
Document Service Local Library

This package contains Python implementations of shared utilities
that mirror the Node.js shared layer functionality.
"""

from .configs import (
    TRACKS,
    TIERS,
    TECH_STACKS,
    PROJECT_STATUSES,
    BILLABLE_RESOURCE_TRACK_IDS,
    BENCH_ELIGIBLE_TRACK_IDS,
    get_track_name,
    get_tier_name,
    get_tech_stack_name,
    get_project_status_name,
    is_billable_track,
    is_bench_eligible_track
)

from .logger import get_logger

__all__ = [
    # Configs
    'TRACKS',
    'TIERS',
    'TECH_STACKS',
    'PROJECT_STATUSES',
    'BILLABLE_RESOURCE_TRACK_IDS',
    'BENCH_ELIGIBLE_TRACK_IDS',
    'get_track_name',
    'get_tier_name',
    'get_tech_stack_name',
    'get_project_status_name',
    'is_billable_track',
    'is_bench_eligible_track',
    # Logger
    'get_logger',
]
