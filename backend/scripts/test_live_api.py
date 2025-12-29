"""
Test the live API endpoint to see what's happening.
"""

import requests
import json
import sys

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
        response = requests.get(url, params=params, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            total = data.get("total", 0)
            items = data.get("items", [])
            
            print(f"\n{'='*70}")
            print(f"RESULTS")
            print(f"{'='*70}")
            print(f"Total products found: {total}")
            print(f"Items returned: {len(items)}")
            
            if items:
                print(f"\nFirst 5 products:")
                for i, item in enumerate(items[:5], 1):
                    name = item.get("name", "N/A")
                    category = item.get("category", "N/A")
                    brand = item.get("brand", "N/A")
                    series = item.get("series") or item.get("catalog_source", {}).get("product_family", "N/A")
                    print(f"  {i}. {name}")
                    print(f"     Category: {category}, Brand: {brand}, Series: {series}")
            else:
                print(f"\n❌ No products returned!")
                print(f"\nFull response:")
                print(json.dumps(data, indent=2, default=str))
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to {API_BASE}")
        print(f"   Make sure the backend server is running on port 8000")
        return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    print("\n" + "="*70)
    print("LIVE API SEARCH TEST")
    print("="*70)
    print("\n⚠️  Make sure the backend server is running!")
    print("   Check backend console for detailed search logs.\n")
    
    # Test the problematic query
    success = test_search("12 module plate engem")
    
    if not success:
        print("\n❌ API test failed - check if server is running")
        sys.exit(1)

