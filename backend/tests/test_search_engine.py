"""
Automated tests for Search Engine functionality.
Tests various search queries to ensure search is working correctly.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.services.search_engine import SearchEngine
from app.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SearchEngineTester:
    """Test suite for search engine."""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.search_engine = None
        self.test_results = []
    
    async def setup(self):
        """Setup database connection."""
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URI)
            self.db = self.client[settings.MONGODB_DB_NAME]
            self.search_engine = SearchEngine(self.db)
            logger.info("✓ Database connection established")
            return True
        except Exception as e:
            logger.error(f"✗ Failed to connect to database: {e}")
            return False
    
    async def teardown(self):
        """Close database connection."""
        if self.client:
            self.client.close()
            logger.info("✓ Database connection closed")
    
    async def run_test(self, test_name: str, query: str, expected_min_results: int = 1, **kwargs):
        """Run a single test case."""
        try:
            logger.info(f"\n{'='*60}")
            logger.info(f"Testing: {test_name}")
            logger.info(f"Query: '{query}'")
            
            result = await self.search_engine.search(query=query, **kwargs)
            
            total = result.get("total", 0)
            items = result.get("items", [])
            metadata = result.get("metadata", {})
            
            # Check results
            passed = total >= expected_min_results
            
            status = "✓ PASS" if passed else "✗ FAIL"
            logger.info(f"{status} - Found {total} results (expected at least {expected_min_results})")
            
            if total > 0:
                logger.info(f"  Sample products:")
                for i, item in enumerate(items[:3], 1):
                    name = item.get("name", "N/A")
                    category = item.get("category", "N/A")
                    series = item.get("series", item.get("catalog_source", {}).get("product_family", "N/A"))
                    logger.info(f"    {i}. {name} ({category}, {series})")
            
            # Log parsed metadata
            parsed = metadata.get("parsed", {})
            if parsed:
                logger.info(f"  Parsed: category={parsed.get('category')}, "
                          f"brand={parsed.get('brand')}, series={parsed.get('series')}")
            
            logger.info(f"  Execution time: {metadata.get('execution_time_ms', 0):.2f}ms")
            
            self.test_results.append({
                "test_name": test_name,
                "query": query,
                "passed": passed,
                "total": total,
                "expected_min": expected_min_results,
                "execution_time_ms": metadata.get("execution_time_ms", 0)
            })
            
            return passed
            
        except Exception as e:
            logger.error(f"✗ FAIL - Error: {e}", exc_info=True)
            self.test_results.append({
                "test_name": test_name,
                "query": query,
                "passed": False,
                "error": str(e)
            })
            return False
    
    async def run_all_tests(self):
        """Run all test cases."""
        logger.info("\n" + "="*60)
        logger.info("SEARCH ENGINE AUTOMATED TEST SUITE")
        logger.info("="*60)
        
        # Test 1: Basic search - "plate engem"
        await self.run_test(
            "Basic search: plate engem",
            query="plate engem",
            expected_min_results=1
        )
        
        # Test 2: Module size search - "12 module plate engem"
        await self.run_test(
            "Module size search: 12 module plate engem",
            query="12 module plate engem",
            expected_min_results=1
        )
        
        # Test 3: Just series - "engem"
        await self.run_test(
            "Series only: engem",
            query="engem",
            expected_min_results=5
        )
        
        # Test 4: Category + series - "plate engem"
        await self.run_test(
            "Category + series: plate engem",
            query="plate engem",
            expected_min_results=1
        )
        
        # Test 5: Module number - "12 module"
        await self.run_test(
            "Module number: 12 module",
            query="12 module",
            expected_min_results=1
        )
        
        # Test 6: Full product name - "12 Module Cover Plate"
        await self.run_test(
            "Full product name: 12 Module Cover Plate",
            query="12 Module Cover Plate",
            expected_min_results=1
        )
        
        # Test 7: Brand search - "Lauritz Knudsen"
        await self.run_test(
            "Brand search: Lauritz Knudsen",
            query="Lauritz Knudsen",
            expected_min_results=5
        )
        
        # Test 8: Category search - "Plates"
        await self.run_test(
            "Category search: Plates",
            query="Plates",
            expected_min_results=5
        )
        
        # Test 9: Color search - "white"
        await self.run_test(
            "Color search: white",
            query="white",
            expected_min_results=5
        )
        
        # Test 10: SKU search
        await self.run_test(
            "SKU search: CB93112WM00",
            query="CB93112WM00",
            expected_min_results=1
        )
        
        # Test 11: Partial word - "engem plate"
        await self.run_test(
            "Partial word order: engem plate",
            query="engem plate",
            expected_min_results=1
        )
        
        # Test 12: Numbers in query - "1 module"
        await self.run_test(
            "Single digit module: 1 module",
            query="1 module",
            expected_min_results=1
        )
        
        # Test 13: Multiple words - "cover plate grid frame"
        await self.run_test(
            "Multiple words: cover plate grid frame",
            query="cover plate grid frame",
            expected_min_results=1
        )
        
        # Test 14: With filters
        await self.run_test(
            "With category filter: engem",
            query="engem",
            category="Plates",
            expected_min_results=1
        )
        
        # Test 15: Empty query (should return all or handle gracefully)
        await self.run_test(
            "Empty query",
            query="",
            expected_min_results=0
        )
    
    def print_summary(self):
        """Print test summary."""
        logger.info("\n" + "="*60)
        logger.info("TEST SUMMARY")
        logger.info("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r.get("passed", False))
        failed_tests = total_tests - passed_tests
        
        logger.info(f"Total tests: {total_tests}")
        logger.info(f"Passed: {passed_tests} ✓")
        logger.info(f"Failed: {failed_tests} ✗")
        logger.info(f"Success rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            logger.info("\nFailed tests:")
            for result in self.test_results:
                if not result.get("passed", False):
                    logger.info(f"  ✗ {result['test_name']}: '{result['query']}'")
                    if "error" in result:
                        logger.info(f"    Error: {result['error']}")
                    else:
                        logger.info(f"    Found {result.get('total', 0)} results (expected at least {result.get('expected_min', 0)})")
        
        logger.info("\n" + "="*60)
        
        return passed_tests == total_tests


async def main():
    """Main test runner."""
    tester = SearchEngineTester()
    
    try:
        # Setup
        if not await tester.setup():
            logger.error("Failed to setup test environment")
            return 1
        
        # Run tests
        await tester.run_all_tests()
        
        # Print summary
        all_passed = tester.print_summary()
        
        # Teardown
        await tester.teardown()
        
        return 0 if all_passed else 1
        
    except Exception as e:
        logger.error(f"Test suite failed: {e}", exc_info=True)
        await tester.teardown()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

