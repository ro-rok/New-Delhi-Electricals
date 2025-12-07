from datetime import datetime, timedelta
from typing import Any, Dict

import cloudinary
import cloudinary.uploader
import cloudinary.utils

from .config import settings


def _ensure_config() -> None:
    if not (
        settings.CLOUDINARY_CLOUD_NAME
        and settings.CLOUDINARY_API_KEY
        and settings.CLOUDINARY_API_SECRET
    ):
        raise RuntimeError("Cloudinary environment variables are not fully configured")
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


def upload_pdf_bytes(pdf_bytes: bytes, public_id: str) -> Dict[str, Any]:
    """Server-side upload for raw PDF catalog files."""
    _ensure_config()
    result = cloudinary.uploader.upload(
        pdf_bytes,
        resource_type="raw",
        public_id=public_id,
        format="pdf",
        overwrite=True,
    )
    return result


def upload_image_bytes(
    image_bytes: bytes, public_id: str, folder: str | None = None
) -> Dict[str, Any]:
    """Server-side upload for images extracted from PDFs."""
    _ensure_config()
    upload_options: Dict[str, Any] = {
        "public_id": public_id,
        "overwrite": True,
    }
    if folder:
        upload_options["folder"] = folder
    result = cloudinary.uploader.upload(image_bytes, **upload_options)
    return result


def generate_signed_upload_params(
    folder: str = "catalog-products",
    allow_types: str = "image",
) -> Dict[str, Any]:
    """
    Generate a signed upload payload for direct browser uploads.

    The frontend should POST to Cloudinary's upload API with these fields plus the file.
    
    Note: For resource_type="image" (default), Cloudinary does not include it in the signature.
    Only timestamp and folder are signed for image uploads.
    
    The timestamp must be the CURRENT time - Cloudinary will reject requests where the 
    timestamp is more than 1 hour old.
    """
    _ensure_config()
    # Generate current timestamp (not future time)
    # Cloudinary validates that the timestamp is within 1 hour of the current time
    # Use time.time() which returns UTC timestamp directly
    # datetime.utcnow().timestamp() is incorrect because it treats the naive UTC time as local time
    import time
    timestamp = int(time.time())
    
    # For image uploads, Cloudinary only signs timestamp and folder
    # resource_type is not included in the signature when it's "image"
    params = {
        "timestamp": timestamp,
        "folder": folder,
    }
    # Only include resource_type in signature if it's not "image"
    if allow_types != "image":
        params["resource_type"] = allow_types
    
    signature = cloudinary.utils.api_sign_request(
        params_to_sign=params,
        api_secret=settings.CLOUDINARY_API_SECRET,  # type: ignore[arg-type]
    )
    return {
        "cloudName": settings.CLOUDINARY_CLOUD_NAME,
        "apiKey": settings.CLOUDINARY_API_KEY,
        "timestamp": timestamp,
        "folder": folder,
        "resourceType": allow_types,
        "signature": signature,
    }




