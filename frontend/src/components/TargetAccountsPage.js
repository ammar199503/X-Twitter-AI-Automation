import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
  Typography,
  Alert,
  Paper,
  Input,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  DeleteSweep as DeleteSweepIcon,
  CloudUpload as CloudUploadIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import ApiService from '../services/api';

const TargetAccountsPage = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [newAccount, setNewAccount] = useState({ account: '', pinnedTweetId: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoDialogMessage, setInfoDialogMessage] = useState('');
  const [infoDialogTitle, setInfoDialogTitle] = useState('');
  const [infoDialogIcon, setInfoDialogIcon] = useState('info'); // 'error', 'warning', or 'info'
  const [confirmImportDialogOpen, setConfirmImportDialogOpen] = useState(false);
  const [fileToImport, setFileToImport] = useState(null);
  const [estimatedAccountCount, setEstimatedAccountCount] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const { data } = await ApiService.config.getTargetAccounts();
      if (data.success) {
        setAccounts(data.targetAccounts);
      } else {
        setError(data.error || 'Failed to fetch target accounts');
      }
    } catch (error) {
      console.error('Error fetching target accounts:', error);
      setError(error.response?.data?.error || 'Failed to fetch target accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setNewAccount({ ...newAccount, [name]: value });
  };

  const showInfoDialog = (title, message, icon = 'info') => {
    setInfoDialogTitle(title);
    setInfoDialogMessage(message);
    setInfoDialogIcon(icon);
    setInfoDialogOpen(true);
  };

  const handleAddAccount = async () => {
    // Validate account name
    if (!newAccount.account.trim()) {
      showInfoDialog('Validation Error', 'Please enter a valid X/Twitter account name', 'error');
      return;
    }

    // Check for the account limit on the client side first
    if (accounts.length >= 70) {
      showInfoDialog(
        'Account Limit Reached', 
        'You have reached the maximum limit of 70 target accounts. Please remove some accounts before adding new ones.',
        'warning'
      );
      return;
    }

    // Check for duplicate account on the client side
    const accountName = newAccount.account.trim().replace(/^@/, '');
    const isDuplicate = accounts.some(account => {
      if (typeof account === 'string') {
        return account === accountName;
      }
      return account.account === accountName;
    });

    if (isDuplicate) {
      showInfoDialog(
        'Duplicate Account', 
        `The account @${accountName} is already in your target accounts list.`,
        'warning'
      );
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      
      const { data } = await ApiService.config.addTargetAccount({
        account: accountName,
        pinnedTweetId: newAccount.pinnedTweetId.trim(),
      });

      if (data.success) {
        setAccounts(data.targetAccounts);
        setNewAccount({ account: '', pinnedTweetId: '' });
      } else {
        showInfoDialog('Error', data.error || 'Failed to add target account', 'error');
      }
    } catch (error) {
      console.error('Error adding target account:', error);
      showInfoDialog(
        'Error', 
        error.response?.data?.error || 'Failed to add target account',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = (account) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;

    try {
      setIsSaving(true);
      setError('');

      const { data } = await ApiService.config.deleteTargetAccount(accountToDelete.account);

      if (data.success) {
        setAccounts(data.targetAccounts);
        setDeleteDialogOpen(false);
        setAccountToDelete(null);
      } else {
        setError(data.error || 'Failed to delete target account');
      }
    } catch (error) {
      console.error('Error deleting target account:', error);
      setError(error.response?.data?.error || 'Failed to delete target account');
    } finally {
      setIsSaving(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteAllAccounts = async () => {
    try {
      setIsSaving(true);
      setError('');

      const { data } = await ApiService.config.deleteAllTargetAccounts();

      if (data.success) {
        setAccounts([]);
      } else {
        setError(data.error || 'Failed to delete all accounts');
      }
    } catch (error) {
      console.error('Error deleting all accounts:', error);
      setError(error.response?.data?.error || 'Failed to delete all accounts');
    } finally {
      setIsSaving(false);
      setDeleteAllDialogOpen(false);
    }
  };

  const handleCsvImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size - show warning if file is large (> 100KB)
    if (file.size > 100 * 1024) {
      // Large file might contain many accounts - estimate count based on average row size
      const estimatedRows = Math.floor(file.size / 40); // Assuming ~40 bytes per row
      
      if (estimatedRows > 100) {
        setFileToImport(file);
        setEstimatedAccountCount(estimatedRows);
        setConfirmImportDialogOpen(true);
        return;
      }
    }

    // Proceed with import
    processImport(file);
  };

  const processImport = async (file) => {
    // Check for account limit on the client side first
    if (accounts.length >= 70) {
      showInfoDialog(
        'Account Limit Reached', 
        'You have reached the maximum limit of 70 target accounts. Please remove some accounts before importing new ones.',
        'warning'
      );
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      setIsImporting(true);
      setError('');

      const { data } = await ApiService.config.importTargetAccountsFromCsv(formData);

      if (data.success) {
        setAccounts(data.targetAccounts);
        
        // Construct a detailed import message
        let message = "";
        if (data.totalFound) {
          message += `📊 Found ${data.totalFound} accounts in the CSV file.\n\n`;
        }
        
        if (data.imported > 0) {
          message += `✅ Successfully imported ${data.imported} new accounts.\n\n`;
        } else {
          message += `ℹ️ No new accounts were imported.\n\n`;
        }
        
        if (data.duplicatesSkipped && data.duplicatesSkipped > 0) {
          message += `🔄 ${data.duplicatesSkipped} duplicates were skipped.\n\n`;
        }
        
        if (data.accountsSkippedDueToLimit && data.accountsSkippedDueToLimit > 0) {
          message += `⚠️ ${data.accountsSkippedDueToLimit} accounts were skipped due to the 70 account limit.\n\n`;
        }
        
        message += `Current total: ${data.totalAccounts || data.targetAccounts.length}/70 accounts.`;
        
        showInfoDialog(
          data.imported > 0 ? 'Import Successful' : 'Import Complete',
          message,
          data.accountsSkippedDueToLimit > 0 ? 'warning' : 'info'
        );
      } else {
        showInfoDialog('Import Failed', data.error || 'Failed to import target accounts from CSV', 'error');
      }
    } catch (error) {
      console.error('Error importing target accounts from CSV:', error);
      showInfoDialog(
        'Import Error', 
        error.response?.data?.error || 'Failed to import target accounts from CSV',
        'error'
      );
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (isLoading && accounts.length === 0) {
    return (
      <Container sx={{ 
        mt: 6, 
        textAlign: 'center',
        animation: 'fadeIn 0.4s ease-out' 
      }}>
        <CircularProgress thickness={4} size={40} />
        <Typography variant="h6" sx={{ mt: 3, fontWeight: 500, color: 'text.secondary' }}>
          Loading target accounts...
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
          onClose={() => setError('')}
        >
          {error}
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
          Target X/Twitter Accounts
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
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                  }}
                >
                  Add Target Account
                </Typography>
                
                <Box>
                  <Input 
                    type="file"
                    inputRef={fileInputRef}
                    onChange={handleCsvImport}
                    sx={{ display: 'none' }}
                    inputProps={{ accept: '.csv' }}
                  />
                  <Tooltip title={
                    accounts.length >= 70 
                      ? "Maximum limit of 70 accounts reached. Remove some accounts before importing." 
                      : "Import accounts from CSV. Column A should contain usernames and Column B should contain Tweet IDs."
                  }>
                    <span> {/* Use span as wrapper to show tooltip even when button is disabled */}
                      <Button
                        variant="outlined"
                        startIcon={isImporting ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                        onClick={triggerFileInput}
                        disabled={isImporting || accounts.length >= 70}
                        sx={{ 
                          borderRadius: 2,
                          ml: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 113, 227, 0.08)'
                          }
                        }}
                      >
                        Import CSV
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 3,
                  color: 'text.primary',
                  lineHeight: 1.5
                }}
              >
                Add the X/Twitter accounts you want to monitor for tweets. 
                For each account, you can also specify a pinned tweet ID to skip when scraping.
              </Typography>
              
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 3, 
                  lineHeight: 1.5,
                  pb: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                Pinned tweet IDs can be found in the URL of a tweet (e.g., https://twitter.com/username/status/<b>1234567890</b>)
              </Typography>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label="X/Twitter Account"
                    name="account"
                    value={newAccount.account}
                    onChange={handleAccountChange}
                    placeholder="username (without @)"
                    variant="outlined"
                    disabled={isSaving}
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
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label="Pinned Tweet ID (optional)"
                    name="pinnedTweetId"
                    value={newAccount.pinnedTweetId}
                    onChange={handleAccountChange}
                    placeholder="1234567890"
                    variant="outlined"
                    disabled={isSaving}
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
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Tooltip 
                    title={accounts.length >= 70 ? "Maximum limit of 70 accounts reached" : ""}
                    placement="top"
                  >
                    <div style={{ width: '100%' }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={isSaving ? <CircularProgress size={20} /> : <AddIcon />}
                        onClick={handleAddAccount}
                        disabled={isSaving || !newAccount.account.trim() || accounts.length >= 70}
                        sx={{ 
                          borderRadius: 2, 
                          py: 1.5, 
                          boxShadow: '0 2px 10px rgba(0, 113, 227, 0.2)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 15px rgba(0, 113, 227, 0.3)'
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </Tooltip>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

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
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography 
                  variant="h6"
                  sx={{ fontWeight: 600 }}
                >
                  Target Accounts ({accounts.length}/70)
                </Typography>
                {accounts.length > 0 && (
                  <Button
                    color="error"
                    size="small"
                    startIcon={<DeleteSweepIcon />}
                    onClick={() => setDeleteAllDialogOpen(true)}
                    disabled={isSaving}
                    sx={{ 
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 59, 48, 0.08)'
                      }
                    }}
                  >
                    Remove All
                  </Button>
                )}
              </Box>

              {/* Add progress bar showing account limit usage */}
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box 
                  sx={{ 
                    flexGrow: 1, 
                    height: '6px', 
                    backgroundColor: 'rgba(0, 0, 0, 0.05)', 
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}
                >
                  <Box 
                    sx={{ 
                      height: '100%', 
                      width: `${(accounts.length / 70) * 100}%`,
                      backgroundColor: accounts.length >= 63 ? (accounts.length >= 70 ? 'error.main' : 'warning.main') : 'primary.main',
                      transition: 'width 0.3s ease, background-color 0.3s ease'
                    }} 
                  />
                </Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 600, 
                    color: accounts.length >= 63 ? (accounts.length >= 70 ? 'error.main' : 'warning.main') : 'text.secondary'
                  }}
                >
                  {accounts.length >= 70 ? 'LIMIT REACHED' : `${70 - accounts.length} REMAINING`}
                </Typography>
              </Box>

              {accounts.length === 0 ? (
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    borderRadius: 3,
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No target accounts configured. Add accounts above to begin monitoring.
                  </Typography>
                </Paper>
              ) : (
                <List 
                  sx={{ 
                    bgcolor: 'background.paper',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
                  }}
                >
                  {accounts.map((account, index) => (
                    <React.Fragment key={account.account}>
                      {index > 0 && <Divider />}
                      <ListItem 
                        sx={{ 
                          py: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.01)'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography 
                                variant="body1" 
                                component="span"
                                sx={{ 
                                  fontWeight: 600, 
                                  color: 'primary.main',
                                  mr: 1
                                }}
                              >
                                @{typeof account === 'string' ? account : account.account}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            account.pinnedTweetId ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <Typography variant="caption" color="text.secondary" component="span">
                                  Pinned Tweet ID: 
                                </Typography>
                                <Chip 
                                  label={account.pinnedTweetId}
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    ml: 1, 
                                    fontSize: '0.7rem',
                                    height: 20,
                                    backgroundColor: 'rgba(0, 113, 227, 0.05)',
                                    borderColor: 'rgba(0, 113, 227, 0.2)'
                                  }}
                                />
                              </Box>
                            ) : (
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontStyle: 'italic', mt: 0.5, display: 'block' }}
                              >
                                No pinned tweet ID
                              </Typography>
                            )
                          }
                          
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() => openDeleteDialog(account)}
                            disabled={isSaving}
                            sx={{
                              backgroundColor: 'rgba(255, 59, 48, 0.05)',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                                transform: 'rotate(8deg)'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/dashboard')}
            sx={{ 
              borderRadius: 2,
              py: 1.5,
              px: 3,
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }
            }}
          >
            Skip to Dashboard
          </Button>
          
          {accounts.length > 0 && (
            <Button
              variant="contained"
              onClick={() => navigate('/config')}
              sx={{ 
                py: 1.5, 
                px: 3, 
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
                }
              }}
            >
              Continue to Delay Settings
            </Button>
          )}
        </Grid>
      </Grid>

      {/* Delete Account Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            p: 1
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            fontWeight: 600,
            pb: 1
          }}
        >
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText 
            sx={{ 
              color: 'text.primary',
              mb: 1 
            }}
          >
            Are you sure you want to remove <Box component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>@{accountToDelete?.account}</Box> from your target accounts?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
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
            onClick={handleDeleteAccount} 
            color="error" 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(255, 59, 48, 0.2)',
              ml: 1,
              '&:hover': {
                boxShadow: '0 4px 12px rgba(255, 59, 48, 0.3)'
              }
            }}
          >
            {isSaving ? <CircularProgress size={24} thickness={4} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete All Dialog */}
      <Dialog
        open={deleteAllDialogOpen}
        onClose={() => setDeleteAllDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            p: 1
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            fontWeight: 600,
            pb: 1
          }}
        >
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{ 
              color: 'text.primary',
              mb: 1 
            }}
          >
            Are you sure you want to remove <Box component="span" sx={{ fontWeight: 600 }}>all target accounts</Box>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setDeleteAllDialogOpen(false)}
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
            onClick={handleDeleteAllAccounts} 
            color="error" 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(255, 59, 48, 0.2)',
              ml: 1,
              '&:hover': {
                boxShadow: '0 4px 12px rgba(255, 59, 48, 0.3)'
              }
            }}
          >
            {isSaving ? <CircularProgress size={24} thickness={4} /> : "Delete All"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Information Dialog */}
      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            p: 1,
            maxWidth: '500px'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            fontWeight: 600,
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          {infoDialogIcon === 'error' && <ErrorIcon color="error" />}
          {infoDialogIcon === 'warning' && <WarningIcon color="warning" />}
          {infoDialogIcon === 'info' && <InfoIcon color="info" />}
          {infoDialogTitle}
        </DialogTitle>
        <DialogContent>
          {infoDialogMessage.split('\n').map((line, index) => (
            <Typography 
              key={index} 
              variant="body1" 
              sx={{ 
                color: 'text.primary',
                mb: line.trim() === '' ? 0.5 : 1.5,
                lineHeight: 1.4,
                fontWeight: line.includes('✅') || line.includes('⚠️') ? 500 : 400,
              }}
            >
              {line}
            </Typography>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setInfoDialogOpen(false)}
            variant="contained"
            sx={{ 
              borderRadius: 2,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0, 113, 227, 0.2)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)'
              }
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Large CSV Import */}
      <Dialog
        open={confirmImportDialogOpen}
        onClose={() => {
          setConfirmImportDialogOpen(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            p: 1,
            maxWidth: '500px'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            fontWeight: 600,
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <WarningIcon color="warning" />
          Large CSV File Detected
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            The CSV file you selected appears to contain approximately {estimatedAccountCount} accounts.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Due to the 70 account limit, only the first {70 - accounts.length > 0 ? 70 - accounts.length : 0} accounts can be imported if there's space available.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Would you like to continue with the import?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => {
              setConfirmImportDialogOpen(false);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
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
              setConfirmImportDialogOpen(false);
              if (fileToImport) {
                processImport(fileToImport);
                setFileToImport(null);
              }
            }}
            variant="contained"
            color="primary"
            sx={{ 
              borderRadius: 2,
              ml: 2,
              boxShadow: '0 2px 8px rgba(0, 113, 227, 0.2)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)'
              }
            }}
          >
            Import Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TargetAccountsPage; 