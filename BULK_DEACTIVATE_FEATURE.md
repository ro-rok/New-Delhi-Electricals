# Bulk Deactivate Feature

## Overview
Replaced the "Coming Soon" feature with a "Deactivate Family" feature in the Plates Bulk Image Modal. This allows administrators to quickly hide entire product families from the website.

## Changes Made

### Frontend Changes

#### 1. Product API (`frontend/src/api/products.ts`)
- Added `isActive` field to `Product` interface and transformation logic
- Updated `updateProduct` to handle `isActive` updates (maps to `status.is_active` in backend)

#### 2. Plates Bulk Image Modal (`frontend/src/components/admin/PlatesBulkImageModal.tsx`)
- **Removed "Mark as Coming Soon" button**
- **Added "Deactivate" button**
- Button appears alongside "Apply Image to All" button
- Styled in red to indicate a destructive/negative action
- Allows bulk deactivation of entire plate color families
- Includes confirmation dialog

## How to Use

### For Administrators:

1. **Navigate to Admin Portal** → Products
2. **Find a Plates product**
3. **Click the three dots menu** → **Bulk Assign Images**
4. **Select a product family/color** from the list
5. **Click "Deactivate"** button (red button)
6. **Confirm** the action

The selected plate color family will now be deactivated (`is_active: false`) and hidden from the public website.

### Technical Details

- **Frontend**: Sends `isActive: false` in the update payload.
- **Backend**: Updates `status.is_active` to `false` in MongoDB.
