"""
Script to analyze MongoDB products collection and generate a comprehensive schema.

This script:
1. Connects to MongoDB and queries all products
2. Analyzes all fields (top-level and nested)
3. Identifies all possible values for each field, especially specs
4. Generates a comprehensive schema JSON file
5. Creates a detailed report of field statistics
"""

import asyncio
import json
import logging
import os
import sys
from collections import defaultdict, Counter
from pathlib import Path
from pathlib import Path as PathLib
from typing import Any, Dict, List, Set, Union

# Add backend directory to path to import app modules
backend_dir = PathLib(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

# Change to backend directory so .env file can be found
original_cwd = PathLib.cwd()
backend_path = backend_dir
os.chdir(backend_path)

try:
    from app.config import settings
    from app.db import get_client, get_db
finally:
    # Restore original working directory
    os.chdir(original_cwd)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def flatten_dict(d: Dict, parent_key: str = "", sep: str = ".") -> Dict:
    """Flatten a nested dictionary."""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        elif isinstance(v, list):
            # Handle lists - store as array type
            items.append((new_key, {"type": "array", "sample": v[:3] if len(v) > 3 else v}))
        else:
            items.append((new_key, v))
    return dict(items)


def get_field_type(value: Any) -> str:
    """Get the type of a field value."""
    if value is None:
        return "null"
    elif isinstance(value, bool):
        return "boolean"
    elif isinstance(value, int):
        return "integer"
    elif isinstance(value, float):
        return "number"
    elif isinstance(value, str):
        return "string"
    elif isinstance(value, list):
        return "array"
    elif isinstance(value, dict):
        return "object"
    else:
        return str(type(value).__name__)


def analyze_field(field_name: str, values: List[Any], max_unique_values: int = 50) -> Dict:
    """Analyze a field and return its schema information."""
    if not values:
        return {"type": "unknown", "count": 0, "null_count": 0}
    
    # Count occurrences
    non_null_values = [v for v in values if v is not None]
    null_count = len(values) - len(non_null_values)
    
    if not non_null_values:
        return {
            "type": "null",
            "count": len(values),
            "null_count": null_count,
            "null_percentage": 100.0
        }
    
    # Determine types
    types = Counter([get_field_type(v) for v in non_null_values])
    primary_type = types.most_common(1)[0][0]
    
    result = {
        "type": primary_type,
        "count": len(values),
        "null_count": null_count,
        "null_percentage": round((null_count / len(values)) * 100, 2),
        "type_distribution": dict(types),
    }
    
    # For string fields, collect unique values
    if primary_type == "string":
        unique_values = list(set([str(v) for v in non_null_values if v is not None]))
        result["unique_count"] = len(unique_values)
        if len(unique_values) <= max_unique_values:
            result["unique_values"] = sorted(unique_values)
        else:
            result["unique_values"] = sorted(unique_values)[:max_unique_values]
            result["unique_values_sample"] = f"... and {len(unique_values) - max_unique_values} more"
    
    # For numeric fields, calculate statistics
    elif primary_type in ["integer", "number"]:
        numeric_values = [v for v in non_null_values if isinstance(v, (int, float))]
        if numeric_values:
            result["min"] = min(numeric_values)
            result["max"] = max(numeric_values)
            result["unique_count"] = len(set(numeric_values))
            if len(set(numeric_values)) <= max_unique_values:
                result["unique_values"] = sorted(set(numeric_values))
    
    # For boolean fields
    elif primary_type == "boolean":
        true_count = sum(1 for v in non_null_values if v is True)
        false_count = sum(1 for v in non_null_values if v is False)
        result["true_count"] = true_count
        result["false_count"] = false_count
    
    # For array fields
    elif primary_type == "array":
        array_lengths = [len(v) for v in non_null_values if isinstance(v, list)]
        if array_lengths:
            result["min_length"] = min(array_lengths)
            result["max_length"] = max(array_lengths)
            result["avg_length"] = round(sum(array_lengths) / len(array_lengths), 2)
        # Sample array contents
        sample_arrays = [v for v in non_null_values[:5] if isinstance(v, list)]
        result["sample_arrays"] = sample_arrays
    
    # For object fields, we'll analyze nested structure separately
    elif primary_type == "object":
        result["is_nested"] = True
    
    return result


async def analyze_all_products(db, collection_name: str = "products") -> Dict[str, Any]:
    """Analyze all products in the collection and generate schema."""
    print("Starting schema analysis...", flush=True)
    logger.info("Starting schema analysis...")
    
    collection = db[collection_name]
    
    # Get total count
    total_count = await collection.count_documents({})
    print(f"Total products in collection: {total_count}", flush=True)
    logger.info(f"Total products in collection: {total_count}")
    
    if total_count == 0:
        logger.warning("No products found in collection!")
        return {}
    
    # Collect all field values
    field_values: Dict[str, List[Any]] = defaultdict(list)
    nested_objects: Dict[str, List[Dict]] = defaultdict(list)
    
    # Process products in batches
    batch_size = 1000
    processed = 0
    
    cursor = collection.find({})
    async for doc in cursor:
        processed += 1
        
        # Remove _id for analysis (we'll add it separately)
        doc_id = doc.pop("_id", None)
        
        # Flatten the document to get all fields
        flattened = flatten_dict(doc)
        
        # Collect all field values
        for field_path, value in flattened.items():
            # Handle special case for arrays in flattened dict
            if isinstance(value, dict) and "type" in value and value["type"] == "array":
                field_values[field_path].append(value["sample"])
            else:
                field_values[field_path].append(value)
        
        # Also collect nested objects for deeper analysis
        for key, value in doc.items():
            if isinstance(value, dict):
                nested_objects[key].append(value)
        
        if processed % 1000 == 0:
            print(f"Processed {processed}/{total_count} products...", flush=True)
            logger.info(f"Processed {processed}/{total_count} products...")
    
    print(f"Finished processing {processed} products", flush=True)
    print(f"Found {len(field_values)} unique field paths", flush=True)
    logger.info(f"Finished processing {processed} products")
    logger.info(f"Found {len(field_values)} unique field paths")
    
    # Analyze each field
    schema: Dict[str, Any] = {
        "collection_name": collection_name,
        "total_products": total_count,
        "total_fields": len(field_values),
        "fields": {}
    }
    
    logger.info("Analyzing fields...")
    for field_path, values in sorted(field_values.items()):
        logger.debug(f"Analyzing field: {field_path}")
        schema["fields"][field_path] = analyze_field(field_path, values)
    
    # Analyze nested objects separately
    logger.info("Analyzing nested objects...")
    nested_schemas = {}
    for obj_key, objects in nested_objects.items():
        if not objects:
            continue
        
        logger.info(f"Analyzing nested object: {obj_key}")
        nested_field_values: Dict[str, List[Any]] = defaultdict(list)
        
        for obj in objects:
            flattened_obj = flatten_dict(obj)
            for nested_field, nested_value in flattened_obj.items():
                nested_field_path = f"{obj_key}.{nested_field}"
                if isinstance(nested_value, dict) and "type" in nested_value and nested_value["type"] == "array":
                    nested_field_values[nested_field_path].append(nested_value["sample"])
                else:
                    nested_field_values[nested_field_path].append(nested_value)
        
        # Analyze nested fields
        nested_schemas[obj_key] = {}
        for nested_field_path, nested_values in sorted(nested_field_values.items()):
            nested_schemas[obj_key][nested_field_path] = analyze_field(nested_field_path, nested_values)
    
    schema["nested_objects"] = nested_schemas
    
    # Special analysis for specs field (most important)
    logger.info("Performing special analysis for 'specs' field...")
    specs_analysis = await analyze_specs_field(db, collection_name)
    schema["specs_analysis"] = specs_analysis
    
    return schema


async def analyze_specs_field(db, collection_name: str = "products") -> Dict[str, Any]:
    """Perform detailed analysis of the specs field."""
    collection = db[collection_name]
    
    specs_fields: Dict[str, List[Any]] = defaultdict(list)
    specs_types: Counter = Counter()
    
    cursor = collection.find({"specs": {"$exists": True}})
    async for doc in cursor:
        specs = doc.get("specs", {})
        if isinstance(specs, dict):
            # Track which spec fields exist
            for key, value in specs.items():
                specs_fields[key].append(value)
    
    # Analyze each spec field
    specs_schema = {}
    for field_name, values in sorted(specs_fields.items()):
        specs_schema[field_name] = analyze_field(field_name, values, max_unique_values=100)
    
    # Count products with/without specs
    total_with_specs = await collection.count_documents({"specs": {"$exists": True}})
    total_without_specs = await collection.count_documents({"specs": {"$exists": False}})
    
    return {
        "total_products_with_specs": total_with_specs,
        "total_products_without_specs": total_without_specs,
        "spec_fields": specs_schema,
        "field_frequency": {k: len(v) for k, v in sorted(specs_fields.items(), key=lambda x: len(x[1]), reverse=True)}
    }


async def generate_summary_report(schema: Dict[str, Any], output_dir: PathLib) -> None:
    """Generate a human-readable summary report."""
    report_file = output_dir / "schema_analysis_report.txt"
    
    with open(report_file, "w", encoding="utf-8") as f:
        f.write("=" * 80 + "\n")
        f.write("MongoDB Products Collection Schema Analysis Report\n")
        f.write("=" * 80 + "\n\n")
        
        f.write(f"Collection: {schema.get('collection_name', 'products')}\n")
        f.write(f"Total Products: {schema.get('total_products', 0):,}\n")
        f.write(f"Total Fields: {schema.get('total_fields', 0)}\n\n")
        
        # Top-level fields summary
        f.write("-" * 80 + "\n")
        f.write("TOP-LEVEL FIELDS SUMMARY\n")
        f.write("-" * 80 + "\n\n")
        
        fields = schema.get("fields", {})
        for field_path in sorted(fields.keys()):
            field_info = fields[field_path]
            f.write(f"{field_path}:\n")
            f.write(f"  Type: {field_info.get('type', 'unknown')}\n")
            f.write(f"  Count: {field_info.get('count', 0):,} ({100 - field_info.get('null_percentage', 0):.1f}% populated)\n")
            
            if field_info.get('type') == 'string' and 'unique_values' in field_info:
                unique_count = field_info.get('unique_count', 0)
                f.write(f"  Unique Values: {unique_count}\n")
                if unique_count <= 20:
                    f.write(f"  Values: {', '.join(str(v) for v in field_info['unique_values'][:20])}\n")
            
            f.write("\n")
        
        # Specs analysis
        if "specs_analysis" in schema:
            f.write("-" * 80 + "\n")
            f.write("SPECS FIELD DETAILED ANALYSIS\n")
            f.write("-" * 80 + "\n\n")
            
            specs_analysis = schema["specs_analysis"]
            f.write(f"Products with specs: {specs_analysis.get('total_products_with_specs', 0):,}\n")
            f.write(f"Products without specs: {specs_analysis.get('total_products_without_specs', 0):,}\n\n")
            
            f.write("Spec Fields (sorted by frequency):\n")
            field_freq = specs_analysis.get("field_frequency", {})
            for field_name, count in sorted(field_freq.items(), key=lambda x: x[1], reverse=True):
                field_info = specs_analysis.get("spec_fields", {}).get(field_name, {})
                f.write(f"\n  {field_name}:\n")
                f.write(f"    Frequency: {count:,} products ({count/specs_analysis.get('total_products_with_specs', 1)*100:.1f}%)\n")
                f.write(f"    Type: {field_info.get('type', 'unknown')}\n")
                
                if field_info.get('type') == 'string' and 'unique_values' in field_info:
                    unique_vals = field_info.get('unique_values', [])
                    f.write(f"    Unique Values ({len(unique_vals)}):\n")
                    for val in unique_vals[:30]:  # Show first 30
                        f.write(f"      - {val}\n")
                    if len(unique_vals) > 30:
                        f.write(f"      ... and {len(unique_vals) - 30} more\n")
                
                elif field_info.get('type') in ['integer', 'number']:
                    if 'min' in field_info and 'max' in field_info:
                        f.write(f"    Range: {field_info['min']} - {field_info['max']}\n")
                    if 'unique_values' in field_info:
                        unique_vals = field_info['unique_values']
                        f.write(f"    Unique Values ({len(unique_vals)}): {', '.join(str(v) for v in unique_vals[:20])}\n")
                        if len(unique_vals) > 20:
                            f.write(f"      ... and {len(unique_vals) - 20} more\n")
                
                elif field_info.get('type') == 'boolean':
                    f.write(f"    True: {field_info.get('true_count', 0)}, False: {field_info.get('false_count', 0)}\n")
        
        f.write("\n" + "=" * 80 + "\n")
        f.write("End of Report\n")
        f.write("=" * 80 + "\n")
    
    logger.info(f"Summary report saved to: {report_file}")


async def main():
    """Main function to analyze MongoDB schema."""
    logger.info("=" * 80)
    logger.info("MongoDB Schema Analysis")
    logger.info("=" * 80)
    
    # Create output directory
    output_dir = PathLib(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    
    # Connect to MongoDB
    print("\nConnecting to MongoDB...", flush=True)
    print(f"MongoDB URI: {settings.MONGODB_URI}", flush=True)
    print(f"Database: {settings.MONGODB_DB_NAME}", flush=True)
    logger.info("Connecting to MongoDB...")
    logger.info(f"MongoDB URI: {settings.MONGODB_URI}")
    logger.info(f"Database: {settings.MONGODB_DB_NAME}")
    
    client = get_client()
    db = get_db()
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✓ Connected to MongoDB successfully\n", flush=True)
        logger.info("✓ Connected to MongoDB successfully\n")
        
        # Analyze schema
        schema = await analyze_all_products(db, "products")
        
        if not schema:
            logger.error("No schema data generated!")
            return
        
        # Save schema to JSON
        schema_file = output_dir / "mongodb_schema.json"
        with open(schema_file, "w", encoding="utf-8") as f:
            json.dump(schema, f, indent=2, ensure_ascii=False, default=str)
        print(f"\n✓ Schema saved to: {schema_file}", flush=True)
        logger.info(f"\n✓ Schema saved to: {schema_file}")
        
        # Generate summary report
        await generate_summary_report(schema, output_dir)
        
        # Print summary
        print("\n" + "=" * 80, flush=True)
        print("ANALYSIS SUMMARY", flush=True)
        print("=" * 80, flush=True)
        print(f"Total Products: {schema.get('total_products', 0):,}", flush=True)
        print(f"Total Fields: {schema.get('total_fields', 0)}", flush=True)
        logger.info("\n" + "=" * 80)
        logger.info("ANALYSIS SUMMARY")
        logger.info("=" * 80)
        logger.info(f"Total Products: {schema.get('total_products', 0):,}")
        logger.info(f"Total Fields: {schema.get('total_fields', 0)}")
        
        if "specs_analysis" in schema:
            specs = schema["specs_analysis"]
            logger.info(f"\nSpecs Analysis:")
            logger.info(f"  Products with specs: {specs.get('total_products_with_specs', 0):,}")
            logger.info(f"  Spec fields found: {len(specs.get('spec_fields', {}))}")
            
            field_freq = specs.get("field_frequency", {})
            logger.info(f"\n  Top 10 most common spec fields:")
            for i, (field, count) in enumerate(list(sorted(field_freq.items(), key=lambda x: x[1], reverse=True))[:10], 1):
                logger.info(f"    {i}. {field}: {count:,} products")
        
        logger.info("=" * 80)
        logger.info(f"\nFull schema JSON: {schema_file}")
        logger.info(f"Summary report: {output_dir / 'schema_analysis_report.txt'}")
        
    except Exception as e:
        print(f"\n✗ Error during analysis: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        logger.error(f"Error during analysis: {str(e)}", exc_info=True)
    finally:
        # Close MongoDB connection
        client.close()
        print("\n✓ MongoDB connection closed", flush=True)
        logger.info("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())
