// Clear all processed links
router.post('/clear-processed-links', async (req, res) => {
  try {
    const result = await scraperService.clearProcessedLinks();
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in clear-processed-links route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear processed links',
      error: error.message 
    });
  }
});

module.exports = router; 