import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import ApiService from '../services/api';

const ConfigPage = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    delays: { min: '', max: '' },
    tweetsPerAccount: 10,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    checkTargetAccounts();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const { data } = await ApiService.config.getConfig();
      if (data.success) {
        // Convert milliseconds to seconds for display with consistent formatting
        const minDelayInSeconds = data.config.delays.minDelay ? (data.config.delays.minDelay / 1000).toString() : '';
        const maxDelayInSeconds = data.config.delays.maxDelay ? (data.config.delays.maxDelay / 1000).toString() : '';
        
        setConfig({
          delays: {
            min: minDelayInSeconds,
            max: maxDelayInSeconds,
          },
          tweetsPerAccount: data.config.tweetsPerAccount || 10,
        });
      } else {
        setError(data.error || 'Failed to fetch configuration');
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
      setError('Failed to fetch configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const checkTargetAccounts = async () => {
    try {
      const { data } = await ApiService.config.getTargetAccounts();
      if (!data.success || (data.accounts.length === 0 && window.location.pathname !== '/config')) {
        navigate('/target-accounts');
      }
    } catch (error) {
      console.error('Error checking target accounts:', error);
      if (window.location.pathname !== '/config') {
        navigate('/target-accounts');
      }
    }
  };

  const handleDelayChange = (event, field) => {
    const value = event.target.value;
    // Allow only numbers (including decimals)
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setConfig({
        ...config,
        delays: {
          ...config.delays,
          [field]: value,
        },
      });
    }
  };

  const handleTweetsPerAccountChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 50) {
      setConfig({ ...config, tweetsPerAccount: value });
    }
  };

  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');

      const minDelay = parseFloat(config.delays.min) * 1000;
      const maxDelay = parseFloat(config.delays.max) * 1000;

      if (isNaN(minDelay) || isNaN(maxDelay) || minDelay < 0 || maxDelay < 0) {
        setError('Delays must be positive numbers');
        setIsSaving(false);
        return;
      }

      if (minDelay >= maxDelay) {
        setError('Maximum delay must be greater than minimum delay');
        setIsSaving(false);
        return;
      }

      const delaysResponse = await ApiService.config.setDelays({
        min: minDelay,
        max: maxDelay,
      });

      if (!delaysResponse.data.success) throw new Error('Failed to save delay settings');

      const tweetsPerAccountResponse = await ApiService.config.setTweetsPerAccount(config.tweetsPerAccount);
      if (!tweetsPerAccountResponse.data.success) throw new Error('Failed to save tweets per account');

      setSuccessMessage('Configuration saved successfully');
      setTimeout(() => navigate('/openai-config'), 1500);
    } catch (error) {
      setError(error.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Container sx={{ 
        mt: 6, 
        textAlign: 'center',
        animation: 'fadeIn 0.4s ease-out'
      }}>
        <CircularProgress thickness={4} size={40} />
        <Typography variant="h6" sx={{ mt: 3, fontWeight: 500, color: 'text.secondary' }}>
          Loading configuration...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 6, mb: 6, animation: 'fadeIn 0.4s ease-out' }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4, 
            borderRadius: 3,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 4, 
            borderRadius: 3,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          {successMessage}
        </Alert>
      )}

      <Box sx={{ 
        mb: 5, 
        display: 'flex', 
        alignItems: 'center',
        pb: 3,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <IconButton 
          onClick={() => navigate('/dashboard')} 
          sx={{ 
            mr: 2,
            backgroundColor: 'background.paper',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            borderRadius: 2,
            p: 1,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateX(-3px)',
              backgroundColor: 'rgba(0, 113, 227, 0.08)'
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography 
          variant="h4"
          sx={{ 
            fontWeight: 600,
            backgroundImage: 'linear-gradient(45deg, #0071e3, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textFillColor: 'transparent'
          }}
        >
          Configuration
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)'
              }
            }}
          >
            <CardHeader 
              title={
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Configure Scraper and Post Delay
                </Typography>
              }
              sx={{ 
                borderBottom: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                py: 2
              }}
            />
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={5}>
                <Box>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 1
                    }}
                  >
                    Tweet Processing Delays
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 3, lineHeight: 1.5 }}
                  >
                    Set the minimum and maximum delay (in seconds) between posting scraped tweets to your X/Twitter account.
                  </Typography>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Minimum Delay (s)"
                        value={config.delays.min}
                        onChange={(e) => handleDelayChange(e, 'min')}
                        disabled={isSaving}
                        InputLabelProps={{ 
                          shrink: true,
                          sx: { 
                            fontSize: '0.9rem',
                            transform: 'translate(14px, -9px) scale(0.75)'
                          }
                        }}
                        InputProps={{
                          sx: { 
                            borderRadius: 2,
                            '&.Mui-focused': {
                              boxShadow: '0 0 0 3px rgba(0, 113, 227, 0.15)'
                            }
                          }
                        }}
                        helperText="Recommended: 200-300 s"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Maximum Delay (s)"
                        value={config.delays.max}
                        onChange={(e) => handleDelayChange(e, 'max')}
                        disabled={isSaving}
                        InputLabelProps={{ 
                          shrink: true,
                          sx: { 
                            fontSize: '0.9rem',
                            transform: 'translate(14px, -9px) scale(0.75)'
                          }
                        }}
                        InputProps={{
                          sx: { 
                            borderRadius: 2,
                            '&.Mui-focused': {
                              boxShadow: '0 0 0 3px rgba(0, 113, 227, 0.15)'
                            }
                          }
                        }}
                        helperText="Recommended: 300-400 s"
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Box>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 1
                    }}
                  >
                    Tweets Per Account
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 3, lineHeight: 1.5 }}
                  >
                    Set how many tweets to scrape from each account (1-50).
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    label="Tweets Per Account"
                    value={config.tweetsPerAccount}
                    onChange={handleTweetsPerAccountChange}
                    disabled={isSaving}
                    inputProps={{ min: 1, max: 50 }}
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { 
                        fontSize: '0.9rem',
                        transform: 'translate(14px, -9px) scale(0.75)'
                      }
                    }}
                    InputProps={{
                      sx: { 
                        borderRadius: 2,
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 3px rgba(0, 113, 227, 0.15)'
                        }
                      }
                    }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/target-accounts')}
        >
          Back to Target Accounts
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => navigate('/dashboard')}
          sx={{ 
            borderRadius: 2,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
            }
          }}
        >
          Skip to Dashboard
        </Button>
        
        <Box display="flex" alignItems="center">
          {successMessage && (
            <Alert severity="success" sx={{ mr: 2 }}>
              {successMessage}
            </Alert>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveConfig}
            disabled={isLoading || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save and Continue'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ConfigPage;
