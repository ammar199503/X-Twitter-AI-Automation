import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Alert,
  Slider,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import ApiService from '../services/api';

const modelOptions = [
  {
    value: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    helperText: 'Balanced performance and cost (16,384 tokens)',
  },
  {
    value: 'gpt-4',
    label: 'GPT-4',
    helperText: 'Original GPT-4 model (8,192 tokens)',
  },
  {
    value: 'gpt-4o',
    label: 'GPT-4o',
    helperText: 'Latest multimodal model with top performance (16,384 tokens)',
  },
];

// Define token limits for each model
const MODEL_TOKEN_LIMITS = {
  'gpt-4': 8192,
  'gpt-4o': 16384,
  'gpt-4o-mini': 16384,
  // Defaults for other models in case they're still in the UI
  'gpt-3.5-turbo': 4096,
  'gpt-4-turbo': 16384,
  'gpt-4-turbo-preview': 16384,
  'gpt-4o-latest': 16384,
  'gpt-4.5-preview': 16384
};

// Helper function to get the token limit for a model
const getModelTokenLimit = (modelValue) => {
  return MODEL_TOKEN_LIMITS[modelValue] || 4096; // Default to 4096 if unknown
};

// Helper function to get the display name for a model
const getModelName = (modelValue) => {
  const model = modelOptions.find(option => option.value === modelValue);
  return model ? model.label : modelValue || 'selected model';
};

