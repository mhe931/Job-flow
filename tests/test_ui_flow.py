"""
JobFlow AI - UI Verification Test Script
Tests the redesigned login page and resume ingestion flow
"""

from playwright.sync_api import sync_playwright, expect
import time

def test_login_page_redesign():
    """Test 1: Verify login page redesign with Liquid Glass aesthetic"""
    print("\n=== TEST 1: Login Page Redesign ===")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        page = browser.new_page()
        
        try:
            # Navigate to app
            print("✓ Navigating to http://localhost:8501...")
            page.goto("http://localhost:8501", wait_until="networkidle")
            time.sleep(2)
            
            # Verify hero section
            print("✓ Checking hero section...")
            hero_text = page.locator("text=JobFlow AI").first
            assert hero_text.is_visible(), "Hero title not found"
            
            subtitle = page.locator("text=Career Discovery Engine").first
            assert subtitle.is_visible(), "Subtitle not found"
            
            # Verify Google AI Studio link
            print("✓ Checking Google AI Studio link...")
            api_link = page.locator('a[href*="aistudio.google.com"]')
            assert api_link.is_visible(), "Google AI Studio link not found"
            assert "Get API Key" in api_link.text_content(), "Link text incorrect"
            
            # Verify feature highlights
            print("✓ Checking feature highlights...")
            ai_powered = page.locator("text=AI-Powered").first
            strategic_matrix = page.locator("text=Strategic Matrix").first
            salary_intel = page.locator("text=Salary Intel").first
            
            assert ai_powered.is_visible(), "AI-Powered feature not found"
            assert strategic_matrix.is_visible(), "Strategic Matrix feature not found"
            assert salary_intel.is_visible(), "Salary Intel feature not found"
            
            # Verify More Features expander
            print("✓ Checking More Features expander...")
            more_features = page.locator("text=More Features").first
            assert more_features.is_visible(), "More Features expander not found"
            
            print("\n✅ TEST 1 PASSED: Login page redesign verified")
            
        except Exception as e:
            print(f"\n❌ TEST 1 FAILED: {e}")
            raise
        finally:
            browser.close()


