"""
Test the actual API endpoint to verify search is working.
"""

import requests
import json

API_BASE = "http://localhost:8000"

def test_search(query):
    """Test search API endpoint."""
    url = f"{API_BASE}/api/products"
    params = {"q": query, "page": 1, "pageSize": 20}
    
    print(f"\n{'='*70}")
    print(f"Testing API: GET {url}")
    print(f"Query: {query}")
    print(f"Params: {params}")
    print(f"{'='*70}\n")
    
    try:
        response = requests.get(url, params=params)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            total = data.get("total", 0)
            items = data.get("items", [])
            
            print(f"✓ Success - Found {total} results")
            print(f"Items returned: {len(items)}")
            
            if items:
                print("\nFirst 5 products:")
                for i, item in enumerate(items[:5], 1):
                    name = item.get("name", "N/A")
                    category = item.get("category", "N/A")
                    series = item.get("series") or item.get("catalog_source", {}).get("product_family", "N/A")
                    print(f"  {i}. {name}")
                    print(f"     Category: {category}, Series: {series}")
            else:
                print("\n❌ No products returned!")
                print(f"Response: {json.dumps(data, indent=2, default=str)}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Test with quotes (the problematic case)
    test_search('"12 module plate engem"')
    
    # Test without quotes (should work)
    test_search("12 module plate engem")
    
    # Test simple query
    test_search("plate engem")