const OpenAIConfigPage = () => {
  const navigate = useNavigate();
  
  // Form state
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(null);
  const [maxTokens, setMaxTokens] = useState(null);
  
  // Store backend defaults
  const [backendDefaults, setBackendDefaults] = useState({
    systemPrompt: '',
    userPromptTemplate: ''
  });
  
  // The required separator format that will always be included
  const REQUIRED_SEPARATOR = '- Format multiple tweets with "---" between them';
  
  // Initialize the system prompt state with empty value
  const [systemPrompt, setSystemPrompt] = useState('');
  
  // Function to get the complete system prompt including the hidden separator
  const getCompleteSystemPrompt = (visiblePrompt) => {
    return `${visiblePrompt}\n${REQUIRED_SEPARATOR}`;
  };

  // The base user prompt template without the tweets placeholder
  const baseUserPromptTemplate = `As a crypto news social media manager, review these tweets from influencers and identify ALL relevant crypto news items. Rephrase each one as a concise, engaging news tweet:

Remember: Select ALL relevant crypto/financial news, ignore giveaways or non-news content, keep each tweet under 280 characters, and only include attribution when posting someone's claims.`;

  // The required tweets placeholder that will always be included
  const REQUIRED_TWEETS_PLACEHOLDER = '\n{tweets}\n';
  
  // Initialize the user prompt template state with empty value
  const [userPromptTemplate, setUserPromptTemplate] = useState('');
  
  // Function to get the complete user prompt template including the placeholder
  const getCompleteUserPrompt = (visiblePrompt) => {
    const parts = visiblePrompt.split(REQUIRED_TWEETS_PLACEHOLDER);
    if (parts.length === 2) {
      // If placeholder exists, ensure it's in the middle
      return `${parts[0]}${REQUIRED_TWEETS_PLACEHOLDER}${parts[1]}`;
    }
    // If no placeholder, find a suitable location to insert it (after the first paragraph)
    const paragraphs = visiblePrompt.split('\n\n');
    if (paragraphs.length > 1) {
      return `${paragraphs[0]}${REQUIRED_TWEETS_PLACEHOLDER}${paragraphs.slice(1).join('\n\n')}`;
    }
    // If no paragraphs, just add it in the middle
    return `${visiblePrompt}${REQUIRED_TWEETS_PLACEHOLDER}`;
  };

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [originalApiKey, setOriginalApiKey] = useState('');
  
  // Load current configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const response = await ApiService.config.getOpenAIConfig();
        
        if (response.data && response.data.success) {
          const { openai } = response.data;
          // Store masked API key
          setOriginalApiKey(openai.apiKey || '');
          
          // Store backend default values for reset functionality
          setBackendDefaults({
            systemPrompt: openai.systemPrompt || '',
            userPromptTemplate: openai.userPromptTemplate || ''
          });
          
          // Set other values from the backend response
          setModel(openai.model || '');
          setTemperature(openai.temperature !== undefined ? openai.temperature : null);
          setMaxTokens(openai.maxTokens || null);
          
          // Remove the separator format if it exists in the loaded prompt
          const loadedPrompt = openai.systemPrompt || '';
          setSystemPrompt(loadedPrompt.replace(`\n${REQUIRED_SEPARATOR}`, ''));
          
          // Remove the tweets placeholder if it exists in the loaded prompt
          const loadedUserPrompt = openai.userPromptTemplate || '';
          setUserPromptTemplate(loadedUserPrompt.replace(REQUIRED_TWEETS_PLACEHOLDER, ''));
        }
      } catch (error) {
        console.error('Error loading OpenAI config:', error);
        setError('Failed to load configuration. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConfig();
  }, []);
  
  // Add effect to adjust maxTokens when model changes
  useEffect(() => {
    if (model && maxTokens) {
      const tokenLimit = getModelTokenLimit(model);
      // If current maxTokens exceeds the limit for the newly selected model, adjust it
      if (maxTokens > tokenLimit) {
        setMaxTokens(tokenLimit);
      }
    }
  }, [model]);
  
  const handleSave = async () => {
    try {
      // Validate max tokens before saving
      if (maxTokens !== null) {
        const tokenLimit = getModelTokenLimit(model);
        if (maxTokens > tokenLimit) {
          setError(`Max tokens (${maxTokens}) exceeds the limit for ${getModelName(model)} (${tokenLimit}). Please correct this value before saving.`);
          return;
        }
        if (maxTokens < 10) {
          setError('Max tokens must be at least 10. Please correct this value before saving.');
          return;
        }
      }
      
      setIsSaving(true);
      setError('');
      setSuccess('');
      
      // Only include API key if it was changed
      const apiKeyToSend = apiKey === '' ? null : apiKey;
      
      const response = await ApiService.config.updateOpenAIConfig({
        apiKey: apiKeyToSend,
        model,
        temperature,
        maxTokens,
        // Always include both the separator format and tweets placeholder when saving
        systemPrompt: getCompleteSystemPrompt(systemPrompt),
        userPromptTemplate: getCompleteUserPrompt(userPromptTemplate)
      });
      
      if (response.data && response.data.success) {
        setSuccess('OpenAI configuration saved successfully! You can now return to the dashboard.');
        
        // If we sent an API key, clear the input field
        if (apiKeyToSend) {
          setApiKey('');
          setOriginalApiKey(response.data.openai.apiKey || '');
        }
      }
    } catch (error) {
      console.error('Error saving OpenAI config:', error);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };
  
  return (
    <Container maxWidth="md">
      <Box mb={4}>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton 
            onClick={handleBackToDashboard}
            sx={{ mr: 2 }}
            aria-label="Back to dashboard"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="600">
            OpenAI Configuration
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Configure the OpenAI integration for tweet rephrasing.
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="API Settings" 
          subheader="Configure your OpenAI API credentials and model settings"
        />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="OpenAI API Key"
                variant="outlined"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={originalApiKey || "Enter your OpenAI API key"}
                helperText={
                  originalApiKey 
                    ? "API key is saved. Enter a new one only if you want to change it." 
                    : "Required for OpenAI integration"
                }
                type="password"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="model-select-label">Model</InputLabel>
                <Select
                  labelId="model-select-label"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  label="Model"
                >
                  {modelOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box>
                        <Typography variant="body1">{option.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.helperText}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Select the OpenAI model to use for rephrasing
                </FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography gutterBottom>
                  Temperature: {temperature}
                  <Tooltip title="Controls randomness: lower is more deterministic, higher is more creative">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                <Slider
                  value={temperature || 0.7}
                  onChange={(_, newValue) => setTemperature(newValue)}
                  step={0.1}
                  marks
                  min={0}
                  max={1}
                  valueLabelDisplay="auto"
                />
                <FormHelperText>
                  0 = Precise & Predictable, 1 = Creative & Varied
                </FormHelperText>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Guidelines for AI"
                variant="outlined"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                multiline
                rows={8}
                helperText="These guidelines define how the AI should rephrase tweets"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="User Prompt Template" 
          subheader="Template for generating user prompts"
        />
        <Divider />
        <CardContent>
          <TextField
            fullWidth
            label="User Prompt Template"
            variant="outlined"
            value={userPromptTemplate}
            onChange={(e) => setUserPromptTemplate(e.target.value)}
            multiline
            rows={4}
            helperText="This template defines the format for generating user prompts. Use {tweets} as a placeholder."
          />
        </CardContent>
      </Card>
      
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="Max Tokens" 
          subheader="Maximum number of tokens for the generated text"
        />
        <Divider />
        <CardContent>
          <TextField
            fullWidth
            label="Max Tokens"
            variant="outlined"
            value={maxTokens || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              // Only update if it's a valid number
              if (!isNaN(value) || e.target.value === '') {
                setMaxTokens(e.target.value === '' ? null : value);
              }
            }}
            type="number"
            inputProps={{ 
              min: 10,
              max: getModelTokenLimit(model)
            }}
            error={maxTokens && (maxTokens < 10 || maxTokens > getModelTokenLimit(model))}
            helperText={
              maxTokens && maxTokens > getModelTokenLimit(model)
                ? `Value exceeds the limit for ${getModelName(model)}. Maximum is ${getModelTokenLimit(model)}.`
                : `Maximum tokens for ${getModelName(model)}: ${getModelTokenLimit(model)}`
            }
          />
        </CardContent>
      </Card>
      
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="Example Guidelines for AI" 
          subheader="Click on any example to use it as your guidelines"
        />
        <Divider />
        <CardContent>
          <Box mb={2}>
            <Paper 
              variant="outlined" 
              sx={{ p: 2, mb: 2, cursor: 'pointer', '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }, bgcolor: '#f9f9ff' }}
              onClick={() => setSystemPrompt(backendDefaults.systemPrompt.replace(`\n${REQUIRED_SEPARATOR}`, ''))}
            >
              <Typography variant="subtitle1" fontWeight="500">Default (Crypto News)</Typography>
              <Typography variant="body2" color="text.secondary">
                Restore the default crypto news guidelines for rephrasing tweets.
              </Typography>
            </Paper>
            
            <Paper 
              variant="outlined" 
              sx={{ p: 2, mb: 2, cursor: 'pointer', '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' } }}
              onClick={() => setSystemPrompt(`You are a tech news curator who identifies and rephrases tech-related information from tweets.

GUIDELINES:
- Focus ONLY on technology, software updates, hardware releases, and tech industry news
- Highlight new product launches, software releases, and tech industry developments
- Present technological information in accessible terms without oversimplification
- Keep each response concise and under 280 characters
- Include relevant tech hashtags like #Tech #AI #Software (max 2-3 per tweet)
- Mention tech companies and products accurately with proper capitalization
- If reporting on rumors, clearly label them as unconfirmed
- Provide context about the significance of tech developments
- If no tech news is found, clearly state this`)}
            >
              <Typography variant="subtitle1" fontWeight="500">Tech News Reporter</Typography>
              <Typography variant="body2" color="text.secondary">
                A tech-focused reporter who shares technology news, updates, and industry developments.
              </Typography>
            </Paper>
            
            <Paper 
              variant="outlined" 
              sx={{ p: 2, mb: 2, cursor: 'pointer', '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' } }}
              onClick={() => setSystemPrompt(`You are a sports content specialist who identifies and rephrases sports news from tweets.

GUIDELINES:
- Focus on sports events, scores, player transfers, and team developments
- Present sports statistics and data in concise, digestible formats
- Include relevant sports hashtags like #NBA #Football #Olympics (2-3 max)
- Keep updates neutral and factual, even for rivalry matches
- Verify scores and statistics before reporting them
- Cover diverse sports rather than focusing only on mainstream ones
- For match results, include the final score and key highlights
- For transfer news, mention both teams involved
- If no sports news is found, clearly state this`)}
            >
              <Typography variant="subtitle1" fontWeight="500">Sports News Reporter</Typography>
              <Typography variant="body2" color="text.secondary">
                A sports specialist who shares game results, player news, and team updates.
              </Typography>
            </Paper>
            
            <Paper 
              variant="outlined" 
              sx={{ p: 2, cursor: 'pointer', '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' } }}
              onClick={() => setSystemPrompt(`You are an entertainment news specialist who rephrases celebrity and entertainment news from tweets.

GUIDELINES:
- Focus on film, TV, music, and celebrity news
- Report on new releases, industry developments, and entertainment events
- Use an engaging but respectful tone when discussing celebrities
- Avoid rumors and unconfirmed gossip; stick to factual information
- Include relevant entertainment hashtags like #Movies #TVNews #Music (2-3 max)
- For movie or music releases, include release dates when available
- Keep content suitable for general audiences 
- Respect privacy while still reporting newsworthy information
- If no entertainment news is found, clearly state this`)}
            >
              <Typography variant="subtitle1" fontWeight="500">Entertainment Reporter</Typography>
              <Typography variant="body2" color="text.secondary">
                An entertainment specialist who covers celebrity news, movies, TV, and music.
              </Typography>
            </Paper>
          </Box>
        </CardContent>
      </Card>
      
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="Example User Prompt Templates" 
          subheader="Click on any example to use it as your template"
        />
        <Divider />
        <CardContent>
          <Box mb={2}>
            <Paper 
              variant="outlined" 
              sx={{ p: 2, mb: 2, cursor: 'pointer', '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }, bgcolor: '#f9f9ff' }}
              onClick={() => setUserPromptTemplate(backendDefaults.userPromptTemplate.replace(REQUIRED_TWEETS_PLACEHOLDER, ''))}
            >
              <Typography variant="subtitle1" fontWeight="500">Default (Crypto News)</Typography>
              <Typography variant="body2" color="text.secondary">
                Restore the default crypto news template for rephrasing tweets.
              </Typography>
            </Paper>
            
            <Paper 
              variant="outlined" 
              sx={{ p: 2, mb: 2, cursor: 'pointer', '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' } }}
              onClick={() => setUserPromptTemplate(`As a tech news curator, review these tweets and extract ALL relevant technology information:

Remember: Focus on product launches, software updates, tech industry news, and innovations. Keep each tweet under 280 characters and be accurate with technical details.`)}
            >
              <Typography variant="subtitle1" fontWeight="500">Tech News Template</Typography>
              <Typography variant="body2" color="text.secondary">
                A template for reporting on technology news and developments.
              </Typography>
            </Paper>
            
            <Paper 
              variant="outlined" 
              sx={{ p: 2, mb: 2, cursor: 'pointer', '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' } }}
              onClick={() => setUserPromptTemplate(`As a sports reporter, review these tweets and extract ALL relevant sports information:

Remember: Focus on game results, player news, team updates, and sporting events. Keep each tweet under 280 characters and include key statistics when relevant.`)}
            >
              <Typography variant="subtitle1" fontWeight="500">Sports Updates Template</Typography>
              <Typography variant="body2" color="text.secondary">
                A template focused on sports news, results, and updates.
              </Typography>
            </Paper>
            
            <Paper 
              variant="outlined" 
              sx={{ p: 2, cursor: 'pointer', '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' } }}
              onClick={() => setUserPromptTemplate(`As an entertainment news reporter, review these tweets and extract ALL relevant entertainment information:

Remember: Focus on movies, TV shows, music releases, and celebrity news. Keep each tweet under 280 characters and maintain respectful reporting on public figures.`)}
            >
              <Typography variant="subtitle1" fontWeight="500">Entertainment News Template</Typography>
              <Typography variant="body2" color="text.secondary">
                A template for entertainment and celebrity news updates.
              </Typography>
            </Paper>
          </Box>
        </CardContent>
      </Card>
      
      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/config')}
        >
          Back to Scraper Settings
        </Button>
        
        <Box display="flex" alignItems="center" gap={2}>
          {success && (
            <>
              <Alert severity="success" sx={{ mr: 2 }}>
                {success}
              </Alert>
              
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/dashboard')}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  px: 2,
                  fontWeight: 500,
                  boxShadow: '0 2px 10px rgba(0, 113, 227, 0.2)',
                  '&:hover': {
                    boxShadow: '0 4px 15px rgba(0, 113, 227, 0.3)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Go to Dashboard
              </Button>
            </>
          )}
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={isLoading || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default OpenAIConfigPage; 