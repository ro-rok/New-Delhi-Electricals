"""
PDF catalog extraction package.

This module provides a reusable pipeline to transform vendor PDF catalogs
into a hierarchical JSON structure suitable for the admin portal:

  Category -> Subcategory -> Items -> Variants + Images
"""


