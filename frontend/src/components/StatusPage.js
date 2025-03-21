import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Spinner, Container, Row, Col, Badge, ListGroup, Modal } from 'react-bootstrap';
import ApiService from '../services/api';
import { useNavigate } from 'react-router-dom';

const StatusPage = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [credentials, setCredentials] = useState({ username: '', password: '', email: '' });
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isBotDetection, setIsBotDetection] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isHandlingBotDetection, setIsHandlingBotDetection] = useState(false);
  const navigate = useNavigate();

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAppStatus();
      setStatus(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch application status. Please try again.');
      console.error('Error fetching status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Poll for status updates every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };

  const handleReauthenticate = async (e) => {
    e.preventDefault();
    setAuthenticating(true);
    setAuthError(null);
    setIsBotDetection(false);

    try {
      await ApiService.status.reauthenticate(credentials);
      setCredentials({ username: '', password: '', email: '' });
      await fetchStatus(); // Refresh status after reauthentication
    } catch (err) {
      console.error('Reauthentication error:', err);
      
      // Check if this is a bot detection error
      if (err.response?.data?.errorType === 'botDetection' || 
          err.response?.data?.error?.includes('bot detection') ||
          err.response?.data?.error?.includes('Arkose') ||
          err.response?.data?.error?.includes('verification')) {
        setIsBotDetection(true);
        setAuthError('Twitter bot detection triggered. Please see recommendations below.');
      } else {
        setAuthError('Failed to authenticate with Twitter. Please check your credentials.');
      }
    } finally {
      setAuthenticating(false);
    }
  };

  const handleHandleBotDetection = async () => {
    setIsHandlingBotDetection(true);
    try {
      await ApiService.auth.handleBotDetection();
      setAuthError('Bot detection handling attempted. Please wait 5-10 minutes before trying to log in again.');
      setIsBotDetection(false);
    } catch (err) {
      setAuthError('Failed to handle bot detection. Please try again later.');
      console.error('Error handling bot detection:', err);
    } finally {
      setIsHandlingBotDetection(false);
    }
  };

  const handleResumeScraping = async () => {
    try {
      await ApiService.status.resume();
      await fetchStatus();
    } catch (err) {
      setError('Failed to resume scraping. Please try again.');
      console.error('Error resuming scraping:', err);
    }
  };

  const handlePauseScraping = async () => {
    try {
      await ApiService.status.pause('Manual pause by user');
      await fetchStatus();
    } catch (err) {
      setError('Failed to pause scraping. Please try again.');
      console.error('Error pausing scraping:', err);
    }
  };

  const getStatusBadge = () => {
    if (!status || !status.scraperStatus) return <Badge bg="secondary">Unknown</Badge>;

    if (status.scraperStatus.isPaused) {
      return <Badge bg="warning">Paused: {status.scraperStatus.pauseReason || 'Manual pause'}</Badge>;
    } else if (status.scraperStatus.isRunning) {
      return <Badge bg="success">Running</Badge>;
    } else {
      return <Badge bg="danger">Stopped</Badge>;
    }
  };

  const getAuthBadge = () => {
    if (!status) return <Badge bg="secondary">Unknown</Badge>;
    
    return status.twitterLoggedIn ? 
      <Badge bg="success">Authenticated</Badge> : 
      <Badge bg="danger">Not Authenticated</Badge>;
  };

  if (loading && !status) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="my-4">System Status</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>Scraper Status</Card.Header>
            <Card.Body>
              <Card.Title>
                Status: {getStatusBadge()}
              </Card.Title>
              
              {status?.scraperStatus && (
                <>
                  <Card.Text>
                    <strong>Processed Links:</strong> {status.scraperStatus.processedLinksCount || 0}
                  </Card.Text>
                  
                  {status.scraperStatus.isPaused && status.scraperStatus.pauseReason && (
                    <Alert variant="info">
                      Scraping is paused: {status.scraperStatus.pauseReason}
                    </Alert>
                  )}
                </>
              )}
              
              <div className="mt-3">
                {status?.scraperStatus?.isRunning && !status?.scraperStatus?.isPaused && (
                  <Button variant="warning" onClick={handlePauseScraping}>
                    Pause Scraping
                  </Button>
                )}
                
                {(!status?.scraperStatus?.isRunning || status?.scraperStatus?.isPaused) && (
                  <Button variant="success" onClick={handleResumeScraping} 
                    disabled={!status?.twitterLoggedIn}>
                    Resume Scraping
                  </Button>
                )}
                
                <Button variant="secondary" className="ms-2" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={6}>
          <Card>
            <Card.Header>Twitter Authentication</Card.Header>
            <Card.Body>
              <Card.Title>
                Status: {getAuthBadge()}
              </Card.Title>
              
              {!status?.twitterLoggedIn && (
                <>
                  <Alert variant="warning" className="mt-3">
                    Authentication with Twitter is required to resume scraping.
                  </Alert>
                  
                  {isBotDetection && (
                    <Alert variant="danger" className="mb-3">
                      <Alert.Heading>Twitter Bot Detection Triggered</Alert.Heading>
                      <p>Twitter has detected automated access and is blocking login attempts. Please try the following:</p>
                      <ListGroup className="mb-3">
                        <ListGroup.Item>Wait 5-10 minutes before trying again</ListGroup.Item>
                        <ListGroup.Item>Use a different IP address if possible (try mobile data, VPN)</ListGroup.Item>
                        <ListGroup.Item>Log in directly to Twitter.com first and complete any verification</ListGroup.Item>
                        <ListGroup.Item>Use a real/active Twitter account that regularly logs in</ListGroup.Item>
                      </ListGroup>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => setShowHelp(true)}
                      >
                        Learn More About Bot Detection
                      </Button>
                      <hr />
                      <Button 
                        variant="primary" 
                        onClick={handleHandleBotDetection} 
                        disabled={isHandlingBotDetection}
                        className="mt-1"
                      >
                        {isHandlingBotDetection ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />{' '}
                            Handling...
                          </>
                        ) : 'Try to Handle Bot Detection'}
                      </Button>
                    </Alert>
                  )}
                  
                  <Form onSubmit={handleReauthenticate}>
                    {authError && !isBotDetection && <Alert variant="danger">{authError}</Alert>}
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Twitter Username</Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={credentials.username}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Twitter Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={credentials.password}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Email (Optional - for account recovery)</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={credentials.email}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                    
                    <Button type="submit" variant="primary" disabled={authenticating}>
                      {authenticating ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />{' '}
                          Authenticating...
                        </>
                      ) : (
                        'Authenticate with Twitter'
                      )}
                    </Button>
                  </Form>
                </>
              )}
              
              {status?.twitterLoggedIn && (
                <Alert variant="success">
                  Successfully authenticated with Twitter.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Bot Detection Help Modal */}
      <Modal show={showHelp} onHide={() => setShowHelp(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Understanding Twitter Bot Detection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>What is happening?</h5>
          <p>
            Twitter (X) uses a sophisticated system called Arkose Labs to detect and block automated access to their platform. 
            This system is preventing our application from logging in to your Twitter account.
          </p>
          
          <h5>How to resolve the issue:</h5>
          <ListGroup variant="flush" className="mb-3">
            <ListGroup.Item>
              <strong>Wait before retrying</strong>: Twitter often temporarily blocks IPs that show automated behavior.
              Wait 10-15 minutes before trying again.
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Change your IP address</strong>: Try using a different network (switch from WiFi to mobile data),
              or use a reputable VPN service.
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Login to Twitter manually first</strong>: Open Twitter in your browser and log in.
              Complete any verification steps. This often helps subsequent automated logins.
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Use an active Twitter account</strong>: Accounts that are rarely used or newly created
              trigger more security checks.
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Check account status</strong>: Make sure your Twitter account isn't locked, restricted,
              or requiring additional verification.
            </ListGroup.Item>
          </ListGroup>
          
          <Alert variant="info">
            <strong>Technical Details:</strong> The specific error being encountered is "Unknown subtask ArkoseLogin". 
            This means Twitter is requiring a special verification that our application cannot automatically complete.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHelp(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StatusPage; 