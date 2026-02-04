"""
Smart search query parser that extracts category, brand, and series from search queries.

This module intelligently parses search queries to identify:
- Categories (e.g., "Plate", "Switches", "Circuit Protection")
- Brands (e.g., "L&T", "Lauritz Knudsen", "ABB")
- Series/Product Families (e.g., "Engem", "Englaze", "Penta")

It then maps series to their associated brands automatically.
"""

from typing import Dict, List, Optional, Set, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase

class SearchParser:
    """Parses search queries to extract category, brand, and series filters."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self._categories: Optional[Set[str]] = None  # normalized lowercase
        self._categories_map: Optional[Dict[str, str]] = None  # normalized -> actual
        self._brands: Optional[Set[str]] = None  # normalized lowercase
        self._brands_map: Optional[Dict[str, str]] = None  # normalized -> actual
        self._series: Optional[Dict[str, Set[str]]] = None  # normalized series -> set of normalized brands
        self._series_map: Optional[Dict[str, str]] = None  # normalized -> actual
    
    async def _load_metadata(self):
        """Load categories, brands, and series from database."""
        if self._categories is not None:
            return  # Already loaded
        
        # Load categories
        categories_pipeline = [
            {"$group": {"_id": "$category"}},
            {"$project": {"_id": 0, "name": "$_id"}}
        ]
        self._categories = set()
        self._categories_map = {}
        async for doc in self.db.products.aggregate(categories_pipeline):
            if doc.get("name"):
                actual = doc["name"]
                normalized = actual.lower()
                self._categories.add(normalized)
                self._categories_map[normalized] = actual
        
        # Load brands
        brands_pipeline = [
            {"$group": {"_id": "$brand"}},
            {"$project": {"_id": 0, "name": "$_id"}}
        ]
        self._brands = set()
        self._brands_map = {}
        async for doc in self.db.products.aggregate(brands_pipeline):
            if doc.get("name"):
                actual = doc["name"]
                normalized = actual.lower()
                self._brands.add(normalized)
                self._brands_map[normalized] = actual
        
        # Load series and their associated brands
        # Check both "series" field and "catalog_source.product_family" field
        series_pipeline = [
            {
                "$project": {
                    "series": 1,
                    "brand": 1,
                    "product_family": "$catalog_source.product_family"
                }
            },
            {
                "$group": {
                    "_id": {
                        "series": "$series",
                        "product_family": "$product_family",
                        "brand": "$brand"
                    }
                }
            }
        ]
        self._series = {}
        self._series_map = {}
        async for doc in self.db.products.aggregate(series_pipeline):
            series = doc.get("_id", {}).get("series")
            product_family = doc.get("_id", {}).get("product_family")
            brand = doc.get("_id", {}).get("brand")
            
            # Use series or product_family, whichever is available
            series_value = series or product_family
            
            if series_value and brand:
                actual_series = series_value
                series_lower = actual_series.lower()
                if series_lower not in self._series:
                    self._series[series_lower] = set()
                    self._series_map[series_lower] = actual_series
                self._series[series_lower].add(brand.lower())
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for comparison."""
        return text.lower().strip()
    
    def _find_category(self, query_words: List[str], query_lower: str) -> Optional[str]:
        """Find category in query. Returns actual database value."""
        # Check for exact category matches
        for word in query_words:
            word_lower = word.lower()
            # Direct match
            if word_lower in self._categories:
                return self._categories_map.get(word_lower, word_lower)
            
            # Check for partial matches (e.g., "plate" matches "Plates")
            for category_norm in self._categories:
                if word_lower in category_norm or category_norm in word_lower:
                    return self._categories_map.get(category_norm, category_norm)
        
        # Check for common category variations (check this BEFORE partial matching for priority)
        category_variations = {
            "plate": "plates",
            "plates": "plates",
            "switch": "switches",
            "switches": "switches",
            "socket": "power sockets",
            "mcb": "circuit protection",
            "breaker": "circuit protection",
            "wire": "wires & cables",
            "cable": "wires & cables",
            "box": "boxes",
            "boxes": "boxes",
            "dimmer": "dimmers",
            "fan": "fan controls",
            "accessory": "accessories",
            "accessories": "accessories",
        }
        
        for word in query_words:
            word_lower = word.lower()
            if word_lower in category_variations:
                variant = category_variations[word_lower]
                if variant in self._categories:
                    return self._categories_map.get(variant, variant)
        
        # Check full query for category names (most flexible - catches "cover plate", etc.)
        for category_norm in self._categories:
            if category_norm in query_lower:
                return self._categories_map.get(category_norm, category_norm)
        
        # Also check if query contains category keywords
        if "plate" in query_lower and "plates" in self._categories:
            return self._categories_map.get("plates", "Plates")
        
        return None
    
    def _find_brand(self, query_words: List[str], query_lower: str) -> Optional[str]:
        """Find brand in query. Returns actual database value."""
        # Check for exact brand matches
        for word in query_words:
            word_lower = word.lower()
            if word_lower in self._brands:
                return self._brands_map.get(word_lower, word_lower)
        
        # Check for multi-word brands (e.g., "Lauritz Knudsen", "L&T")
        # Try combinations of consecutive words
        for i in range(len(query_words)):
            for j in range(i + 1, min(i + 4, len(query_words) + 1)):
                phrase = " ".join(query_words[i:j]).lower()
                if phrase in self._brands:
                    return self._brands_map.get(phrase, phrase)
        
        # Check for brand variations
        brand_variations = {
            "l&t": "l&t",
            "lt": "l&t",
            "lauritz": "lauritz knudsen",
            "knudsen": "lauritz knudsen",
        }
        
        for word in query_words:
            word_lower = word.lower()
            if word_lower in brand_variations:
                variant = brand_variations[word_lower]
                if variant in self._brands:
                    return self._brands_map.get(variant, variant)
        
        # Check full query for brand names
        for brand_norm in self._brands:
            if brand_norm in query_lower:
                return self._brands_map.get(brand_norm, brand_norm)
        
        return None
    
    def _find_series(self, query_words: List[str], query_lower: str) -> Optional[str]:
        """Find series/product family in query. Returns actual database value."""
        if not self._series:
            return None
        
        # Check for exact series matches (case-insensitive)
        for word in query_words:
            word_lower = word.lower()
            if word_lower in self._series:
                return self._series_map.get(word_lower, word_lower)
        
        # Check for partial series matches (e.g., "engem" matches "ENGEM")
        for word in query_words:
            word_lower = word.lower()
            for series_norm in self._series.keys():
                if word_lower in series_norm or series_norm in word_lower:
                    return self._series_map.get(series_norm, series_norm)
        
        # Check for series in full query
        for series_norm in self._series.keys():
            if series_norm in query_lower:
                return self._series_map.get(series_norm, series_norm)
        
        return None
    
    def _get_brand_from_series(self, series: str) -> Optional[str]:
        """Get brand associated with a series. Returns actual database brand name."""
        if not self._series:
            return None
        
        series_lower = series.lower()
        if series_lower in self._series:
            brands = self._series[series_lower]
            # Get the first brand (normalized) and convert to actual brand name
            if brands:
                normalized_brand = next(iter(brands))
                # Return actual brand name from map
                return self._brands_map.get(normalized_brand, normalized_brand)
        
        return None
    
    async def parse(self, query: str) -> Dict[str, Optional[str]]:
        """
        Parse search query and extract category, brand, and series.
        
        Example: "12 module plate engem" will extract:
        - category: "Plates" (from "plate")
        - series: "ENGEM" (from "engem")
        - brand: "Lauritz Knudsen" (inferred from series "ENGEM")
        - remaining_query: "12 module"
        
        Returns:
            Dictionary with keys: 'category', 'brand', 'series', 'remaining_query'
        """
        await self._load_metadata()
        
        if not query or not query.strip():
            return {
                'category': None,
                'brand': None,
                'series': None,
                'remaining_query': query
            }
        
        query_lower = self._normalize_text(query)
        query_words = query_lower.split()
        
        # Find category, brand, and series (in that order of priority)
        # 1. First try to find series (most specific)
        series = self._find_series(query_words, query_lower)
        
        # 2. Find category
        category = self._find_category(query_words, query_lower)
        
        # 3. Find brand (either directly or from series)
        brand = self._find_brand(query_words, query_lower)
        
        # 4. If series found but brand not found, infer brand from series
        if series and not brand:
            brand_from_series = self._get_brand_from_series(series)
            if brand_from_series:
                # Convert normalized brand back to actual brand name
                brand = brand_from_series
        
        # Build remaining query by removing matched terms
        remaining_words = []
        matched_terms = set()
        
        if category:
            category_words = category.split()
            matched_terms.update(category_words)
        
        if brand:
            brand_words = brand.split()
            matched_terms.update(brand_words)
        
        if series:
            series_words = series.split()
            matched_terms.update(series_words)
        
        # Filter out matched terms from remaining query
        for word in query_words:
            if word not in matched_terms:
                remaining_words.append(word)
        
        remaining_query = " ".join(remaining_words).strip()
        
        return {
            'category': category,
            'brand': brand,
            'series': series,
            'remaining_query': remaining_query if remaining_query else None
        }

