// Method to clear all processed links
clearProcessedLinks = async () => {
  try {
    await this.db.run('DELETE FROM processed_links');
    return { success: true, message: 'All processed links have been cleared' };
  } catch (error) {
    console.error('Error clearing processed links:', error);
    return { success: false, message: 'Failed to clear processed links', error: error.message };
  }
} 