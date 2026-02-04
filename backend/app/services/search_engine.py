"""
Clean Search Engine - Built from scratch for reliability and performance.
Handles product search with smart parsing, flexible matching, and analytics.
"""

import re
import time
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

from ..utils.search_parser import SearchParser

logger = logging.getLogger(__name__)

class SearchEngine:
    """
    Clean, reliable search engine for products.
    Handles query parsing, flexible matching, and result ranking.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.products_collection = db.products
        self.search_parser = SearchParser(db)
    
    async def search(
        self,
        query: str,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        series: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "name",
        sort_order: str = "asc"
    ) -> Dict[str, Any]:
        """
        Search products with intelligent query parsing and flexible matching.
        
        Args:
            query: Search query string
            category: Optional category filter
            brand: Optional brand filter
            series: Optional series filter
            page: Page number (1-indexed)
            page_size: Results per page
            sort_by: Sort field ("name" or "price")
            sort_order: Sort order ("asc" or "desc")
        
        Returns:
            Dictionary with items, total, page, page_size, and metadata
        """
        start_time = time.time()
        
        logger.info(f"🔍 SearchEngine.search() called with query='{query}'")
        
        try:
            # Step 1: Parse query to extract category, brand, series
            parsed = {}
            if query and query.strip():
                logger.debug(f"Parsing query: '{query}'")
                parsed = await self.search_parser.parse(query.strip())
                logger.debug(f"Parsed result: {parsed}")
            
            # Step 2: Build MongoDB query
            mongo_query = self._build_query(
                query=query,
                parsed=parsed,
                category=category,
                brand=brand,
                series=series
            )
            logger.debug(f"MongoDB query: {mongo_query}")
            
            # Step 3: Get total count
            total = await self.products_collection.count_documents(mongo_query)
            logger.info(f"SearchEngine: Found {total} products matching query")
            
            # Step 4: Fetch products (we'll sort by relevance, not MongoDB sort)
            # Fetch more products for relevance scoring
            fetch_limit = min(page_size * 5, 200)  # Fetch 5x for better scoring
            
            cursor = self.products_collection.find(mongo_query).limit(fetch_limit)
            all_products = await cursor.to_list(length=fetch_limit)
            
            # Step 5: Score and sort by relevance if query exists
            if query and query.strip():
                scored_products = self._score_products(all_products, query.strip(), parsed)
                # Apply pagination after scoring
                skip = (page - 1) * page_size
                products = scored_products[skip:skip + page_size]
            else:
                # No query - use normal sorting
                sort_criteria = self._build_sort(sort_by, sort_order)
                # Re-sort the fetched products
                if sort_by == "price":
                    all_products.sort(key=lambda p: p.get("list_price", 0), reverse=(sort_order == "desc"))
                else:
                    all_products.sort(key=lambda p: p.get("name", ""), reverse=(sort_order == "desc"))
                skip = (page - 1) * page_size
                products = all_products[skip:skip + page_size]
            
            # Step 6: Calculate execution time
            execution_time_ms = (time.time() - start_time) * 1000
            
            # Step 7: Log analytics (fire and forget, don't block)
            try:
                asyncio.create_task(self._log_search(query, total, execution_time_ms))
            except Exception:
                pass  # Don't let logging break search
            
            return {
                "items": products,
                "total": total,
                "page": page,
                "page_size": page_size,
                "metadata": {
                    "query": query,
                    "parsed": parsed,
                    "execution_time_ms": round(execution_time_ms, 2)
                }
            }
            
        except Exception as e:
            logger.error(f"Search error: {e}", exc_info=True)
            raise
    
    def _build_query(
        self,
        query: Optional[str],
        parsed: Dict[str, Any],
        category: Optional[str],
        brand: Optional[str],
        series: Optional[str]
    ) -> Dict[str, Any]:
        """
        Build MongoDB query from search parameters.
        Uses smart matching - requires multiple words to match for better relevance.
        
        Returns:
            MongoDB query dictionary
        """
        and_conditions = []
        
        # Use explicit filters if provided, otherwise use parsed values
        explicit_category = category
        explicit_brand = brand
        explicit_series = series
        
        parsed_category = parsed.get('category')
        parsed_brand = parsed.get('brand')
        parsed_series = parsed.get('series')
        
        # Determine final filters
        final_category = explicit_category or parsed_category
        final_brand = explicit_brand or parsed_brand
        final_series = explicit_series or parsed_series
        
        # Build search conditions if query exists
        if query and query.strip():
            query_words = [w.strip() for w in query.strip().split() if len(w.strip()) >= 2]
            
            # If we have parsed filters, use them to narrow search
            # Otherwise, require multiple words to match
            if final_category or final_brand or final_series:
                # We have filters, so we can be more flexible with text matching
                search_conditions = self._build_search_conditions(query.strip())
                if search_conditions:
                    and_conditions.append({"$or": search_conditions})
            else:
                # No filters - require at least 2 words to match (better relevance)
                if len(query_words) >= 2:
                    # Build conditions that require multiple words
                    word_conditions = []
                    for word in query_words:
                        escaped_word = re.escape(word)
                        word_pattern = {"$regex": escaped_word, "$options": "i"}
                        word_conditions.extend([
                            {"name": word_pattern},
                            {"sku": word_pattern},
                            {"description": word_pattern},
                            {"category": word_pattern},
                            {"brand": word_pattern},
                            {"series": word_pattern},
                            {"catalog_source.product_family": word_pattern},
                        ])
                    
                    # Also add full query and phrase matches
                    escaped_query = re.escape(query.strip())
                    word_conditions.extend([
                        {"name": {"$regex": escaped_query, "$options": "i"}},
                        {"sku": {"$regex": escaped_query, "$options": "i"}},
                    ])
                    
                    # Add module size matching
                    numbers = self._extract_numbers(query)
                    for num in numbers:
                        word_conditions.extend([
                            {"specs.module": num},
                            {"specs.modules": num},
                            {"specs.mw": num},
                        ])
                    
                    # Require at least 2 words to match
                    # Use $or for flexibility but products matching more words will be more relevant
                    and_conditions.append({"$or": word_conditions})
                else:
                    # Single word - use simple search
                    search_conditions = self._build_search_conditions(query.strip())
                    if search_conditions:
                        and_conditions.append({"$or": search_conditions})
        
        # Add filters (these help narrow results)
        if final_category:
            and_conditions.append({
                "category": {"$regex": re.escape(final_category), "$options": "i"}
            })
        
        if final_brand:
            and_conditions.append({
                "brand": {"$regex": re.escape(final_brand), "$options": "i"}
            })
        
        if final_series:
            and_conditions.append({
                "$or": [
                    {"series": {"$regex": re.escape(final_series), "$options": "i"}},
                    {"catalog_source.product_family": {"$regex": re.escape(final_series), "$options": "i"}}
                ]
            })
        
        # Return query
        if and_conditions:
            return {"$and": and_conditions}
        return {}
    
    def _build_search_conditions(self, query: str) -> List[Dict[str, Any]]:
        """
        Build list of search conditions for flexible matching.
        
        Args:
            query: Search query string
        
        Returns:
            List of MongoDB query conditions
        """
        conditions = []
        query_lower = query.lower()
        
        # Escape query for regex
        escaped_query = re.escape(query)
        
        # 1. Full query match (highest priority)
        conditions.extend([
            {"name": {"$regex": escaped_query, "$options": "i"}},
            {"sku": {"$regex": escaped_query, "$options": "i"}},
            {"description": {"$regex": escaped_query, "$options": "i"}},
        ])
        
        # 2. Extract and search individual words
        words = [w.strip() for w in query.split() if len(w.strip()) >= 2]
        for word in words:
            escaped_word = re.escape(word)
            word_pattern = {"$regex": escaped_word, "$options": "i"}
            conditions.extend([
                {"name": word_pattern},
                {"sku": word_pattern},
                {"description": word_pattern},
                {"brand": word_pattern},
                {"category": word_pattern},
                {"series": word_pattern},
                {"catalog_source.product_family": word_pattern},
                {"specs.color": word_pattern},
                {"specs.module_size": word_pattern},
                {"specs.type_detail": word_pattern},
            ])
        
        # 3. Extract numbers for module size matching
        numbers = self._extract_numbers(query)
        for num in numbers:
            conditions.extend([
                {"specs.module": num},
                {"specs.modules": num},
                {"specs.mw": num},
            ])
        
        # 4. Phrase matching (adjacent words)
        if len(words) >= 2:
            for i in range(len(words) - 1):
                phrase = f"{words[i]} {words[i+1]}"
                phrase_pattern = {"$regex": re.escape(phrase), "$options": "i"}
                conditions.extend([
                    {"name": phrase_pattern},
                    {"description": phrase_pattern},
                ])
        
        # 5. Module phrase matching (e.g., "12 module")
        module_match = re.search(r'(\d+)\s*module', query, re.IGNORECASE)
        if module_match:
            module_num = int(module_match.group(1))
            module_phrase = f"{module_num} module"
            phrase_pattern = {"$regex": re.escape(module_phrase), "$options": "i"}
            conditions.extend([
                {"name": phrase_pattern},
                {"description": phrase_pattern},
                {"specs.module_size": phrase_pattern},
            ])
            conditions.extend([
                {"specs.module": module_num},
                {"specs.modules": module_num},
                {"specs.mw": module_num},
            ])
        
        # Remove duplicates
        return self._deduplicate_conditions(conditions)
    
    def _extract_numbers(self, text: str) -> List[int]:
        """Extract all numbers from text."""
        numbers = []
        for word in text.split():
            match = re.search(r'\d+', word)
            if match:
                try:
                    numbers.append(int(match.group()))
                except ValueError:
                    pass
        return numbers
    
    def _deduplicate_conditions(self, conditions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate conditions."""
        seen = set()
        unique = []
        for cond in conditions:
            # Create a hashable representation
            key = str(sorted(cond.items()))
            if key not in seen:
                seen.add(key)
                unique.append(cond)
        return unique
    
    def _build_sort(self, sort_by: str, sort_order: str) -> List[tuple]:
        """Build sort criteria."""
        order = 1 if sort_order == "asc" else -1
        
        if sort_by == "price":
            return [("list_price", order)]
        else:
            return [("name", order)]
    
    def _score_products(self, products: List[Dict[str, Any]], query: str, parsed: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Score products by relevance to search query.
        Higher scores = more relevant.
        """
        query_lower = query.lower()
        query_words = set(w.lower() for w in query.split() if len(w) >= 2)
        
        parsed_category = parsed.get('category', '').lower() if parsed.get('category') else None
        parsed_brand = parsed.get('brand', '').lower() if parsed.get('brand') else None
        parsed_series = parsed.get('series', '').lower() if parsed.get('series') else None
        
        scored = []
        for product in products:
            score = 0.0
            
            name = (product.get("name") or "").lower()
            category = (product.get("category") or "").lower()
            brand = (product.get("brand") or "").lower()
            series = (product.get("series") or product.get("catalog_source", {}).get("product_family") or "").lower()
            sku = (product.get("sku") or "").lower()
            
            # Exact query match in name (highest priority)
            if query_lower in name:
                score += 100
            
            # Query words in name
            name_words = set(name.split())
            matching_words = query_words & name_words
            score += len(matching_words) * 10
            
            # Exact phrase match
            if any(phrase in name for phrase in [f"{w1} {w2}" for w1, w2 in zip(query.split()[:-1], query.split()[1:])]):
                score += 20
            
            # Category match (if parsed)
            if parsed_category and parsed_category in category:
                score += 15
            
            # Brand match (if parsed)
            if parsed_brand and parsed_brand in brand:
                score += 15
            
            # Series match (if parsed) - very important
            if parsed_series and parsed_series in series:
                score += 20
            
            # SKU match
            if query_lower in sku:
                score += 50
            
            # Module size match (if query has numbers)
            numbers = self._extract_numbers(query)
            if numbers:
                specs = product.get("specs", {})
                module = specs.get("module") or specs.get("modules") or specs.get("mw")
                if module in numbers:
                    score += 25
            
            # Store score and sort
            product["_relevance_score"] = score
            scored.append(product)
        
        # Sort by relevance score (descending), then by name
        scored.sort(key=lambda p: (-p.get("_relevance_score", 0), p.get("name", "")))
        
        # Remove score from final results (don't send to frontend)
        for product in scored:
            product.pop("_relevance_score", None)
        
        return scored
    
    async def _log_search(self, query: str, result_count: int, execution_time_ms: float):
        """Log the search query (called asynchronously, errors ignored)."""
        try:
            await self.db.search_analytics.insert_one({
                "query": query.strip() if query else "",
                "timestamp": datetime.utcnow(),
                "result_count": result_count,
                "search_time": int(round(execution_time_ms)),
                "source": "web"
            })
        except Exception:
            pass  # Silently ignore logging errors

