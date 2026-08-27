import os
import json
import requests
from typing import List, Dict, Any, Optional
from .skills.finance_skills import list_categories, get_sideways_windows_for_index, analyse_category_performance

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

# Tools registry
SKILLS_MAP = {
    "list_categories": list_categories,
    "get_sideways_windows_for_index": get_sideways_windows_for_index,
    "analyse_category_performance": analyse_category_performance
}

# Declarative tools for Gemini API
GEMINI_TOOLS = [
    {
        "functionDeclarations": [
            {
                "name": "list_categories",
                "description": "Lists all supported mutual fund categories and their default index proxies. Call this first when the user names a category loosely."
            },
            {
                "name": "get_sideways_windows_for_index",
                "description": "Detects range-bound (sideways) market phases for a benchmark index (e.g. nifty50). Returns windows with start and end dates.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "index_key": {
                            "type": "STRING",
                            "description": "The key of the index proxy. Must be one of: nifty50, midcap150, smallcap250, nifty500."
                        }
                    },
                    "required": ["index_key"]
                }
            },
            {
                "name": "analyse_category_performance",
                "description": "Ranks mutual funds in a category based on performance returns during a specified start and end date window.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "category": {
                            "type": "STRING",
                            "description": "The category key. Must be one of: large, mid, small, multi, flexi, hybrid."
                        },
                        "start": {
                            "type": "STRING",
                            "description": "Start date in YYYY-MM-DD format."
                        },
                        "end": {
                            "type": "STRING",
                            "description": "End date in YYYY-MM-DD format."
                        }
                    },
                    "required": ["category", "start", "end"]
                }
            }
        ]
    }
]

class GeminiAgentEngine:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.url_template = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def execute_with_tools(self, system_instruction: str, messages: List[Dict[str, Any]], model: str = "gemini-1.5-pro") -> str:
        """Executes an agent loop supporting multi-turn tool execution."""
        if not self.api_key:
            return "[Agent Engine] API key not configured. Mock output of fund analysis."

        url = self.url_template.format(model=model, key=self.api_key)
        headers = {"Content-Type": "application/json"}
        
        # Build payload starting with message list
        contents = [m.copy() for m in messages]
        
        # ReAct / Tool-calling loop (max 5 iterations to prevent infinite loops)
        for step in range(5):
            payload = {
                "contents": contents,
                "systemInstruction": {
                    "parts": [{"text": system_instruction}]
                },
                "tools": GEMINI_TOOLS,
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 2048
                }
            }
            
            try:
                response = requests.post(url, json=payload, headers=headers, timeout=60)
                response.raise_for_status()
                res_json = response.json()
                
                candidates = res_json.get("candidates", [])
                if not candidates:
                    return "Error: Empty response candidates from Gemini."
                    
                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                
                # Check if model wants to call a function
                function_calls = [p.get("functionCall") for p in parts if p.get("functionCall")]
                
                if function_calls:
                    # Append assistant's request to call functions to contents history
                    contents.append(content)
                    
                    # Execute all requested functions
                    response_parts = []
                    for call in function_calls:
                        name = call.get("name")
                        args = call.get("args", {})
                        print(f"[Agent Tool Execution] Calling tool: {name} with args: {args}")
                        
                        tool_func = SKILLS_MAP.get(name)
                        if tool_func:
                            try:
                                result = tool_func(**args)
                            except Exception as ex:
                                result = {"error": f"Tool execution failed: {ex}"}
                        else:
                            result = {"error": f"Tool '{name}' is not registered."}
                            
                        response_parts.append({
                            "functionResponse": {
                                "name": name,
                                "response": {"result": result}
                            }
                        })
                        
                    # Append tool responses as a 'user' role message to feed back to the model
                    contents.append({
                        "role": "user",
                        "parts": response_parts
                    })
                    
                    # Proceed to next turn of loop
                    continue
                else:
                    # Model returned standard text answer (no tool calls)
                    if parts:
                        return parts[0].get("text", "")
                    return "Error: Empty output content."
            except Exception as e:
                return f"Error executing agent loop: {e}"
                
        return "Error: Exceeded maximum tool execution turns."

    def clean_generate(self, system_instruction: str, prompt: str, model: str = "gemini-1.5-flash") -> str:
        """Simple text generation (no tools) for fast checks/sanitization."""
        if not self.api_key:
            return prompt
            
        url = self.url_template.format(model=model, key=self.api_key)
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": system_instruction}]}
        }
        try:
            res = requests.post(url, json=payload, headers=headers, timeout=30)
            res.raise_for_status()
            candidates = res.json().get("candidates", [])
            if candidates:
                return candidates[0]["content"]["parts"][0]["text"]
            return prompt
        except Exception as e:
            print(f"[Gemini Client] Sanitization error: {e}")
            return prompt

gemini_engine = GeminiAgentEngine()

def load_prompt_profile(filename: str) -> str:
    path = os.path.join(os.path.dirname(__file__), "roles", filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return f"You are a helpful mutual fund agent specializing in {filename}."

def run_agentic_analysis(user_query: str, history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """Runs the Dual-Agent Analyst + Compliance validation workflow with tool calling."""
    # 1. Load system profiles
    analyst_prompt = load_prompt_profile("analyst.md")
    compliance_prompt = load_prompt_profile("compliance.md")
    
    # 2. Build multi-turn history
    messages = []
    if history:
        for m in history:
            messages.append({
                "role": m["role"],
                "parts": [{"text": m["content"]}]
            })
            
    # Add latest query
    messages.append({
        "role": "user",
        "parts": [{"text": user_query}]
    })
    
    # 3. Stage 1: Run Analyst with finance tools
    draft_analysis = gemini_engine.execute_with_tools(
        system_instruction=analyst_prompt,
        messages=messages,
        model="gemini-1.5-pro"
    )
    
    # 4. Stage 2: Compliance Verification
    verification_prompt = (
        f"Please inspect and sanitize the following draft report for any advisory or buy/sell calls. "
        f"If clean, return as is. If edits are made, ensure facts are preserved.\n\n"
        f"Draft Report:\n{draft_analysis}"
    )
    
    sanitized_analysis = gemini_engine.clean_generate(
        system_instruction=compliance_prompt,
        prompt=verification_prompt,
        model="gemini-1.5-flash"
    )
    
    return {
        "draft": draft_analysis,
        "final_report": sanitized_analysis,
        "is_mock": not gemini_engine.is_configured()
    }
