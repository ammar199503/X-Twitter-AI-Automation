import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import ApiService from '../services/api';

const TargetAccountsPage = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [newAccount, setNewAccount] = useState({ account: '', pinnedTweetId: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

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

  const handleAddAccount = async () => {
    // Validate account name
    if (!newAccount.account.trim()) {
      setError('Please enter a valid X/Twitter account name');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      // Format the account name (remove @ if present)
      const accountName = newAccount.account.trim().replace(/^@/, '');
      
      const { data } = await ApiService.config.addTargetAccount({
        account: accountName,
        pinnedTweetId: newAccount.pinnedTweetId.trim(),
      });

      if (data.success) {
        setAccounts(data.targetAccounts);
        setNewAccount({ account: '', pinnedTweetId: '' });
      } else {
        setError(data.error || 'Failed to add target account');
      }
    } catch (error) {
      console.error('Error adding target account:', error);
      setError(error.response?.data?.error || 'Failed to add target account');
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
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  mb: 2 
                }}
              >
                Add Target Account
              </Typography>
              
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
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={isSaving ? <CircularProgress size={20} /> : <AddIcon />}
                    onClick={handleAddAccount}
                    disabled={isSaving || !newAccount.account.trim()}
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
                  Target Accounts ({accounts.length})
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
                                @{account.account}
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
    </Container>
  );
};

export default TargetAccountsPage; 