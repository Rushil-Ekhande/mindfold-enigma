-- ============================================================================
-- Migration: Add is_active and display_order to landing_page_sections
-- ============================================================================

-- Add is_active column (default true so existing sections remain visible)
ALTER TABLE landing_page_sections 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add display_order column
ALTER TABLE landing_page_sections 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update display_order for existing sections
UPDATE landing_page_sections SET display_order = 1 WHERE section_name = 'hero';
UPDATE landing_page_sections SET display_order = 2 WHERE section_name = 'features';
UPDATE landing_page_sections SET display_order = 3 WHERE section_name = 'how_to_use';
UPDATE landing_page_sections SET display_order = 4 WHERE section_name = 'reviews';
UPDATE landing_page_sections SET display_order = 5 WHERE section_name = 'pricing';
UPDATE landing_page_sections SET display_order = 6 WHERE section_name = 'footer';
