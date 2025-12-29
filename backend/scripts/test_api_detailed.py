"""
Detailed API test to see what's happening with search.
"""

import requests
import json
import sys

def test_search_detailed(query, port=8000):
    """Test search API endpoint with detailed output."""
    url = f"http://localhost:{port}/api/products"
    params = {"q": query, "page": 1, "pageSize": 20}
    
    print(f"\n{'='*70}")
    print(f"Testing API: GET {url}")
    print(f"Query: {query}")
    print(f"Params: {params}")
    print(f"{'='*70}\n")
    
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}\n")
        
        if response.status_code == 200:
            data = response.json()
            total = data.get("total", 0)
            items = data.get("items", [])
            
            print(f"{'='*70}")
            print(f"RESULTS")
            print(f"{'='*70}")
            print(f"Total products found: {total}")
            print(f"Items returned: {len(items)}")
            
            if items:
                print(f"\n✅ SUCCESS! Found {len(items)} products")
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
                print(f"\nFull response JSON:")
                print(json.dumps(data, indent=2, default=str))
                
                # Check if there's any error info in the response
                if "error" in data:
                    print(f"\n⚠️  Error in response: {data['error']}")
                if "message" in data:
                    print(f"\n⚠️  Message in response: {data['message']}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to http://localhost:{port}")
        print(f"   Make sure the backend server is running on port {port}")
        return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    print("\n" + "="*70)
    print("DETAILED API SEARCH TEST")
    print("="*70)
    print("\n⚠️  Make sure the backend server is running!")
    print("   Check backend console for detailed search logs.\n")
    
    # Test on both ports
    for port in [8000, 8080]:
        print(f"\n{'#'*70}")
        print(f"Testing port {port}")
        print(f"{'#'*70}")
        success = test_search_detailed("12 module plate engem", port=port)
        if success:
            break
    
    if not success:
        print("\n❌ API test failed on all ports")
        print("   Please check:")
        print("   1. Is the backend server running?")
        print("   2. Check the backend console for error logs")
        print("   3. Look for search engine error messages")
        sys.exit(1)

