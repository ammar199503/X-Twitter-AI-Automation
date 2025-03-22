import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  AlertTitle,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
  Timer as TimerIcon,
  Checklist as ChecklistIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  DeleteSweep as DeleteSweepIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  CloudSync as CloudSyncIcon,
  Dashboard as DashboardIcon,
  ReportProblem as ReportProblemIcon,
  HourglassTop as HourglassTopIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import ApiService from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [processedLinks, setProcessedLinks] = useState([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  
  // Logs state
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState('all'); // 'all', 'info', 'warning', 'error'
  const [logSource, setLogSource] = useState('all'); // 'all', 'scraper', 'twitter', etc.

  // Add state for clearing processed links
  const [isClearing, setIsClearing] = useState(false);
  const [openLinksDialog, setOpenLinksDialog] = useState(false);
  const [openClearWarningDialog, setOpenClearWarningDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // State for confirm scraping dialog
  const [confirmScrapingOpen, setConfirmScrapingOpen] = useState(false);

  // Add a new state for stop confirmation
  const [confirmStopOpen, setConfirmStopOpen] = useState(false);

  // Add new state for failed batch information
  const [failedBatchInfo, setFailedBatchInfo] = useState({
    hasFailed: false,
    failedBatchCount: 0,
    totalTweets: 0,
    lastErrorMessage: ''
  });
  const [isLoadingFailedBatchInfo, setIsLoadingFailedBatchInfo] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Add countdown timer state
  const [countdown, setCountdown] = useState(null);

  // Define functions with useCallback to prevent dependency issues
  const checkAuth = useCallback(async () => {
    try {
      console.log('Dashboard: Checking authentication status...');
      const { data: authData } = await ApiService.auth.getStatus();
      
      // Add debug logging
      console.log('Dashboard: Auth check response:', authData);
      
      // Don't redirect if not logged in, we'll show the login button instead
      if (authData) {
        console.log('Auth status:', authData.isLoggedIn ? 'Logged in' : 'Not logged in');
      }

      // Still check if target accounts are set up for logged in users
      if (authData && authData.isLoggedIn) {
        console.log('Dashboard: User is logged in, checking app status...');
        const { data: statusData } = await ApiService.getAppStatus();
        console.log('Dashboard: App status response:', statusData);
        
        if (statusData.success) {
          const { targetAccounts } = statusData.status;
          
          // If no target accounts, redirect to set them up first
          if (!targetAccounts || !Array.isArray(targetAccounts) || targetAccounts.length === 0) {
            console.log('No target accounts set up, redirecting to target-accounts page');
            navigate('/target-accounts');
            return false;
          }
        }
      } else {
        // User is not logged in but we'll still show the dashboard with login button
        console.log('Dashboard: User is not logged in, but will show dashboard with login option');
      }
      
      // Return true in all cases - we'll show appropriate UI based on auth state
      return true;
    } catch (error) {
      console.error('Dashboard: Auth check error:', error);
      // Only redirect on critical errors - API is unreachable
      if (error.message.includes('Network Error') || error.response?.status >= 500) {
        console.log('Dashboard: Critical API error, redirecting to login');
        navigate('/login');
        return false;
      }
      
      // For other errors, still show dashboard with error state
      console.log('Dashboard: Non-critical error, showing dashboard with error state');
      return true;
    }
  }, [navigate]);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await ApiService.getAppStatus();
      console.log('Dashboard: fetchStatus response:', response);
      
      // Validate response structure
      if (!response) {
        throw new Error('Empty response from server');
      }
      
      if (response.success) {
        // Ensure we have a status object even if empty
        const statusData = response.status || {
          isRunning: false,
          isLoggedIn: false,
          openAIConfigured: false
        };
        
        setStatus(statusData);
        
        // Also fetch failed batch info if the scraper is running
        if (statusData.isRunning) {
          // Use direct API call instead of calling fetchFailedBatchInfo to avoid circular dependency
          try {
            const failedBatchResponse = await ApiService.scraper.getFailedBatchInfo();
            if (failedBatchResponse && failedBatchResponse.data) {
              setFailedBatchInfo(failedBatchResponse.data);
            }
          } catch (batchError) {
            console.error('Error fetching failed batch info:', batchError);
            // Don't set error - we still want to show status
          }
        }
      } else {
        setError(response.error || 'Failed to load status');
      }
    } catch (error) {
      console.error('Error fetching status:', error);
      setError('Failed to load status: ' + error.message);
      
      // Set minimal status to prevent UI errors
      setStatus({
        isRunning: false,
        isLoggedIn: false,
        openAIConfigured: false
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch application logs
  const fetchLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      // Apply filters if not set to 'all'
      const level = logFilter !== 'all' ? logFilter : null;
      const source = logSource !== 'all' ? logSource : null;
      
      const response = await ApiService.getLogs(50, level, source);
      if (response.success) {
        setLogs(response.logs);
      } else {
        console.error('Failed to load logs:', response.error);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [logFilter, logSource]);

  const fetchProcessedLinks = useCallback(async () => {
    try {
      setIsLoadingLinks(true);
      const { data } = await ApiService.scraper.getProcessedLinks();
      if (data.success) {
        console.log("Fetched processed links:", data.links?.length || 0);
        setProcessedLinks(data.links || []);
      } else {
        console.error("Error in processed links response:", data.error);
      }
    } catch (error) {
      console.error('Error fetching processed links:', error);
    } finally {
      setIsLoadingLinks(false);
    }
  }, []);

  // Add a function to fetch failed batch information
  const fetchFailedBatchInfo = useCallback(async () => {
    if (!status?.isRunning) return; // Only fetch if the scraper is running
    
    setIsLoadingFailedBatchInfo(true);
    try {
      const { data } = await ApiService.scraper.getFailedBatchInfo();
      setFailedBatchInfo(data);
    } catch (error) {
      console.error('Error fetching failed batch info:', error);
      setError('Failed to fetch batch information: ' + error.message);
    } finally {
      setIsLoadingFailedBatchInfo(false);
    }
  }, [status?.isRunning]);

  // Add a function to retry failed batches
  const handleRetryFailedBatch = async () => {
    setIsRetrying(true);
    try {
      const { data } = await ApiService.scraper.retryFailedBatch();
      if (data.success) {
        setInfo(data.message || 'Successfully started retrying the failed batch.');
        // Refetch the failed batch info after a short delay
        setTimeout(() => {
          fetchFailedBatchInfo();
        }, 1000);
      } else {
        setError(data.message || 'Failed to retry batch processing.');
      }
    } catch (error) {
      console.error('Error retrying failed batch:', error);
      setError('Failed to retry batch: ' + error.message);
    } finally {
      setIsRetrying(false);
    }
  };

  // Add function to format time remaining
  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds) return "N/A";
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Convert milliseconds to a more human-readable format with minutes only
  const formatTimeRemainingReadable = (milliseconds) => {
    if (!milliseconds) return "N/A";
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes} min ${seconds} sec`;
    } else {
      return `${seconds} seconds`;
    }
  };

  // Add effect to update countdown timer
  useEffect(() => {
    let interval = null;
    
    if (status?.isRunning && !status?.isPaused && status?.nextCycleTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const timeLeft = Math.max(0, status.nextCycleTime - now);
        
        setCountdown(timeLeft);
        
        // If timeLeft is 0, the next cycle should have started
        if (timeLeft === 0) {
          clearInterval(interval);
          // Fetch status to get updated nextCycleTime
          fetchStatus();
        }
      }, 1000);
    } else {
      setCountdown(null);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status?.isRunning, status?.isPaused, status?.nextCycleTime]);

  useEffect(() => {
    // Only set up status polling if auth check passes
    const initDashboard = async () => {
      console.log('Dashboard: Initializing dashboard...');
      try {
        // Show loading state
        setIsLoading(true);
        
        try {
          const authOk = await checkAuth();
          console.log('Dashboard: Auth check result:', authOk);
        } catch (authError) {
          console.error('Dashboard: Auth check error:', authError);
          // Continue with initialization even if auth check fails
        }
        
        // Always fetch status and logs, even if auth check fails
        try {
          await fetchStatus();
          console.log('Dashboard: Status loaded successfully');
        } catch (statusError) {
          console.error('Dashboard: Error fetching initial status:', statusError);
          setError('Failed to load application status. Please refresh the page or try again later.');
        }
        
        try {
          await fetchLogs();
          console.log('Dashboard: Logs loaded successfully');
        } catch (logsError) {
          console.error('Dashboard: Error fetching logs:', logsError);
          // Non-critical error, don't show to user
        }
        
        try {
          await fetchProcessedLinks();
          console.log('Dashboard: Processed links loaded successfully');
        } catch (linksError) {
          console.error('Dashboard: Error fetching processed links:', linksError);
          // Non-critical error, don't show to user
        }
        
        // Set up polling intervals with built-in error handling
        const intervalId = setInterval(() => {
          fetchStatus().catch(err => {
            console.error('Dashboard: Error in status polling:', err);
            // Don't update error state for polling failures to avoid constant error messages
          });
        }, 10000);
        
        const logsIntervalId = setInterval(() => {
          fetchLogs().catch(err => {
            console.error('Dashboard: Error in logs polling:', err);
          });
        }, 15000);
        
        // Mark loading as complete
        setIsLoading(false);
        
        // Cleanup on unmount
        return () => {
          console.log('Dashboard: Cleaning up intervals...');
          clearInterval(intervalId);
          clearInterval(logsIntervalId);
        };
      } catch (error) {
        console.error('Dashboard: Critical error in initialization:', error);
        setIsLoading(false);
        setError('Failed to initialize dashboard. Please try refreshing the page.');
      }
    };
    
    initDashboard();
  }, [checkAuth, fetchStatus, fetchLogs, fetchProcessedLinks]);

  // Function to verify required settings before scraping
  const verifyScrapingRequirements = () => {
    const validationErrors = [];
    
    // Verify target accounts
    if (!status?.targetAccounts || status.targetAccounts.length === 0) {
      validationErrors.push('No target accounts configured. Please add at least one account to monitor.');
    }
    
    // Verify OpenAI API key is set
    if (!status?.openAIConfigured) {
      validationErrors.push('OpenAI API key is not configured. Please add your API key in OpenAI Settings.');
    }
    
    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors
    };
  };

  const handleStartScraping = async () => {
    try {
      // First verify requirements
      const { isValid, errors } = verifyScrapingRequirements();
      
      if (!isValid) {
        setError(errors.join(' '));
        setConfirmScrapingOpen(false);
        return;
      }
      
      setIsStarting(true);
      setError(''); // Clear any previous errors
      const { data } = await ApiService.scraper.start();
      if (data.success) {
        fetchStatus();
      } else {
        setError(data.error || 'Failed to start scraping');
      }
    } catch (error) {
      console.error('Start scraping error:', error);
      setError(error.response?.data?.error || 'Failed to start scraping');
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopScraping = async (immediate = true) => {
    try {
      setIsStopping(true);
      const { data } = await ApiService.scraper.stop(immediate);
      if (data.success) {
        fetchStatus();
        // If graceful stop was requested, inform the user
        if (!immediate) {
          setError('');
          setInfo('Scraper will complete the current cycle before stopping. This ensures any found relevant tweets will be posted.');
        }
      } else {
        setError(data.error || 'Failed to stop scraping');
      }
    } catch (error) {
      console.error('Stop scraping error:', error);
      setError(error.response?.data?.error || 'Failed to stop scraping');
    } finally {
      setIsStopping(false);
    }
  };

  // Clear all logs
  const handleClearLogs = async () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      try {
        const response = await ApiService.clearLogs();
        if (response.success) {
          setLogs([]);
        }
      } catch (error) {
        console.error('Error clearing logs:', error);
      }
    }
  };

  // Map log level to icon and color
  const getLogLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
      default:
        return <InfoIcon color="info" />;
    }
  };

  // Get log text color based on level
  const getLogTextColor = (level) => {
    switch (level) {
      case 'error':
        return 'error.main';
      case 'warning':
        return 'warning.main';
      default:
        return 'text.primary';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Function to handle opening processed links dialog
  const handleOpenLinksDialog = async () => {
    try {
      setIsLoadingLinks(true);
      const { data } = await ApiService.scraper.getProcessedLinks();
      if (data.success) {
        setProcessedLinks(data.links || []);
      } else {
        console.error('Failed to load processed links:', data.error);
      }
    } catch (error) {
      console.error('Error fetching processed links:', error);
    } finally {
      setIsLoadingLinks(false);
      setOpenLinksDialog(true);
    }
  };

  // Function to handle closing processed links dialog
  const handleCloseLinksDialog = () => {
    setOpenLinksDialog(false);
  };

  // Add a function to handle clearing processed links
  const handleClearProcessedLinks = async () => {
    setOpenClearWarningDialog(false);
    
    setIsClearing(true);
    try {
      const response = await ApiService.scraper.clearProcessedLinks();
      if (response.data.success) {
        // Update the status to reflect the change
        fetchStatus();
        setError('');
      } else {
        setError(response.data.error || 'Failed to clear processed links');
      }
    } catch (error) {
      console.error('Error clearing processed links:', error);
      setError(error.message || 'Failed to clear processed links');
    } finally {
      setIsClearing(false);
    }
  };

  // Function to open the clear warning dialog
  const handleOpenClearWarningDialog = () => {
    setOpenClearWarningDialog(true);
  };

  // Function to close the clear warning dialog
  const handleCloseClearWarningDialog = () => {
    setOpenClearWarningDialog(false);
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { data } = await ApiService.auth.logout();
      if (data.success) {
        // Update the status to show logged out
        setStatus(prev => ({
          ...prev,
          isLoggedIn: false,
          username: null
        }));
        setError('');
      } else {
        setError(data.error || 'Failed to logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.response?.data?.error || 'Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Handle redirect to login page
  const handleGoToLogin = () => {
    navigate('/login');
  };

  // Add this function to check for authentication issues
  const checkAuthenticationStatus = () => {
    if (!status) return false;
    
    // Check if scraping is paused due to authentication issues
    if (status.scraperStatus?.isPaused && 
        status.scraperStatus?.pauseReason?.includes('authentication')) {
      return true;
    }
    
    // Check if Twitter is not logged in
    if (status.twitterLoggedIn === false) {
      return true;
    }
    
    return false;
  };

  if (isLoading && !status) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 6, mb: 6, animation: 'fadeIn 0.4s ease-out' }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4, 
            borderRadius: 3,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
          }}
        >
          {error}
        </Alert>
      )}
      
      {info && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 4, 
            borderRadius: 3,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
          }}
        >
          {info}
        </Alert>
      )}

      <Box sx={{ 
        mb: 5, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 3,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 600,
            backgroundImage: 'linear-gradient(45deg, #0071e3, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textFillColor: 'transparent'
          }}
        >
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {status?.isLoggedIn ? (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={isLoggingOut ? <CircularProgress size={20} /> : <LogoutIcon />}
              onClick={handleLogout}
              disabled={isLoggingOut}
              sx={{
                borderRadius: 2,
                py: 1,
                px: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              Logout
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<LoginIcon />}
              onClick={handleGoToLogin}
              sx={{
                borderRadius: 2,
                py: 1,
                px: 2,
                boxShadow: '0 2px 10px rgba(0, 113, 227, 0.2)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)'
                }
              }}
            >
              Login
            </Button>
          )}
          <IconButton 
            onClick={fetchStatus} 
            disabled={isLoading}
            sx={{
              backgroundColor: 'background.paper',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              borderRadius: 2,
              p: 1,
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'rotate(30deg)',
                backgroundColor: 'rgba(0, 113, 227, 0.08)'
              }
            }}
          >
            {isLoading ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Status Card */}
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
                  Scraper Status
                </Typography>
              } 
              sx={{ 
                borderBottom: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                py: 2
              }}
            />
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" component="span" sx={{ mr: 1, color: 'text.secondary' }}>
                        Status:
                      </Typography>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          py: 0.5, 
                          px: 1.5, 
                          borderRadius: 3,
                          backgroundColor: status?.isRunning ? 'rgba(52, 199, 89, 0.12)' : 'rgba(134, 134, 139, 0.12)',
                          color: status?.isRunning ? 'success.main' : 'text.secondary',
                          fontWeight: 500,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          component="span" 
                          sx={{ 
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <span 
                            style={{ 
                              display: 'inline-block', 
                              width: '8px', 
                              height: '8px', 
                              borderRadius: '50%', 
                              backgroundColor: status?.isRunning ? '#34c759' : '#86868b',
                              marginRight: '6px'
                            }}
                          />
                          {status?.isRunning ? 'Running' : 'Stopped'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Add Next Cycle Countdown */}
                    {status?.isRunning && !status?.isPaused && countdown !== null && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" component="span" sx={{ mr: 1, color: 'text.secondary' }}>
                          Next Cycle:
                        </Typography>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            py: 0.5, 
                            px: 1.5, 
                            borderRadius: 3,
                            backgroundColor: 'rgba(90, 200, 250, 0.12)',
                            color: 'info.main',
                            fontWeight: 500
                          }}
                        >
                          <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography 
                            variant="body2" 
                            component="span" 
                            sx={{ fontWeight: 600 }}
                          >
                            {formatTimeRemainingReadable(countdown)}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" component="span" sx={{ mr: 1, color: 'text.secondary' }}>
                        Logged in as:
                      </Typography>
                      <Typography 
                        variant="body1" 
                        component="span" 
                        sx={{ 
                          fontWeight: 600,
                          py: 0.5, 
                          px: 1.5, 
                          borderRadius: 3,
                          backgroundColor: status?.isLoggedIn ? 'rgba(0, 113, 227, 0.08)' : 'rgba(134, 134, 139, 0.12)',
                          color: status?.isLoggedIn ? 'primary.main' : 'text.secondary'
                        }}
                      >
                        {status?.isLoggedIn ? status.username : 'Not logged in'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" component="span" sx={{ mr: 1, color: 'text.secondary' }}>
                        Processed Tweets:
                      </Typography>
                      <Button 
                        onClick={handleOpenLinksDialog}
                        sx={{ 
                          fontWeight: 600,
                          py: 0.5, 
                          px: 1.5, 
                          borderRadius: 3,
                          backgroundColor: 'rgba(0, 113, 227, 0.08)',
                          color: 'primary.main',
                          minWidth: 'auto',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 113, 227, 0.15)',
                          }
                        }}
                        disabled={isLoadingLinks}
                      >
                        {processedLinks.length || 0}
                      </Button>
                      <IconButton 
                        size="small" 
                        onClick={fetchProcessedLinks}
                        disabled={isLoadingLinks}
                        sx={{ ml: 1 }}
                      >
                        {isLoadingLinks ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                      </IconButton>
                      <Tooltip title="Delete processed tweets history">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={handleOpenClearWarningDialog}
                          disabled={isClearing || !processedLinks.length}
                          sx={{ ml: 1 }}
                        >
                          {isClearing ? <CircularProgress size={16} /> : <DeleteSweepIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    {/* Add Failed Batch Information */}
                    {status?.isRunning && failedBatchInfo.hasFailed && (
                      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Alert 
                          severity="warning" 
                          sx={{ 
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            '& .MuiAlert-icon': {
                              color: 'warning.main'
                            }
                          }}
                        >
                          <AlertTitle>Processing Failure Detected</AlertTitle>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {failedBatchInfo.totalTweets} tweets in {failedBatchInfo.failedBatchCount} {failedBatchInfo.failedBatchCount === 1 ? 'batch' : 'batches'} failed to process.
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Error:</strong> {failedBatchInfo.lastErrorMessage}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Button 
                              variant="contained" 
                              color="warning" 
                              size="small" 
                              startIcon={isRetrying ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                              onClick={handleRetryFailedBatch}
                              disabled={isRetrying || !failedBatchInfo.hasFailed}
                              sx={{ 
                                borderRadius: 2,
                                textTransform: 'none',
                                boxShadow: '0 2px 8px rgba(255, 152, 0, 0.2)'
                              }}
                            >
                              Retry Processing
                            </Button>
                            <Button 
                              variant="outlined" 
                              color="inherit" 
                              size="small" 
                              onClick={fetchFailedBatchInfo}
                              disabled={isLoadingFailedBatchInfo}
                              sx={{ 
                                ml: 1,
                                borderRadius: 2,
                                textTransform: 'none',
                              }}
                            >
                              Refresh
                            </Button>
                          </Box>
                        </Alert>
                      </Box>
                    )}
                  </Stack>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                    {!status?.isLoggedIn ? (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<LoginIcon />}
                        onClick={handleGoToLogin}
                        sx={{ py: 1.5 }}
                      >
                        Login to Start Scraping
                      </Button>
                    ) : status?.isRunning ? (
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={isStopping ? <CircularProgress size={20} /> : <StopIcon />}
                        onClick={() => setConfirmStopOpen(true)}
                        disabled={isStopping}
                        sx={{ py: 1.5 }}
                      >
                        Stop Scraping
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={isStarting ? <CircularProgress size={20} /> : <PlayIcon />}
                        onClick={() => setConfirmScrapingOpen(true)}
                        disabled={isStarting || !status?.isLoggedIn}
                        sx={{ py: 1.5 }}
                      >
                        Start Scraping
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuration Links */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Configuration" />
            <Divider />
            <CardContent>
              <List>
                <ListItem 
                  onClick={() => navigate('/target-accounts')}
                  disabled={!status?.isLoggedIn}
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemIcon>
                    <AccountIcon color={status?.isLoggedIn ? 'inherit' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Target Accounts" 
                    secondary={`${status?.targetAccounts?.length || 0} accounts configured`}
                    primaryTypographyProps={{
                      color: !status?.isLoggedIn ? 'text.disabled' : 'inherit'
                    }}
                    secondaryTypographyProps={{
                      color: !status?.isLoggedIn ? 'text.disabled' : 'inherit'
                    }}
                  />
                </ListItem>
                <ListItem 
                  onClick={() => navigate('/config')}
                  disabled={!status?.isLoggedIn}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <ListItemIcon>
                    <TimerIcon color={status?.isLoggedIn ? 'inherit' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Delay Settings" 
                    secondary={
                      status?.delays && 
                      typeof status.delays.min === 'number' && 
                      typeof status.delays.max === 'number'
                        ? `${(status.delays.min / 1000).toFixed(1)} - ${(status.delays.max / 1000).toFixed(1)} seconds` 
                        : 'Not configured'
                    }
                    primaryTypographyProps={{
                      color: !status?.isLoggedIn ? 'text.disabled' : 'inherit'
                    }}
                    secondaryTypographyProps={{
                      color: !status?.isLoggedIn ? 'text.disabled' : 'inherit'
                    }}
                  />
                </ListItem>
                <ListItem 
                  onClick={() => navigate('/openai-config')}
                  disabled={!status?.isLoggedIn}
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemIcon>
                    <CloudSyncIcon color={status?.isLoggedIn ? 'inherit' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="OpenAI Settings" 
                    secondary="Configure tweet rephrasing personality"
                    primaryTypographyProps={{
                      color: !status?.isLoggedIn ? 'text.disabled' : 'inherit'
                    }}
                    secondaryTypographyProps={{
                      color: !status?.isLoggedIn ? 'text.disabled' : 'inherit'
                    }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="Recent Activity" 
              action={
                <Button 
                  size="small" 
                  startIcon={isLoadingLinks ? <CircularProgress size={16} /> : <RefreshIcon />}
                  onClick={fetchProcessedLinks}
                  disabled={isLoadingLinks || !status?.isLoggedIn}
                >
                  Refresh
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ maxHeight: 250, overflow: 'auto' }}>
              {!status?.isLoggedIn ? (
                <Typography variant="body2" color="text.secondary" align="center">
                  Login to view recent activity
                </Typography>
              ) : processedLinks.length > 0 ? (
                <List dense>
                  {processedLinks.slice(0, 5).map((link, index) => (
                    <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                        <ChecklistIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={link} 
                        secondary={`Processed tweet`}
                        primaryTypographyProps={{ 
                          style: { 
                            wordBreak: 'break-all',
                            whiteSpace: 'normal'
                          } 
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  No recent activity
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Logs Section */}
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Application Logs"
              action={
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Log Level</InputLabel>
                    <Select
                      value={logFilter}
                      label="Log Level"
                      onChange={(e) => setLogFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Levels</MenuItem>
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="warning">Warning</MenuItem>
                      <MenuItem value="error">Error</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Source</InputLabel>
                    <Select
                      value={logSource}
                      label="Source"
                      onChange={(e) => setLogSource(e.target.value)}
                    >
                      <MenuItem value="all">All Sources</MenuItem>
                      <MenuItem value="scraper">Scraper</MenuItem>
                      <MenuItem value="twitter">Twitter</MenuItem>
                      <MenuItem value="app">Application</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton
                    onClick={fetchLogs}
                    disabled={isLoadingLogs}
                    title="Refresh Logs"
                  >
                    <RefreshIcon />
                  </IconButton>
                  <IconButton
                    onClick={handleClearLogs}
                    disabled={isLoadingLogs || logs.length === 0}
                    title="Clear Logs"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            />
            <Divider />
            <CardContent sx={{ maxHeight: 400, overflow: 'auto' }}>
              {isLoadingLogs && logs.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : logs.length === 0 ? (
                <Alert severity="info">No logs available</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="5%">Level</TableCell>
                        <TableCell width="15%">Time</TableCell>
                        <TableCell width="15%">Source</TableCell>
                        <TableCell>Message</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.map((log, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Tooltip title={log.level}>
                              {getLogLevelIcon(log.level)}
                            </Tooltip>
                          </TableCell>
                          <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={log.source} 
                              size="small" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell sx={{ color: getLogTextColor(log.level) }}>
                            {log.message}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Processed Links Dialog */}
      <Dialog
        open={openLinksDialog}
        onClose={handleCloseLinksDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            p: 1,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'rgba(0, 0, 0, 0.02)'
        }}>
          Processed X/Twitter Tweets
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {isLoadingLinks ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress thickness={4} />
            </Box>
          ) : processedLinks.length > 0 ? (
            <List sx={{ p: 0 }}>
              {processedLinks.map((link, index) => (
                <ListItem 
                  key={index} 
                  divider={index < processedLinks.length - 1}
                  sx={{ 
                    py: 1.5,
                    px: 3,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.01)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <ChecklistIcon 
                      color="primary" 
                      fontSize="small"
                      sx={{ 
                        bgcolor: 'rgba(0, 113, 227, 0.1)',
                        p: 0.7,
                        borderRadius: '50%',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography 
                        variant="body2" 
                        component="span" 
                        sx={{ 
                          fontWeight: 500,
                          color: 'text.primary',
                          wordBreak: 'break-all',
                          whiteSpace: 'normal',
                          fontSize: '0.875rem'
                        }}
                      >
                        {link}
                      </Typography>
                    }
                    secondary={
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          mt: 0.5
                        }}
                      >
                        <Chip 
                          label={`Tweet #${index + 1}`} 
                          size="small"
                          sx={{ 
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: 'rgba(0, 113, 227, 0.05)',
                            borderColor: 'rgba(0, 113, 227, 0.1)',
                            fontWeight: 500
                          }}
                        />
                      </Typography>
                    }
                    primaryTypographyProps={{ 
                      style: { 
                        wordBreak: 'break-all',
                        whiteSpace: 'normal'
                      } 
                    }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                No processed tweets found
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseLinksDialog}
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              px: 3,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.03)'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Warning Dialog */}
      <Dialog
        open={openClearWarningDialog}
        onClose={handleCloseClearWarningDialog}
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          pb: 1,
          color: '#ff9500' // Apple warning orange
        }}>
          Warning: Clear History
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary' }}>
            Removing all history may cause duplicate tweets posted to your account.
            Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseClearWarningDialog}
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.03)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleClearProcessedLinks} 
            color="warning"
            variant="contained"
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(255, 149, 0, 0.2)',
              ml: 1,
              '&:hover': {
                boxShadow: '0 4px 12px rgba(255, 149, 0, 0.3)'
              }
            }}
          >
            Delete History
          </Button>
        </DialogActions>
      </Dialog>

      {/* Start Scraping Confirmation Dialog */}
      <Dialog
        open={confirmScrapingOpen}
        onClose={() => setConfirmScrapingOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            p: 1,
            maxWidth: 500
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'rgba(0, 0, 0, 0.02)'
        }}>
          Confirm Scraping Settings
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>
            Please review your scraping settings:
          </Typography>
          
          <Box sx={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.02)', 
            p: 2, 
            borderRadius: 2,
            mb: 2,
          }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Account:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight={500}>
                  {status?.username || 'Unknown'}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Tweets per account:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight={500}>
                  {status?.tweetsPerAccount || 'Default'}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Delay between tweets:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight={500}>
                  {status?.delays ? `${(status.delays.min / 1000).toFixed(1)} - ${(status.delays.max / 1000).toFixed(1)} seconds` : 'Default'}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Target accounts:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography 
                    variant="body2" 
                    fontWeight={500}
                    color={(!status?.targetAccounts || status?.targetAccounts?.length === 0) ? 'error.main' : 'inherit'}
                  >
                    {status?.targetAccounts?.length || 0} accounts
                  </Typography>
                  {(!status?.targetAccounts || status?.targetAccounts?.length === 0) && (
                    <Tooltip title="At least one target account is required">
                      <WarningIcon fontSize="small" color="error" sx={{ ml: 1 }} />
                    </Tooltip>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  OpenAI API Key:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography 
                    variant="body2" 
                    fontWeight={500}
                    color={!status?.openAIConfigured ? 'error.main' : 'success.main'}
                  >
                    {status?.openAIConfigured ? 'Configured' : 'Not configured'}
                  </Typography>
                  {!status?.openAIConfigured && (
                    <Tooltip title="OpenAI API key is required for tweet processing">
                      <WarningIcon fontSize="small" color="error" sx={{ ml: 1 }} />
                    </Tooltip>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            Click "Start Scraping" to begin with these settings or "Cancel" to adjust your settings.
          </Typography>
          
          {(!status?.targetAccounts || status?.targetAccounts?.length === 0 || !status?.openAIConfigured) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {!status?.targetAccounts || status?.targetAccounts?.length === 0 ? 
                "Please add target accounts before starting scraping. " : ""}
              {!status?.openAIConfigured ? 
                "Please configure your OpenAI API key before starting scraping." : ""}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setConfirmScrapingOpen(false)}
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.03)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setConfirmScrapingOpen(false);
              handleStartScraping();
            }}
            color="success"
            variant="contained"
            startIcon={<PlayIcon />}
            disabled={!status?.targetAccounts || status?.targetAccounts?.length === 0 || !status?.openAIConfigured}
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(52, 199, 89, 0.2)',
              ml: 1,
              '&:hover': {
                boxShadow: '0 4px 12px rgba(52, 199, 89, 0.3)'
              }
            }}
          >
            Start Scraping
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stop Scraping Confirmation Dialog */}
      <Dialog
        open={confirmStopOpen}
        onClose={() => setConfirmStopOpen(false)}
        aria-labelledby="stop-scraping-dialog-title"
      >
        <DialogTitle id="stop-scraping-dialog-title">
          Stop Scraping Options
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Choose how you want to stop the scraper:
          </DialogContentText>
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  onClick={() => {
                    handleStopScraping(true); // Immediate stop
                    setConfirmStopOpen(false);
                  }}
                  startIcon={<StopIcon />}
                >
                  Stop Immediately
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Stops right away. Any tweets already identified but not yet posted will be discarded.
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  onClick={() => {
                    handleStopScraping(false); // Graceful stop
                    setConfirmStopOpen(false);
                  }}
                  startIcon={<HourglassTopIcon />}
                >
                  Graceful Stop
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Completes posting any tweets already processed by OpenAI before stopping.
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmStopOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Configuration Links section - Find this section */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Button
            component={Link}
            to="/target-accounts"
            variant="outlined"
            fullWidth
            startIcon={<AccountIcon />}
            sx={{ py: 2 }}
          >
            Target Accounts
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Button
            component={Link}
            to="/config"
            variant="outlined"
            fullWidth
            startIcon={<SettingsIcon />}
            sx={{ py: 2 }}
          >
            Scraper Settings
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Button
            component={Link}
            to="/openai-config"
            variant="outlined"
            fullWidth
            startIcon={<CloudSyncIcon />}
            sx={{ py: 2 }}
          >
            OpenAI Settings
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 