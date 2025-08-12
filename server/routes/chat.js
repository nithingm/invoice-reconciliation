const express = require('express');
const router = express.Router();

// POST /api/chat/message
router.post('/message', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // TODO: Implement REST API processing
    // For now, return a simple response directing users to the main interface
    const response = {
      message: 'Please use the main chat interface for AI-powered assistance.',
      type: 'info'
    };

    res.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Note: The REST API route is currently not being used
// The main system uses Socket.io for real-time communication
// If needed, this route can be implemented to call the same processAIQuery function








// GET /api/chat/history (for future implementation)
router.get('/history/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // In a real implementation, fetch chat history from database
    const history = [];
    
    res.json({ history });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
