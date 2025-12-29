"""
Test the endpoint directly with detailed error checking.
"""

import requests
import json

def test_endpoint():
    url = "http://localhost:8000/api/products"
    params = {"q": "12 module plate engem", "page": 1, "pageSize": 20}
    
    print("Testing endpoint...")
    print(f"URL: {url}")
    print(f"Params: {params}\n")
    
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}\n")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            print(f"Total: {data.get('total')}")
            print(f"Items: {len(data.get('items', []))}")
            
            if data.get('total') == 0:
                print("\n⚠️  Still getting 0 results!")
                print("This could mean:")
                print("1. Server hasn't reloaded the changes (restart needed)")
                print("2. Search engine is throwing an exception and falling back")
                print("3. Fallback search is also returning 0 results")
                print("\nCheck the backend console logs for:")
                print("- 🔍 SEARCH ENGINE messages")
                print("- ❌ Error messages")
                print("- ✅ SEARCH RESULTS messages")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_endpoint()

