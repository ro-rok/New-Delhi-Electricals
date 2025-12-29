"""
Quick search test script - Run this to test search functionality.
Usage: python scripts/test_search.py
"""

import asyncio
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from tests.test_search_engine import SearchEngineTester
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)

async def quick_test():
    """Quick test of critical search queries."""
    tester = SearchEngineTester()
    
    try:
        if not await tester.setup():
            print("❌ Failed to connect to database")
            return False
        
        print("\n🔍 Running Quick Search Tests...\n")
        
        # Critical tests
        tests = [
            ("plate engem", 1),
            ("12 module plate engem", 1),
            ("engem plate", 1),
            ("12 module", 1),
        ]
        
        all_passed = True
        for query, min_results in tests:
            passed = await tester.run_test(
                f"Query: '{query}'",
                query=query,
                expected_min_results=min_results
            )
            if not passed:
                all_passed = False
        
        await tester.teardown()
        return all_passed
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        await tester.teardown()
        return False

if __name__ == "__main__":
    success = asyncio.run(quick_test())
    sys.exit(0 if success else 1)

