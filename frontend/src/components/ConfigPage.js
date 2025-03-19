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
    tweetText: '',
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
        setConfig({
          delays: {
            min: data.config.delays.minDelay || '',
            max: data.config.delays.maxDelay || '',
          },
          tweetText: data.config.tweetText || '',
          tweetsPerAccount: data.config.tweetsPerAccount || 10,
        });
      } else {
        setError(data.error || 'Failed to fetch configuration');
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
      setError(error.response?.data?.error || 'Failed to fetch configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const checkTargetAccounts = async () => {
    try {
      const { data } = await ApiService.config.getTargetAccounts();
      if (!data.success || data.accounts.length === 0) {
        navigate('/target-accounts');
      }
    } catch (error) {
      console.error('Error checking target accounts:', error);
      navigate('/target-accounts');
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

  const handleTweetTextChange = (event) => {
    setConfig({ ...config, tweetText: event.target.value });
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

      const minDelay = parseFloat(config.delays.min);
      const maxDelay = parseFloat(config.delays.max);

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

      const textResponse = await ApiService.config.setTweetText(config.tweetText);
      if (!textResponse.data.success) throw new Error('Failed to save tweet text');

      const tweetsPerAccountResponse = await ApiService.config.setTweetsPerAccount(config.tweetsPerAccount);
      if (!tweetsPerAccountResponse.data.success) throw new Error('Failed to save tweets per account');

      setSuccessMessage('Configuration saved successfully');
      setTimeout(() => navigate('/dashboard'), 1500);
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
                  Configure Scraper
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
                    Tweet Text
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 3, lineHeight: 1.5 }}
                  >
                    This text will be posted to X/Twitter alongside screenshots of scraped tweets. Add hashtags or mentions as needed.
                  </Typography>
                  <TextField
                    fullWidth
                    label="Tweet Text"
                    value={config.tweetText}
                    onChange={handleTweetTextChange}
                    disabled={isSaving}
                    multiline
                    rows={3}
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
                      },
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: config.tweetText.length > 250 ? 'error.main' : 'text.secondary',
                              fontWeight: 500
                            }}
                          >
                            {config.tweetText.length}/280
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                    helperText="This text will be posted alongside screenshots of the tweets you're sharing"
                  />
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

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSaveConfig} 
                    disabled={isSaving}
                    sx={{ 
                      py: 1.5, 
                      px: 4, 
                      borderRadius: 2,
                      fontWeight: 500,
                      boxShadow: '0 2px 10px rgba(0, 113, 227, 0.3)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        boxShadow: '0 4px 15px rgba(0, 113, 227, 0.4)',
                        transform: 'translateY(-2px)'
                      },
                      '&:active': {
                        transform: 'translateY(0px)',
                        boxShadow: '0 2px 5px rgba(0, 113, 227, 0.2)'
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 70%)',
                        transition: 'all 0.6s ease',
                        transform: 'translateX(-100%)'
                      },
                      '&:hover::after': {
                        transform: 'translateX(100%)'
                      }
                    }}
                  >
                    {isSaving ? (
                      <CircularProgress size={24} thickness={5} sx={{ color: 'white' }} />
                    ) : (
                      'Save Configuration'
                    )}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ConfigPage;
