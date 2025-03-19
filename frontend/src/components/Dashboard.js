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
} from '@mui/icons-material';
import ApiService from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
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

  useEffect(() => {
    // Only set up status polling if auth check passes
    const initDashboard = async () => {
      const authOk = await checkAuth();
      if (authOk) {
        // Initial fetch
        fetchStatus();
        fetchLogs();
        
        // Poll for status updates
        const intervalId = setInterval(fetchStatus, 10000);
        const logsIntervalId = setInterval(fetchLogs, 15000);
        
        // Cleanup on unmount
        return () => {
          clearInterval(intervalId);
          clearInterval(logsIntervalId);
        };
      }
    };
    
    initDashboard();
  }, [logFilter, logSource]);

  const checkAuth = async () => {
    try {
      const { data: authData } = await ApiService.auth.getStatus();
      
      // Don't redirect if not logged in, we'll show the login button instead
      if (authData) {
        console.log('Auth status:', authData.isLoggedIn ? 'Logged in' : 'Not logged in');
      }

      // Still check if target accounts are set up for logged in users
      if (authData && authData.isLoggedIn) {
        const { data: statusData } = await ApiService.getAppStatus();
        if (statusData.success) {
          const { targetAccounts } = statusData.status;
          
          // If no target accounts, redirect to set them up first
          if (!targetAccounts || !Array.isArray(targetAccounts) || targetAccounts.length === 0) {
            console.log('No target accounts set up, redirecting to target-accounts page');
            navigate('/target-accounts');
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      // Only redirect on error - API is unreachable
      navigate('/login');
      return false;
    }
  };

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const { data } = await ApiService.getAppStatus();
      if (data.success) {
        // Normalize the delays property names to ensure consistent access
        if (data.status.delays) {
          data.status.delays = {
            min: data.status.delays.min || data.status.delays.minDelay,
            max: data.status.delays.max || data.status.delays.maxDelay,
            minDelay: data.status.delays.minDelay || data.status.delays.min,
            maxDelay: data.status.delays.maxDelay || data.status.delays.max
          };
        }
        console.log('Normalized status data:', data.status);
        setStatus(data.status);
      } else {
        setError('Failed to load status');
      }
    } catch (error) {
      console.error('Status fetch error:', error);
      setError('Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProcessedLinks = async () => {
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
  };

  const handleStartScraping = async () => {
    try {
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

  const handleStopScraping = async () => {
    try {
      setIsStopping(true);
      const { data } = await ApiService.scraper.stop();
      if (data.success) {
        fetchStatus();
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

  // Fetch application logs
  const fetchLogs = async () => {
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
                        Twitter API:
                      </Typography>
                      <Typography 
                        variant="body1" 
                        component="span" 
                        sx={{ 
                          fontWeight: 600,
                          py: 0.5, 
                          px: 1.5, 
                          borderRadius: 3,
                          backgroundColor: status?.isTwitterConnected ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.08)',
                          color: status?.isTwitterConnected ? 'success.main' : 'error.main'
                        }}
                      >
                        {status?.isTwitterConnected ? 'Connected' : 'Disconnected'}
                      </Typography>
                    </Box>
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
                        onClick={handleStopScraping}
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
                        onClick={handleStartScraping}
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
                  button 
                  onClick={() => navigate('/target-accounts')}
                  disabled={!status?.isLoggedIn}
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
                  button 
                  onClick={() => navigate('/config')}
                  disabled={!status?.isLoggedIn}
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
                  button 
                  onClick={() => navigate('/config')}
                  disabled={!status?.isLoggedIn}
                >
                  <ListItemIcon>
                    <SettingsIcon color={status?.isLoggedIn ? 'inherit' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Tweet Text" 
                    secondary={status?.tweetText || 'No custom text'} 
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
            All previously scraped tweets data will be cleared which can cause to post the already posted tweets again. 
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
            Clear History
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard; 