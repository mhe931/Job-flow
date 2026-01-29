
import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine import get_best_model

class TestHandshake(unittest.TestCase):
    @patch('engine.genai.Client')
    def test_discover_best_model_2026(self, mock_client_cls):
        """Verify that 2026-era models are prioritized correctly."""
        # Setup mock client
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        
        # Mock available models response from API
        # Scenario: User has access to the latest 3.0 flash model
        model1 = MagicMock()
        model1.name = 'models/gemini-3-flash'
        model1.supported_generation_methods = ['generateContent']
        
        model2 = MagicMock()
        model2.name = 'models/gemini-1.5-pro'
        model2.supported_generation_methods = ['generateContent']
        
        mock_client.models.list.return_value = [model2, model1]
        
        # Execute discovery
        best_model = get_best_model("fake_valid_key")
        
        # Assert precedence: 3-flash > 1.5-pro
        self.assertEqual(best_model, 'gemini-3-flash')
        print(f"\n[Test] Authenticated & Discovered Model: {best_model}")

    @patch('engine.genai.Client')
    def test_fallback_logic(self, mock_client_cls):
        """Verify fallback to any available gemini model if priority list fails."""
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        
        # Scenario: Only an obscure version is available
        model1 = MagicMock()
        model1.name = 'models/gemini-1.0-ultra-legacy'
        model1.supported_generation_methods = ['generateContent']
        
        mock_client.models.list.return_value = [model1]
        
        best_model = get_best_model("fake_legacy_key")
        
        # Should pick the only available one despite not being in priority list
        self.assertEqual(best_model, 'gemini-1.0-ultra-legacy')
        print(f"\n[Test] Fallback Model Selected: {best_model}")

if __name__ == '__main__':
    unittest.main()
