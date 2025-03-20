import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  TextField,
  Typography,
  Alert,
  AlertTitle,
  FormControlLabel,
  Checkbox,
  IconButton,
  Link,
} from '@mui/material';
import TwitterIcon from '@mui/icons-material/Twitter';
import ApiService from '../services/api';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';

const LoginPage = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isAlreadyLoggedIn, setIsAlreadyLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [nextPage, setNextPage] = useState('/dashboard');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Check login status on component mount
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // Determine the next page in the setup flow
  const determineNextPage = async () => {
    try {
      const { data } = await ApiService.getAppStatus();
      
      if (data.success) {
        console.log("App status for redirect:", data.status);
        
        // Always redirect to target accounts first after login
        return '/target-accounts';
      }
      
      // Default to target accounts page
      return '/target-accounts';
    } catch (error) {
      console.error('Error determining next page:', error);
      // Default to target accounts page on error
      return '/target-accounts';
    }
  };

  const checkLoginStatus = async () => {
    try {
      setIsCheckingStatus(true);
      const { data } = await ApiService.auth.getStatus();
      
      if (data.isLoggedIn) {
        // Already logged in, determine where to redirect
        const redirectPage = await determineNextPage();
        setNextPage(redirectPage);
        
        // Show redirecting message before navigating
        setIsAlreadyLoggedIn(true);
        setUsername(data.username || 'user');
        
        // Add a slight delay for the user to see the message
        setTimeout(() => {
          navigate(redirectPage);
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Handle form submission
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    
    // Don't submit if loading or terms not agreed to
    if (isLoading || !agreedToTerms) {
      return;
    }
    
    handleLogin();
  };

  // Handle credential changes
  const handleCredentialChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    setLoginAttempts(prev => prev + 1);

    try {
      const { data } = await ApiService.auth.login(credentials);
      
      if (data.success) {
        // Determine the next page in the setup flow
        const redirectPage = await determineNextPage();
        navigate(redirectPage);
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide more helpful error messages
      if (error.response?.status === 401) {
        setError('X/Twitter rejected these credentials. Please check your username and password.');
      } else if (error.response?.status === 403) {
        setError('X/Twitter may require additional verification. Please try again later or log in to X/Twitter directly first.');
      } else if (error.response?.status === 500) {
        setError('Server error during login. Please try again in a few moments.');
      } else {
        setError(error.response?.data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus || isAlreadyLoggedIn) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Card sx={{ 
          bgcolor: 'background.paper', 
          borderRadius: 4,
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          transform: 'translateY(0px)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 12px 50px rgba(0, 0, 0, 0.12)',
          }
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              mb: 4
            }}>
              <TwitterIcon 
                color="primary" 
                sx={{ 
                  fontSize: 56, 
                  mb: 2,
                  p: 1.5,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 113, 227, 0.08)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1) rotate(10deg)',
                  }
                }} 
              />
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #0071e3, #42a5f5)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Login to X/Twitter
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                align="center"
                sx={{ maxWidth: '80%', mb: 2 }}
              >
                Enter your X/Twitter credentials to start scraping and posting tweets
              </Typography>
            </Box>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  animation: 'fadeIn 0.3s ease-out'
                }}
              >
                {error}
              </Alert>
            )}

            {isAlreadyLoggedIn ? (
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  animation: 'fadeIn 0.3s ease',
                  p: 2
                }}
              >
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2 
                  }}
                >
                  <AlertTitle>Already logged in</AlertTitle>
                  You are already logged in as <strong>{username}</strong>
                </Alert>
                {isCheckingStatus && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress size={30} thickness={4} />
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Redirecting to {nextPage === '/dashboard' ? 'Dashboard' : 'Target Accounts'}...
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={() => navigate(nextPage)}
                  sx={{ 
                    borderRadius: 2,
                    py: 1.5,
                    fontWeight: 500,
                    boxShadow: '0 2px 10px rgba(0, 113, 227, 0.3)',
                    '&:hover': {
                      boxShadow: '0 4px 15px rgba(0, 113, 227, 0.4)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Go to {nextPage === '/dashboard' ? 'Dashboard' : 'Target Accounts'}
                </Button>
              </Box>
            ) : (
              <Box 
                component="form" 
                onSubmit={handleLoginSubmit}
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 2.5,
                  animation: 'fadeIn 0.3s ease-out'
                }}
              >
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={credentials.username}
                  onChange={handleCredentialChange}
                  InputProps={{
                    sx: { 
                      borderRadius: 2,
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 3px rgba(0, 113, 227, 0.15)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { 
                      fontSize: '0.9rem',
                      transform: 'translate(14px, 14px) scale(1)',
                      '&.MuiInputLabel-shrink': {
                        transform: 'translate(14px, -9px) scale(0.75)'
                      }
                    }
                  }}
                  variant="outlined"
                  required
                  disabled={isLoading}
                  sx={{ mb: 0.5 }}
                />
                
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={handleCredentialChange}
                  required
                  disabled={isLoading}
                  InputProps={{
                    sx: { 
                      borderRadius: 2,
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 3px rgba(0, 113, 227, 0.15)'
                      }
                    },
                    endAdornment: (
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="large"
                        sx={{ 
                          color: 'text.secondary',
                          transition: 'color 0.2s ease',
                          '&:hover': {
                            color: 'primary.main'
                          }
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }}
                  InputLabelProps={{
                    sx: { 
                      fontSize: '0.9rem',
                      transform: 'translate(14px, 14px) scale(1)',
                      '&.MuiInputLabel-shrink': {
                        transform: 'translate(14px, -9px) scale(0.75)'
                      }
                    }
                  }}
                  variant="outlined"
                  sx={{ mb: 0.5 }}
                />
                
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={credentials.email}
                  onChange={handleCredentialChange}
                  required
                  disabled={isLoading}
                  InputProps={{
                    sx: { 
                      borderRadius: 2,
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 3px rgba(0, 113, 227, 0.15)'
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { 
                      fontSize: '0.9rem',
                      transform: 'translate(14px, 14px) scale(1)',
                      '&.MuiInputLabel-shrink': {
                        transform: 'translate(14px, -9px) scale(0.75)'
                      }
                    }
                  }}
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      color="primary"
                      sx={{
                        color: 'rgba(0, 0, 0, 0.3)',
                        '&.Mui-checked': {
                          color: 'primary.main'
                        },
                        padding: '4px'
                      }}
                    />
                  }
                  label={
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary', 
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      I agree to the{' '}
                      <Link 
                        href="/terms" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        sx={{ 
                          color: 'primary.main',
                          textDecoration: 'none',
                          fontWeight: 500,
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link 
                        href="/privacy" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        sx={{ 
                          color: 'primary.main',
                          textDecoration: 'none',
                          fontWeight: 500,
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        Privacy Policy
                      </Link>
                    </Typography>
                  }
                  sx={{ 
                    mt: 1,
                    mb: 2,
                    alignItems: 'center',
                    marginLeft: '-5px'
                  }}
                />
                
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    backgroundColor: 'rgba(46, 125, 50, 0.08)',
                    border: '1px solid rgba(46, 125, 50, 0.12)'
                  }}
                  icon={<InfoIcon style={{ color: '#2e7d32' }} />}
                >
                  <AlertTitle sx={{ fontWeight: 600, color: '#2e7d32' }}>Security Notice</AlertTitle>
                  Your credentials are used only for authentication with X/Twitter on your local computer and are not stored or sent to any developer or server.
                </Alert>
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={isLoading || !agreedToTerms}
                  sx={{ 
                    mt: 1, 
                    mb: 2, 
                    py: 1.5, 
                    borderRadius: 2,
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    boxShadow: '0 2px 10px rgba(0, 113, 227, 0.3)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: '0 4px 15px rgba(0, 113, 227, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    '&:active': {
                      transform: 'translateY(0)',
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
                    },
                    ...(isLoading && {
                      '&::after': {
                        display: 'none'
                      }
                    })
                  }}
                >
                  {isLoading ? (
                    <CircularProgress 
                      size={24} 
                      thickness={5} 
                      sx={{ 
                        color: 'white'
                      }} 
                    />
                  ) : (
                    'Login to X/Twitter'
                  )}
                </Button>
              </Box>
            )}
            
            {loginAttempts > 0 && !isAlreadyLoggedIn && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                align="center" 
                sx={{ 
                  mt: 2,
                  fontStyle: 'italic',
                  animation: 'fadeIn 0.3s ease'
                }}
              >
                Login attempts: {loginAttempts}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card sx={{ 
        bgcolor: 'background.paper', 
        borderRadius: 4,
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        transform: 'translateY(0px)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 12px 50px rgba(0, 0, 0, 0.12)',
        }
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4
          }}>
            <TwitterIcon 
              color="primary" 
              sx={{ 
                fontSize: 56, 
                mb: 2,
                p: 1.5,
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 113, 227, 0.08)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1) rotate(10deg)',
                }
              }} 
            />
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                background: 'linear-gradient(45deg, #0071e3, #42a5f5)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Login to X/Twitter
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              align="center"
              sx={{ maxWidth: '80%', mb: 2 }}
            >
              Enter your X/Twitter credentials to start scraping and posting tweets
            </Typography>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                animation: 'fadeIn 0.3s ease-out'
              }}
            >
              {error}
            </Alert>
          )}

          {isAlreadyLoggedIn ? (
            <Box 
              sx={{ 
                textAlign: 'center', 
                animation: 'fadeIn 0.3s ease',
                p: 2
              }}
            >
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2 
                }}
              >
                <AlertTitle>Already logged in</AlertTitle>
                You are already logged in as <strong>{username}</strong>
              </Alert>
              {isCheckingStatus && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress size={30} thickness={4} />
                </Box>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Redirecting to {nextPage === '/dashboard' ? 'Dashboard' : 'Target Accounts'}...
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth
                onClick={() => navigate(nextPage)}
                sx={{ 
                  borderRadius: 2,
                  py: 1.5,
                  fontWeight: 500,
                  boxShadow: '0 2px 10px rgba(0, 113, 227, 0.3)',
                  '&:hover': {
                    boxShadow: '0 4px 15px rgba(0, 113, 227, 0.4)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Go to {nextPage === '/dashboard' ? 'Dashboard' : 'Target Accounts'}
              </Button>
            </Box>
          ) : (
            <Box 
              component="form" 
              onSubmit={handleLoginSubmit}
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 2.5,
                animation: 'fadeIn 0.3s ease-out'
              }}
            >
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={credentials.username}
                onChange={handleCredentialChange}
                InputProps={{
                  sx: { 
                    borderRadius: 2,
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(0, 113, 227, 0.15)'
                    }
                  }
                }}
                InputLabelProps={{
                  sx: { 
                    fontSize: '0.9rem',
                    transform: 'translate(14px, 14px) scale(1)',
                    '&.MuiInputLabel-shrink': {
                      transform: 'translate(14px, -9px) scale(0.75)'
                    }
                  }
                }}
                variant="outlined"
                required
                disabled={isLoading}
                sx={{ mb: 0.5 }}
              />
              
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={handleCredentialChange}
                required
                disabled={isLoading}
                InputProps={{
                  sx: { 
                    borderRadius: 2,
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(0, 113, 227, 0.15)'
                    }
                  },
                  endAdornment: (
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="large"
                      sx={{ 
                        color: 'text.secondary',
                        transition: 'color 0.2s ease',
                        '&:hover': {
                          color: 'primary.main'
                        }
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
                InputLabelProps={{
                  sx: { 
                    fontSize: '0.9rem',
                    transform: 'translate(14px, 14px) scale(1)',
                    '&.MuiInputLabel-shrink': {
                      transform: 'translate(14px, -9px) scale(0.75)'
                    }
                  }
                }}
                variant="outlined"
                sx={{ mb: 0.5 }}
              />
              
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={credentials.email}
                onChange={handleCredentialChange}
                required
                disabled={isLoading}
                InputProps={{
                  sx: { 
                    borderRadius: 2,
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(0, 113, 227, 0.15)'
                    }
                  }
                }}
                InputLabelProps={{
                  sx: { 
                    fontSize: '0.9rem',
                    transform: 'translate(14px, 14px) scale(1)',
                    '&.MuiInputLabel-shrink': {
                      transform: 'translate(14px, -9px) scale(0.75)'
                    }
                  }
                }}
                variant="outlined"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    color="primary"
                    sx={{
                      color: 'rgba(0, 0, 0, 0.3)',
                      '&.Mui-checked': {
                        color: 'primary.main'
                      },
                      padding: '4px'
                    }}
                  />
                }
                label={
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary', 
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                  >
                    I agree to the{' '}
                    <Link 
                      href="/terms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ 
                        color: 'primary.main',
                        textDecoration: 'none',
                        fontWeight: 500,
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link 
                      href="/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      sx={{ 
                        color: 'primary.main',
                        textDecoration: 'none',
                        fontWeight: 500,
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      Privacy Policy
                    </Link>
                  </Typography>
                }
                sx={{ 
                  mt: 1,
                  mb: 2,
                  alignItems: 'center',
                  marginLeft: '-5px'
                }}
              />
              
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: 'rgba(46, 125, 50, 0.08)',
                  border: '1px solid rgba(46, 125, 50, 0.12)'
                }}
                icon={<InfoIcon style={{ color: '#2e7d32' }} />}
              >
                <AlertTitle sx={{ fontWeight: 600, color: '#2e7d32' }}>Security Notice</AlertTitle>
                Your credentials are used only for authentication with X/Twitter on your local computer and are not stored or sent to any developer or server.
              </Alert>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={isLoading || !agreedToTerms}
                sx={{ 
                  mt: 1, 
                  mb: 2, 
                  py: 1.5, 
                  borderRadius: 2,
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  boxShadow: '0 2px 10px rgba(0, 113, 227, 0.3)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: '0 4px 15px rgba(0, 113, 227, 0.4)',
                    transform: 'translateY(-2px)'
                  },
                  '&:active': {
                    transform: 'translateY(0)',
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
                  },
                  ...(isLoading && {
                    '&::after': {
                      display: 'none'
                    }
                  })
                }}
              >
                {isLoading ? (
                  <CircularProgress 
                    size={24} 
                    thickness={5} 
                    sx={{ 
                      color: 'white'
                    }} 
                  />
                ) : (
                  'Login to X/Twitter'
                )}
              </Button>
            </Box>
          )}
          
          {loginAttempts > 0 && !isAlreadyLoggedIn && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              align="center" 
              sx={{ 
                mt: 2,
                fontStyle: 'italic',
                animation: 'fadeIn 0.3s ease'
              }}
            >
              Login attempts: {loginAttempts}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default LoginPage; 