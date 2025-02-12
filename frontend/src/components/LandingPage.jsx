import { Typography, Button, Container, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" style={{ textAlign: 'center', marginTop: '20%' }}>
      <Typography variant="h2" gutterBottom>
        Handwriting Recognition
      </Typography>
      <Box
        sx={{
          animation: 'float 3s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-20px)' },
          },
        }}
      >
        <Typography variant="body1" color="textSecondary">
          Analyze handwritten text , convert it into editable text and download it.
        </Typography>
      </Box>
      <Button
        variant="contained"
        color="primary"
        style={{ marginTop: '20px' }}
        onClick={() => navigate('/login')}
      >
        Get Started
      </Button>
    </Container>
  );
};

export default LandingPage;
