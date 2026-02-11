"""
Shared Configuration Constants for Document Service

This module mirrors the Node.js shared layer configs (/opt/nodejs/configs/index.js)
for use in Python-based document generation.

These configs should be kept in sync with the Node.js version.
When updating the shared layer configs, update this file as well.
"""

# ============================================================================
# TRACKS - Resource tracks/departments
# ============================================================================
TRACKS = {
    1: 'QA',
    2: 'Dev',
    3: 'UI',
    4: 'BA',
    5: 'PM',
    6: 'Support',
    8: 'UX',
    9: 'Execs',
    10: 'Delivery',
    11: 'Functional Consultant - MS Dynamics 365'
}

TRACKS_FULL = [
    {'id': 1, 'value': 1, 'label': 'QA', 'description': 'Quality Assurance', 'isActive': True, 'displayOrder': 1},
    {'id': 2, 'value': 2, 'label': 'Dev', 'description': 'Development', 'isActive': True, 'displayOrder': 2},
    {'id': 3, 'value': 3, 'label': 'UI', 'description': 'UI Development', 'isActive': True, 'displayOrder': 3},
    {'id': 4, 'value': 4, 'label': 'BA', 'description': 'Business Analysis', 'isActive': True, 'displayOrder': 4},
    {'id': 5, 'value': 5, 'label': 'PM', 'description': 'Project Management', 'isActive': True, 'displayOrder': 5},
    {'id': 6, 'value': 6, 'label': 'Support', 'description': 'Support Functions', 'isActive': True, 'displayOrder': 6},
    {'id': 8, 'value': 8, 'label': 'UX', 'description': 'User Experience', 'isActive': True, 'displayOrder': 7},
    {'id': 9, 'value': 9, 'label': 'Execs', 'description': 'Executives', 'isActive': True, 'displayOrder': 8},
    {'id': 10, 'value': 10, 'label': 'Delivery', 'description': 'Delivery Management', 'isActive': True, 'displayOrder': 9},
    {'id': 11, 'value': 11, 'label': 'Functional Consultant - MS Dynamics 365', 'description': 'MS Dynamics 365 Functional Consultant', 'isActive': True, 'displayOrder': 10},
]

# ============================================================================
# TECH STACKS - Technology specializations
# ============================================================================
TECH_STACKS = {
    1: 'QA',
    2: '.NET',
    3: 'Full Stack',
    4: 'Synergy',
    5: 'PM',
    6: 'BA',
    7: 'UI',
    8: 'Java',
    9: 'Data Science',
    10: 'Power Apps',
    11: 'Finance',
    12: 'React',
    13: 'Dynamics',
    14: 'UX',
    15: 'BA/PM',
    16: 'UI/UX',
    17: 'HR',
    18: 'Execs',
    19: 'Admin',
    20: 'Marketing',
    21: 'Drupal',
    22: 'Sales & Marketing',
    23: 'BC',
    24: 'Business Central (Functional)',
    25: 'AI/ML',
    26: 'Blockchain'
}

# ============================================================================
# TIERS - Resource seniority levels
# ============================================================================
TIERS = {
    1: 'Tier - 1',
    2: 'Tier - 2',
    3: 'Tier - 3',
    4: 'Tier - 4',
    5: 'Intern',
    6: 'None',
    7: 'Synergy'
}

TIERS_FULL = [
    {'id': 1, 'value': 1, 'label': 'Tier - 1', 'description': 'Tier 1 - Entry level', 'isActive': True, 'displayOrder': 1},
    {'id': 2, 'value': 2, 'label': 'Tier - 2', 'description': 'Tier 2 - Intermediate', 'isActive': True, 'displayOrder': 2},
    {'id': 3, 'value': 3, 'label': 'Tier - 3', 'description': 'Tier 3 - Senior', 'isActive': True, 'displayOrder': 3},
    {'id': 4, 'value': 4, 'label': 'Tier - 4', 'description': 'Tier 4 - Expert', 'isActive': True, 'displayOrder': 4},
    {'id': 5, 'value': 5, 'label': 'Intern', 'description': 'Internship tier', 'isActive': True, 'displayOrder': 5},
    {'id': 6, 'value': 6, 'label': 'None', 'description': 'No tier assigned', 'isActive': True, 'displayOrder': 6},
    {'id': 7, 'value': 7, 'label': 'Synergy', 'description': 'Synergy program tier', 'isActive': True, 'displayOrder': 7},
]

# ============================================================================
# BILLABLE TRACKS - Tracks that count towards billable resources
# ============================================================================
BENCH_ELIGIBLE_TRACK_IDS = [1, 2, 3, 4, 5, 8, 10, 11]
BILLABLE_RESOURCE_TRACK_IDS = [1, 2, 3, 4, 5, 8, 11]

# ============================================================================
# PROJECT STATUSES
# ============================================================================
PROJECT_STATUSES = {
    1: 'Active',
    2: 'Inactive',
    3: 'Completed',
    4: 'On Hold'
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_track_name(track_id):
    """Get track name from track_id"""
    if track_id is None:
        return 'Unassigned'
    return TRACKS.get(track_id, f'Track {track_id}')


def get_tier_name(tier_id):
    """Get tier name from tier_id"""
    if tier_id is None:
        return 'Unassigned'
    return TIERS.get(tier_id, f'Tier {tier_id}')


def get_tech_stack_name(tech_stack_id):
    """Get tech stack name from tech_stack_id"""
    if tech_stack_id is None:
        return 'Unassigned'
    return TECH_STACKS.get(tech_stack_id, f'Tech Stack {tech_stack_id}')


def get_project_status_name(status_id):
    """Get project status name from status_id"""
    if status_id is None:
        return 'Unknown'
    return PROJECT_STATUSES.get(status_id, f'Status {status_id}')


def is_billable_track(track_id):
    """Check if a track is billable"""
    return track_id in BILLABLE_RESOURCE_TRACK_IDS


def is_bench_eligible_track(track_id):
    """Check if a track is bench-eligible"""
    return track_id in BENCH_ELIGIBLE_TRACK_IDS
