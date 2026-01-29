import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine import get_best_model

class TestBYOK(unittest.TestCase):
    @patch('engine.genai.Client')
    def test_get_best_model_priority(self, mock_client_cls):
        # Setup mock
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        
        # Mock models list
        model1 = MagicMock()
        model1.name = 'models/gemini-1.5-pro'
        model1.supported_generation_methods = ['generateContent']
        
        model2 = MagicMock()
        model2.name = 'models/gemini-1.5-flash'
        model2.supported_generation_methods = ['generateContent']
        
        mock_client.models.list.return_value = [model2, model1]
        
        # Test
        best_model = get_best_model("fake_key")
        
        # Assert 'pro' is selected over 'flash'
        self.assertEqual(best_model, 'gemini-1.5-pro')

if __name__ == '__main__':
    unittest.main()
