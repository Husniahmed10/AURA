"""
AURA - LangSmith Observability Helpers
Provides utilities to fetch trace URLs and add custom tags to LangSmith runs.
LangChain/LangGraph handles the actual trace dispatching automatically via environment variables.
"""

import os
from typing import Optional
from langsmith import Client
from langsmith.utils import LangSmithError

class LangSmithTracer:
    def __init__(self):
        self.client = None
        self.enabled = os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true"
        
        if self.enabled:
            try:
                self.client = Client()
            except Exception as e:
                print(f"[LangSmith] Failed to initialize client: {e}")
                self.enabled = False

    def get_run_url(self, scan_id: str) -> Optional[str]:
        """Fetch the public/private URL for a given scan's trace in LangSmith."""
        if not self.enabled or not self.client:
            return None
            
        try:
            # LangGraph usually tags the top-level run with the project name
            # If we wanted to get a specific run ID, we'd query by tag scan_id
            project_name = os.getenv("LANGCHAIN_PROJECT", "default")
            
            # Simple query to get the latest run for a specific scan tag
            runs = list(self.client.list_runs(
                project_name=project_name,
                filter=f"eq(tags, '{scan_id}')",
                limit=1
            ))
            
            if runs:
                return runs[0].url
        except LangSmithError as e:
            print(f"[LangSmith] Error fetching run URL: {e}")
        except Exception as e:
            print(f"[LangSmith] Unexpected error: {e}")
            
        return None

# Singleton instance
tracer = LangSmithTracer()
