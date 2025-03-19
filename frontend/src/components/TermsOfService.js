import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  IconButton,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ mt: 6, mb: 6, animation: 'fadeIn 0.4s ease-out' }}>
      <Box sx={{ 
        mb: 5, 
        display: 'flex', 
        alignItems: 'center',
        pb: 3,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <IconButton 
          onClick={() => navigate(-1)} 
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
          Terms of Service
        </Typography>
      </Box>

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
            variant="h5" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              mb: 3 
            }}
          >
            1. Acceptance of Terms
          </Typography>
          <Typography 
            variant="body1" 
            paragraph
            sx={{ 
              mb: 3,
              lineHeight: 1.7
            }}
          >
            By accessing and using this Twitter Scraper & Poster application, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use this application.
          </Typography>

          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              mb: 3,
              mt: 4 
            }}
          >
            2. Description of Service
          </Typography>
          <Typography 
            variant="body1"
            paragraph
            sx={{ 
              mb: 3,
              lineHeight: 1.7
            }}
          >
            This application allows you to scrape tweets from specified Twitter accounts and repost them to your own Twitter account with proper attribution. The application is intended for legitimate content curation and information sharing purposes only.
          </Typography>

          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              mb: 3,
              mt: 4 
            }}
          >
            3. User Responsibilities
          </Typography>
          <Typography 
            variant="body1"
            sx={{ 
              mb: 2,
              lineHeight: 1.7
            }}
          >
            You agree to:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 3 }}>
            <Box component="li" sx={{ mb: 1, lineHeight: 1.7 }}>
              <Typography variant="body1">Use the application in accordance with Twitter's Terms of Service</Typography>
            </Box>
            <Box component="li" sx={{ mb: 1, lineHeight: 1.7 }}>
              <Typography variant="body1">Ensure you have the right to share any content you scrape and repost</Typography>
            </Box>
            <Box component="li" sx={{ mb: 1, lineHeight: 1.7 }}>
              <Typography variant="body1">Properly attribute the original content creators</Typography>
            </Box>
            <Box component="li" sx={{ mb: 1, lineHeight: 1.7 }}>
              <Typography variant="body1">Not use the application for spamming or any illegal activities</Typography>
            </Box>
            <Box component="li" sx={{ mb: 1, lineHeight: 1.7 }}>
              <Typography variant="body1">Not attempt to reverse-engineer or modify the application</Typography>
            </Box>
          </Box>

          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              mb: 3,
              mt: 4 
            }}
          >
            4. Twitter API Usage
          </Typography>
          <Typography 
            variant="body1"
            paragraph
            sx={{ 
              mb: 3,
              lineHeight: 1.7
            }}
          >
            This application uses Twitter's API services. By using this application, you acknowledge that you are also bound by Twitter's Developer Agreement and Policy. We are not responsible for any changes Twitter may make to their API that could affect this application's functionality.
          </Typography>

          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              mb: 3,
              mt: 4 
            }}
          >
            5. Privacy and Data Security
          </Typography>
          <Typography 
            variant="body1"
            paragraph
            sx={{ 
              mb: 3,
              lineHeight: 1.7
            }}
          >
            Your Twitter credentials are stored only on your local machine and are used solely for authentication with Twitter. We do not collect, store, or transmit your credentials to any third parties. Please refer to our Privacy Policy for more details on how we handle your data.
          </Typography>

          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              mb: 3,
              mt: 4 
            }}
          >
            6. Disclaimer of Warranties
          </Typography>
          <Typography 
            variant="body1"
            paragraph
            sx={{ 
              mb: 3,
              lineHeight: 1.7
            }}
          >
            This application is provided "as is" without any warranties, expressed or implied. We do not guarantee uninterrupted, error-free service or specific results from the use of this application.
          </Typography>

          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              mb: 3,
              mt: 4 
            }}
          >
            7. Limitation of Liability
          </Typography>
          <Typography 
            variant="body1"
            paragraph
            sx={{ 
              mb: 3,
              lineHeight: 1.7
            }}
          >
            We shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages resulting from your use of or inability to use the application.
          </Typography>

          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              mb: 3,
              mt: 4 
            }}
          >
            8. Modifications to Terms
          </Typography>
          <Typography 
            variant="body1"
            paragraph
            sx={{ 
              mb: 3,
              lineHeight: 1.7
            }}
          >
            We reserve the right to modify these Terms of Service at any time. Continued use of the application after such modifications constitutes your acceptance of the revised terms.
          </Typography>

          <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
            <Button 
              onClick={() => navigate(-1)} 
              variant="contained"
              sx={{ 
                py: 1.5, 
                px: 4, 
                borderRadius: 2,
                fontWeight: 500,
                boxShadow: '0 2px 10px rgba(0, 113, 227, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 15px rgba(0, 113, 227, 0.4)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Back to Previous Page
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default TermsOfService; 