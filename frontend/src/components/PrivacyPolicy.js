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

const PrivacyPolicy = () => {
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
          Privacy Policy
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
            1. Introduction
          </Typography>
          <Typography 
            variant="body1" 
            paragraph
            sx={{ 
              mb: 3,
              lineHeight: 1.7
            }}
          >
            This Privacy Policy describes how your personal information is collected, used, and shared when you use our Twitter Scraper & Poster application ("the Application"). We are committed to protecting your privacy and the security of your information.
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
            2. Information We Collect
          </Typography>
          <Typography 
            variant="body1"
            sx={{ 
              mb: 2,
              lineHeight: 1.7
            }}
          >
            When you use the Application, we may collect the following types of information:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 3 }}>
            <Box component="li" sx={{ mb: 1, lineHeight: 1.7 }}>
              <Typography variant="body1">
                <Box component="span" sx={{ fontWeight: 600 }}>Twitter Credentials:</Box> Your Twitter username, password, and email address when you log in.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1, lineHeight: 1.7 }}>
              <Typography variant="body1">
                <Box component="span" sx={{ fontWeight: 600 }}>Target Account Information:</Box> The Twitter accounts you choose to monitor.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1, lineHeight: 1.7 }}>
              <Typography variant="body1">
                <Box component="span" sx={{ fontWeight: 600 }}>Configuration Settings:</Box> Your preferences for the Application, such as delay settings and tweet text.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1, lineHeight: 1.7 }}>
              <Typography variant="body1">
                <Box component="span" sx={{ fontWeight: 600 }}>Tweet History:</Box> Links to tweets that have been processed by the Application.
              </Typography>
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
            3. How We Use Your Information
          </Typography>
          <Typography 
            variant="body1"
            paragraph
            sx={{ 
              mb: 3,
              lineHeight: 1.7
            }}
          >
            We use the information we collect to:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 3 }}>
            <Box component="li" sx={{ mb: 1, lineHeight: 1.7 }}>
              <Typography variant="body1">Authenticate you with Twitter's API</Typography>
            </Box>
            <Box component="li" sx={{ mb: 1, lineHeight: 1.7 }}>
              <Typography variant="body1">Provide, maintain, and improve the Application</Typography>
            </Box>
            <Box component="li" sx={{ mb: 1, lineHeight: 1.7 }}>
              <Typography variant="body1">Track which tweets have been processed to avoid duplicates</Typography>
            </Box>
            <Box component="li" sx={{ mb: 1, lineHeight: 1.7 }}>
              <Typography variant="body1">Apply your configuration preferences</Typography>
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
            4. Data Storage and Security
          </Typography>
          <Typography 
            variant="body1"
            paragraph
            sx={{ 
              mb: 3,
              lineHeight: 1.7
            }}
          >
            Your Twitter credentials (username, password, email) are stored only on your local machine and are used solely for authentication with Twitter. They are never sent to our servers or any third parties. Configuration settings and processed tweet history are stored locally in the Application's database.
          </Typography>
          <Typography 
            variant="body1"
            paragraph
            sx={{ 
              mb: 3,
              lineHeight: 1.7
            }}
          >
            We implement appropriate security measures to protect your information. However, please be aware that no method of electronic storage is 100% secure, and we cannot guarantee absolute security.
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
            5. Information Sharing
          </Typography>
          <Typography 
            variant="body1"
            paragraph
            sx={{ 
              mb: 3,
              lineHeight: 1.7
            }}
          >
            We do not share, sell, rent, or trade your information with third parties for their commercial purposes. Your information is only used within the Application for the purposes described above.
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
            6. Twitter's Privacy Policy
          </Typography>
          <Typography 
            variant="body1"
            paragraph
            sx={{ 
              mb: 3,
              lineHeight: 1.7
            }}
          >
            When using the Application, you are also subject to Twitter's Privacy Policy. We recommend reviewing Twitter's Privacy Policy to understand how they collect and use your information.
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
            7. Your Rights and Choices
          </Typography>
          <Typography 
            variant="body1"
            paragraph
            sx={{ 
              mb: 3,
              lineHeight: 1.7
            }}
          >
            You can clear your processed tweet history at any time using the "Clear History" function in the Application. To completely remove all data, you can uninstall the Application from your computer, which will remove all locally stored data.
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
            8. Changes to this Privacy Policy
          </Typography>
          <Typography 
            variant="body1"
            paragraph
            sx={{ 
              mb: 3,
              lineHeight: 1.7
            }}
          >
            We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We encourage you to review this Privacy Policy periodically.
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

export default PrivacyPolicy; 