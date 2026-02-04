from datetime import datetime, timedelta
from typing import Any, Dict
import logging

import cloudinary
import cloudinary.uploader
import cloudinary.utils

from .config import settings

logger = logging.getLogger(__name__)

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

class CloudinaryService:
    """Service for managing Cloudinary uploads and deletions"""
    
    def __init__(
        self,
        cloud_name: str | None = None,
        api_key: str | None = None,
        api_secret: str | None = None
    ):
        self.cloud_name = cloud_name or settings.CLOUDINARY_CLOUD_NAME
        self.api_key = api_key or settings.CLOUDINARY_API_KEY
        self.api_secret = api_secret or settings.CLOUDINARY_API_SECRET
        
        if self.cloud_name and self.api_key and self.api_secret:
            cloudinary.config(
                cloud_name=self.cloud_name,
                api_key=self.api_key,
                api_secret=self.api_secret,
                secure=True
            )
    
    def _is_configured(self) -> bool:
        """Check if Cloudinary is properly configured"""
        return all([self.cloud_name, self.api_key, self.api_secret])
    
    async def upload_image(
        self,
        file_bytes: bytes,
        folder: str = "products",
        public_id: str | None = None
    ) -> Dict[str, Any]:
        """
        Upload image to Cloudinary and return URL and metadata.
        
        Args:
            file_bytes: Image file bytes
            folder: Cloudinary folder to upload to
            public_id: Optional public ID for the image
        
        Returns:
            Dictionary with url, public_id, width, height
        
        Raises:
            RuntimeError: If Cloudinary is not configured
            Exception: If upload fails
        """
        if not self._is_configured():
            raise RuntimeError("Cloudinary is not configured")
        
        try:
            upload_options: Dict[str, Any] = {
                "folder": folder,
                "resource_type": "image"
            }
            
            if public_id:
                upload_options["public_id"] = public_id
                upload_options["overwrite"] = True
            
            result = cloudinary.uploader.upload(file_bytes, **upload_options)
            
            return {
                "url": result.get("secure_url") or result.get("url"),
                "public_id": result.get("public_id"),
                "width": result.get("width"),
                "height": result.get("height")
            }
        except Exception as e:
            logger.error(f"Failed to upload image to Cloudinary: {e}", exc_info=True)
            raise
    
    async def delete_image(self, public_id: str) -> bool:
        """
        Delete image from Cloudinary.
        
        Args:
            public_id: Cloudinary public ID of the image to delete
        
        Returns:
            True if deletion was successful, False otherwise
        """
        if not self._is_configured():
            logger.warning("Cloudinary not configured. Skipping image deletion.")
            return False
        
        try:
            result = cloudinary.uploader.destroy(public_id)
            success = result.get("result") == "ok"
            
            if success:
                logger.info(f"Successfully deleted image: {public_id}")
            else:
                logger.warning(f"Failed to delete image: {public_id}, result: {result}")
            
            return success
        except Exception as e:
            logger.error(f"Error deleting image {public_id}: {e}", exc_info=True)
            return False

# Global cloudinary service instance
cloudinary_service = CloudinaryService()

# Legacy functions for backward compatibility
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

