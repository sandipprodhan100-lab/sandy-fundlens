from typing import Dict, Any, List
from .engine import load_prompt_profile

# Registry mapping roles to their prompt templates and bound skills
AGENT_REGISTRY = {
    "analyst": {
        "role_name": "Quantitative Synthesis Agent",
        "prompt_file": "analyst.md",
        "description": "Analyzes raw numerical fund performance and returns descriptive summaries.",
        "skills": ["db_query", "parquet_read", "calculate_ratios"]
    },
    "compliance": {
        "role_name": "SEBI Compliance Guardrail Agent",
        "prompt_file": "compliance.md",
        "description": "Reviews analysis drafts and sanitizes buy/sell recommendations.",
        "skills": ["text_scan", "rule_verify"]
    }
}

def get_agent_info(role: str) -> Dict[str, Any]:
    if role not in AGENT_REGISTRY:
        raise ValueError(f"Agent role '{role}' is not registered.")
    
    info = AGENT_REGISTRY[role].copy()
    info["system_prompt"] = load_prompt_profile(info["prompt_file"])
    return info
