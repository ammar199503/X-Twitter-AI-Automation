import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

// Import our components
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import TargetAccountsPage from './components/TargetAccountsPage';
import ConfigPage from './components/ConfigPage';
import OpenAIConfigPage from './components/OpenAIConfigPage';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';

// Create an Apple-inspired theme
const appleTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0071e3', // Apple blue
      light: '#47a9ff',
      dark: '#0058b0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#86868b', // Apple secondary gray
      light: '#b6b6ba',
      dark: '#585860',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ff3b30', // Apple red
    },
    warning: {
      main: '#ff9500', // Apple orange
    },
    info: {
      main: '#5ac8fa', // Apple light blue
    },
    success: {
      main: '#34c759', // Apple green
    },
    background: {
      default: '#f5f5f7', // Apple light gray background
      paper: '#ffffff', // White surfaces
    },
    text: {
      primary: '#1d1d1f', // Apple dark gray text
      secondary: '#86868b', // Apple secondary gray text
    },
    divider: 'rgba(0, 0, 0, 0.1)',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 600,
      letterSpacing: '-0.015em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.005em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.005em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          boxShadow: 'none',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease-in-out',
            '&.Mui-focused': {
              boxShadow: '0 0 0 4px rgba(0, 113, 227, 0.1)',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 0 rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={appleTheme}>
      <CssBaseline />
      <Router>
        <AppBar position="static" elevation={0} color="transparent">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ 
              flexGrow: 1, 
              fontWeight: 600, 
              color: 'text.primary' 
            }}>
              Twitter Scraper & Poster
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ mt: 4 }}>
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