def test_resume_ingestion_flow():
    """Test 2: Verify resume ingestion with checkbox and button fixes"""
    print("\n=== TEST 2: Resume Ingestion Flow ===")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        page = browser.new_page()
        
        try:
            # Navigate and login
            print("✓ Logging in...")
            page.goto("http://localhost:8501", wait_until="networkidle")
            time.sleep(2)
            
            # Fill login form
            email_input = page.locator('input[placeholder*="email"]').first
            email_input.fill("test@example.com")
            
            api_key_input = page.locator('input[type="password"]').first
            api_key_input.fill("test-api-key-12345")
            
            # Submit form
            start_button = page.locator('button:has-text("Start Discovery")').first
            start_button.click()
            
            time.sleep(3)
            
            # Verify resume ingestion page
            print("✓ Checking resume ingestion page...")
            ingestion_title = page.locator("text=Resume Ingestion").first
            assert ingestion_title.is_visible(), "Resume Ingestion page not loaded"
            
            # Verify tabs
            print("✓ Checking tabs...")
            fast_paste_tab = page.locator("text=Fast Paste").first
            cloud_sync_tab = page.locator("text=Cloud Sync").first
            local_asset_tab = page.locator("text=Local Asset").first
            
            assert fast_paste_tab.is_visible(), "Fast Paste tab not found"
            assert cloud_sync_tab.is_visible(), "Cloud Sync tab not found"
            assert local_asset_tab.is_visible(), "Local Asset tab not found"
            
            # Test text input
            print("✓ Testing text input...")
            fast_paste_tab.click()
            time.sleep(1)
            
            resume_text = """
            John Doe
            Senior Software Engineer
            
            EXPERIENCE:
            - 8 years of experience in Python, JavaScript, React, and AWS
            - Led teams of 5+ developers
            - Expert in microservices architecture and cloud infrastructure
            - Built scalable systems handling 1M+ requests per day
            
            SKILLS:
            Python, JavaScript, React, AWS, Docker, Kubernetes, PostgreSQL
            """
            
            text_area = page.locator('textarea[placeholder*="Paste your resume"]').first
            text_area.fill(resume_text)
            
            process_button = page.locator('button:has-text("Process Text")').first
            process_button.click()
            
            time.sleep(2)
            
            # Verify verification step appears
            print("✓ Checking verification step...")
            verification_title = page.locator("text=Verification Step").first
            assert verification_title.is_visible(), "Verification step not shown"
            
            # Test checkbox toggle
            print("✓ Testing checkbox toggle...")
            show_full_checkbox = page.locator('input[type="checkbox"]').first
            
            # Check initial state
            is_checked_before = show_full_checkbox.is_checked()
            print(f"  Checkbox initial state: {is_checked_before}")
            
            # Toggle ON
            show_full_checkbox.check()
            time.sleep(1)
            is_checked_after = show_full_checkbox.is_checked()
            print(f"  Checkbox after check: {is_checked_after}")
            assert is_checked_after == True, "Checkbox did not toggle ON"
            
            # Verify full text area appears
            full_text_area = page.locator('textarea[key="full_text"]').first
            assert full_text_area.is_visible(), "Full text area did not appear"
            
            # Toggle OFF
            show_full_checkbox.uncheck()
            time.sleep(1)
            is_checked_final = show_full_checkbox.is_checked()
            print(f"  Checkbox after uncheck: {is_checked_final}")
            assert is_checked_final == False, "Checkbox did not toggle OFF"
            
            # Test Edit Text button
            print("✓ Testing Edit Text button...")
            edit_button = page.locator('button:has-text("Edit Text")').first
            edit_button.click()
            time.sleep(2)
            
            # Verify page reloaded (tabs should be visible again)
            fast_paste_tab_after = page.locator("text=Fast Paste").first
            assert fast_paste_tab_after.is_visible(), "Edit Text button did not trigger rerun"
            
            # Re-enter text for next test
            text_area_2 = page.locator('textarea[placeholder*="Paste your resume"]').first
            text_area_2.fill(resume_text)
            process_button_2 = page.locator('button:has-text("Process Text")').first
            process_button_2.click()
            time.sleep(2)
            
            # Test Discard & Restart button
            print("✓ Testing Discard & Restart button...")
            discard_button = page.locator('button:has-text("Discard")').first
            discard_button.click()
            time.sleep(2)
            
            # Verify state cleared (verification step should not be visible)
            verification_after_discard = page.locator("text=Verification Step").first
            assert not verification_after_discard.is_visible(), "Discard button did not clear state"
            
            print("\n✅ TEST 2 PASSED: Resume ingestion flow verified")
            
        except Exception as e:
            print(f"\n❌ TEST 2 FAILED: {e}")
            raise
        finally:
            browser.close()


def test_url_fetch_flow():
    """Test 3: Verify URL fetch functionality"""
    print("\n=== TEST 3: URL Fetch Flow ===")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        page = browser.new_page()
        
        try:
            # Navigate and login
            print("✓ Logging in...")
            page.goto("http://localhost:8501", wait_until="networkidle")
            time.sleep(2)
            
            email_input = page.locator('input[placeholder*="email"]').first
            email_input.fill("test@example.com")
            
            api_key_input = page.locator('input[type="password"]').first
            api_key_input.fill("test-api-key-12345")
            
            start_button = page.locator('button:has-text("Start Discovery")').first
            start_button.click()
            time.sleep(3)
            
            # Click Cloud Sync tab
            print("✓ Testing Cloud Sync tab...")
            cloud_sync_tab = page.locator("text=Cloud Sync").first
            cloud_sync_tab.click()
            time.sleep(1)
            
            # Verify URL input field
            url_input = page.locator('input[placeholder*="https://"]').first
            assert url_input.is_visible(), "URL input field not found"
            
            # Verify Fetch button
            fetch_button = page.locator('button:has-text("Fetch from URL")').first
            assert fetch_button.is_visible(), "Fetch from URL button not found"
            
            print("\n✅ TEST 3 PASSED: URL fetch UI verified")
            
        except Exception as e:
            print(f"\n❌ TEST 3 FAILED: {e}")
            raise
        finally:
            browser.close()


if __name__ == "__main__":
    print("\n" + "="*60)
    print("JobFlow AI - UI Verification Test Suite")
    print("="*60)
    
    try:
        test_login_page_redesign()
        test_resume_ingestion_flow()
        test_url_fetch_flow()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED")
        print("="*60)
        
    except Exception as e:
        print("\n" + "="*60)
        print(f"❌ TEST SUITE FAILED: {e}")
        print("="*60)
        raise
