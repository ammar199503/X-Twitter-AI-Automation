import React, { useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { 
  Twitter as TwitterIcon, 
  GitHub as GitHubIcon, 
  Facebook as FacebookIcon 
} from '@mui/icons-material';
import InstagramIcon from '@mui/icons-material/Instagram';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

// Import our components
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import TargetAccountsPage from './components/TargetAccountsPage';
import ConfigPage from './components/ConfigPage';
import OpenAIConfigPage from './components/OpenAIConfigPage';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';

function App() {
  // Create a theme with dark mode as the only option
  const theme = useMemo(() => {
    // Common color values
    const colors = {
      purple: {
        main: '#5D3FD3',
        light: '#7F69DB',
        dark: '#4A2DA9',
      },
      red: {
        main: '#FF5757',
        light: '#FF7A7A',
        dark: '#E03E3E',
      },
      blue: {
        main: '#00c2ff',
        light: '#67D6FF',
        dark: '#00A2D6',
      },
      green: {
        main: '#00D084',
        light: '#33E5A9',
        dark: '#00A868',
      },
      orange: {
        main: '#FF9F43',
        light: '#FFB76B',
        dark: '#F5820D',
      }
    };

    return createTheme({
      palette: {
        mode: 'dark',
        primary: {
          main: '#6E3DD3',
          dark: '#5932AB',
          light: '#8C62E6',
          contrastText: '#FFFFFF',
        },
        secondary: {
          main: colors.red.main,
          light: colors.red.light,
          dark: colors.red.dark,
          contrastText: '#ffffff',
        },
        info: {
          main: colors.blue.main,
          light: colors.blue.light,
          dark: colors.blue.dark,
        },
        success: {
          main: colors.green.main,
          light: colors.green.light,
          dark: colors.green.dark,
        },
        warning: {
          main: colors.orange.main,
          light: colors.orange.light,
          dark: colors.orange.dark,
        },
        error: {
          main: colors.red.main,
          light: colors.red.light,
          dark: colors.red.dark,
        },
        background: {
          default: '#121212',
          paper: '#1E1E2F',
        },
        text: {
          primary: '#E0E0F0',
          secondary: '#A0A0C0',
        },
        divider: 'rgba(153, 123, 255, 0.12)',
      },
      typography: {
        fontFamily: '"Inter", "Roboto Flex", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        h1: {
          fontWeight: 700,
          letterSpacing: '-0.02em',
        },
        h2: {
          fontWeight: 700,
          letterSpacing: '-0.01em',
        },
        h3: {
          fontWeight: 600,
        },
        h4: {
          fontWeight: 600,
        },
        h5: {
          fontWeight: 600,
        },
        h6: {
          fontWeight: 600,
        },
        button: {
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: '0.02em',
        },
      },
      shape: {
        borderRadius: 12,
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
              borderRadius: 0,
              background: 'linear-gradient(90deg, #4A2E9D 0%, #571D8A 100%)',
              zIndex: 1200,
            },
          },
        },
        MuiToolbar: {
          styleOverrides: {
            root: {
              justifyContent: 'center',
              position: 'relative',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              padding: '10px 20px',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease-in-out',
              boxShadow: 'none',
            },
            contained: {
              background: 'linear-gradient(90deg, #4A2DA9, #6F59CB)',
              boxShadow: '0 4px 14px rgba(93, 63, 211, 0.15)',
              '&:hover': {
                background: 'linear-gradient(90deg, #5D3FD3, #7F69DB)',
                boxShadow: '0 6px 20px rgba(93, 63, 211, 0.25)',
                transform: 'translateY(-2px)',
              },
            },
            containedSecondary: {
              background: 'linear-gradient(90deg, #E03E3E, #FF6B6B)',
              boxShadow: '0 4px 14px rgba(255, 87, 87, 0.15)',
              '&:hover': {
                background: 'linear-gradient(90deg, #FF5757, #FF7A7A)',
                boxShadow: '0 6px 20px rgba(255, 87, 87, 0.25)',
                transform: 'translateY(-2px)',
              },
            },
            outlined: {
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-2px)',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              overflow: 'hidden',
              borderRadius: 20,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.3s ease-in-out',
              border: '1px solid rgba(93, 63, 211, 0.15)',
              backgroundColor: '#1E1E2F',
              '&:hover': {
                boxShadow: '0 15px 40px rgba(93, 63, 211, 0.2)',
                transform: 'translateY(-5px)',
              },
            },
          },
        },
        MuiCardHeader: {
          styleOverrides: {
            root: {
              padding: '20px 24px',
            },
            title: {
              fontSize: '1.25rem',
              fontWeight: 600,
            },
            subheader: {
              color: '#A0A0C0',
            },
          },
        },
        MuiCardContent: {
          styleOverrides: {
            root: {
              padding: '24px',
              '&:last-child': {
                paddingBottom: '24px',
              },
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 12,
                transition: 'all 0.3s ease-in-out',
                '&.Mui-focused': {
                  boxShadow: '0 0 0 4px rgba(93, 63, 211, 0.3)',
                },
                '&:hover': {
                  borderColor: 'rgba(93, 63, 211, 0.7)',
                },
              },
              '& .MuiInputLabel-root': {
                transition: 'all 0.3s ease-in-out',
                '&.Mui-focused': {
                  color: '#5D3FD3',
                },
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 20,
            },
            elevation1: {
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            },
            elevation2: {
              boxShadow: '0 6px 25px rgba(0, 0, 0, 0.25)',
            },
          },
        },
        MuiTableContainer: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(93, 63, 211, 0.15)',
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 10,
              fontWeight: 500,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              },
            },
            colorPrimary: {
              background: 'linear-gradient(135deg, #5D3FD3, #7F69DB)',
            },
            colorSecondary: {
              background: 'linear-gradient(135deg, #FF5757, #FF7A7A)',
            },
          },
        },
        MuiAlert: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
            },
            standardSuccess: {
              backgroundColor: alpha('#00D084', 0.2),
              color: '#33E5A9',
            },
            standardError: {
              backgroundColor: alpha('#FF5757', 0.2),
              color: '#FF7A7A',
            },
            standardWarning: {
              backgroundColor: alpha('#FF9F43', 0.2),
              color: '#FFB76B',
            },
            standardInfo: {
              backgroundColor: alpha('#00c2ff', 0.2),
              color: '#67D6FF',
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: 24,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              background: 'rgba(30, 30, 47, 0.95)',
              backdropFilter: 'blur(10px)',
            },
          },
        },
        MuiDivider: {
          styleOverrides: {
            root: {
              borderColor: 'rgba(153, 123, 255, 0.12)',
            },
          },
        },
        MuiListItem: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(93, 63, 211, 0.15)',
              },
            },
          },
        },
        MuiSwitch: {
          styleOverrides: {
            root: {
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#5D3FD3',
                '&:hover': {
                  backgroundColor: alpha('#5D3FD3', 0.08),
                },
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#5D3FD3',
              },
            },
          },
        },
      },
    });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Multicolored Lens Flare Background */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: -1,
          backgroundColor: '#0D0D1A',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-10%',
            left: '-5%',
            width: '50%',
            height: '50%',
            background: 'radial-gradient(circle, rgba(93, 63, 211, 0.4) 0%, rgba(93, 63, 211, 0) 70%)',
            filter: 'blur(30px)',
            animation: 'pulse 15s infinite alternate',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-15%',
            right: '-5%',
            width: '60%',
            height: '60%',
            background: 'radial-gradient(circle, rgba(255, 87, 87, 0.3) 0%, rgba(255, 87, 87, 0) 70%)',
            filter: 'blur(40px)',
            animation: 'pulse 18s infinite alternate-reverse',
          },
          '@keyframes pulse': {
            '0%': {
              opacity: 0.6,
              transform: 'scale(1)',
            },
            '100%': {
              opacity: 1,
              transform: 'scale(1.2)',
            },
          },
          '@keyframes float': {
            '0%': {
              transform: 'translateY(0px)',
            },
            '50%': {
              transform: 'translateY(-20px)',
            },
            '100%': {
              transform: 'translateY(0px)',
            },
          },
        }}
      >
        {/* Additional lens flares with different colors */}
        <Box sx={{
          position: 'absolute',
          top: '20%',
          left: '25%',
          width: '35%',
          height: '35%',
          background: 'radial-gradient(circle, rgba(0, 194, 255, 0.35) 0%, rgba(0, 194, 255, 0) 70%)',
          filter: 'blur(35px)',
          animation: 'pulse 12s infinite alternate',
        }} />
        
        <Box sx={{
          position: 'absolute',
          top: '60%',
          left: '15%',
          width: '30%',
          height: '30%',
          background: 'radial-gradient(circle, rgba(255, 159, 67, 0.35) 0%, rgba(255, 159, 67, 0) 70%)',
          filter: 'blur(30px)',
          animation: 'pulse 20s infinite alternate-reverse',
        }} />
        
        <Box sx={{
          position: 'absolute',
          top: '10%',
          right: '15%',
          width: '25%',
          height: '25%',
          background: 'radial-gradient(circle, rgba(0, 208, 132, 0.3) 0%, rgba(0, 208, 132, 0) 70%)',
          filter: 'blur(25px)',
          animation: 'pulse 17s infinite alternate',
        }} />
        
        <Box sx={{
          position: 'absolute',
          top: '70%',
          right: '25%',
          width: '40%',
          height: '40%',
          background: 'radial-gradient(circle, rgba(155, 89, 182, 0.4) 0%, rgba(155, 89, 182, 0) 75%)',
          filter: 'blur(40px)',
          animation: 'pulse 14s infinite alternate-reverse',
        }} />
        
        {/* Center light beam */}
        <Box sx={{
          position: 'absolute',
          top: '45%',
          left: '45%',
          width: '10%',
          height: '10%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 80%)',
          filter: 'blur(15px)',
          animation: 'float 6s ease-in-out infinite',
        }} />
        
        {/* Lens flare overlay effect */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'linear-gradient(135deg, transparent 0%, rgba(13, 13, 26, 0.3) 50%, transparent 100%)',
          pointerEvents: 'none',
        }} />
      </Box>
      
      <Router>
        <AppBar 
          position="sticky" 
          sx={{ 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}
        >
          <Toolbar>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              width: '100%'
            }}>
              {/* Left side - Empty space */}
              <Box />
              
              {/* App Title - Center */}
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  whiteSpace: 'nowrap',
                  textAlign: 'center'
                }}
              >
                Twitter AI Automation
              </Typography>
              
              {/* Social Media Icons - Right */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 1
              }}>
                <Tooltip title="Twitter/X">
                  <IconButton 
                    component="a" 
                    href="https://x.com/AmmarMalik0" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{
                      color: 'white',
                      '&:hover': { 
                        color: '#1DA1F2',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    size="small"
                  >
                    <TwitterIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="GitHub">
                  <IconButton 
                    component="a" 
                    href="https://github.com/ammar199503" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{
                      color: 'white',
                      '&:hover': { 
                        color: '#6e5494',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    size="small"
                  >
                    <GitHubIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Facebook">
                  <IconButton 
                    component="a" 
                    href="https://www.facebook.com/profile.php?id=100072894515067" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{
                      color: 'white',
                      '&:hover': { 
                        color: '#4267B2',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    size="small"
                  >
                    <FacebookIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Snapchat">
                  <IconButton 
                    component="a" 
                    href="https://snapchat.com/add/ammar.malik95" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{
                      color: 'white',
                      '&:hover': { 
                        color: '#FFFC00',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    size="small"
                  >
                    <Box 
                      component="span" 
                      sx={{ 
                        fontSize: '1.25rem', 
                        lineHeight: 1,
                        fontWeight: 'bold' 
                      }}
                    >
                      👻
                    </Box>
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Instagram">
                  <IconButton 
                    component="a" 
                    href="https://instagram.com/ammar.malik._" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{
                      color: 'white',
                      '&:hover': { 
                        color: '#E1306C',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    size="small"
                  >
                    <InstagramIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>
        <Container 
          maxWidth="md" 
          sx={{ 
            mt: 5, 
            mb: 5,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/target-accounts" element={<TargetAccountsPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/openai-config" element={<OpenAIConfigPage />} />
            <Route path="/status" element={<Navigate to="/dashboard" replace />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
