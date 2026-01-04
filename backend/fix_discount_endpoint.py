"""
Script to fix the update_product endpoint to handle discount updates
"""
import re

file_path = "app/routes/products.py"

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the function signature
old_signature = r'async def update_product\(\s+product_id: str,\s+payload: ProductUpdate,'
new_signature = 'async def update_product(\n    product_id: str,\n    request: Request,'

content = re.sub(old_signature, new_signature, content)

# Find and replace the function body
old_body = r'\) -> Any:\s+update = \{k: v for k, v in payload\.model_dump\(exclude_unset=True\)\.items\(\)\}\s+if not update:\s+raise HTTPException\(status_code=status\.HTTP_400_BAD_REQUEST, detail="No fields to update"\)\s+\s+\s+try:\s+query_id = ObjectId\(product_id\)\s+except InvalidId:\s+query_id = product_id\s+res = await db\.products\.find_one_and_update\(\s+\{"_id": query_id\},\s+\{"\$set": update\},\s+return_document=True,\s+\)'

new_body = ''') -> Any:
    import logging
    import json
    logger = logging.getLogger(__name__)
    
    # Get raw request body as JSON
    try:
        body_bytes = await request.body()
        raw_body = json.loads(body_bytes) if body_bytes else {}
    except Exception as e:
        print(f"ERROR parsing request body: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON in request body")
    
    print(f"\\n{'='*70}")
    print(f"UPDATE PRODUCT - ID: {product_id}, Body: {raw_body}")
    
    # Check if discount was in the raw body FIRST
    if not isinstance(raw_body, dict):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request body must be a JSON object")
    
    discount_was_provided = "discount" in raw_body
    discount_value = raw_body.get("discount") if discount_was_provided else None
    print(f"Discount provided: {discount_was_provided}, value: {discount_value}")
    
    # Validate with Pydantic
    try:
        payload = ProductUpdate(**raw_body)
    except Exception as e:
        print(f"Validation error: {e}")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    
    # Get all fields (excluding discount)
    payload_dict = payload.model_dump(exclude_unset=True)
    update = {k: v for k, v in payload_dict.items() if k != "discount"}
    
    # Handle discount field
    unset_fields = {}
    if discount_was_provided:
        if discount_value is None:
            unset_fields["catalog_source.pricing.discount"] = ""
            print("Unsetting discount")
        else:
            update["catalog_source.pricing.discount"] = discount_value
            print(f"Setting discount to: {discount_value}")
    elif "discount" in payload_dict:
        update["catalog_source.pricing.discount"] = payload_dict["discount"]
    
    print(f"Update: {update}, Unset: {unset_fields}")
    print(f"{'='*70}\\n")
    
    if not update and not unset_fields:
        print(f"ERROR: No fields to update")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    

    
    try:
        query_id = ObjectId(product_id)
    except InvalidId:
        query_id = product_id

    # Build update operation
    update_op = {}
    if update:
        update_op["$set"] = update
    if unset_fields:
        update_op["$unset"] = unset_fields

    res = await db.products.find_one_and_update(
        {"_id": query_id},
        update_op,
        return_document=True,
    )'''

content = re.sub(old_body, new_body, content, flags=re.DOTALL)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed update_product endpoint!")

