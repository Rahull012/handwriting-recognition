import { Container, TextField, Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useState } from 'react';
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:4000/auth/login', {
        email,
        password,
      });
      localStorage.setItem('token', response.data.token); // Store token in localStorage
      alert('Login successful');
      navigate('/upload');
    } catch (error) {
      alert('Invalid credentials');
    }
  };

  return (
    <Container maxWidth="xs">
      <Typography variant="h4" gutterBottom align="center">
        Login
      </Typography>
      <Box>
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          variant="outlined"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleLogin}
        >
          Login
        </Button>
        <Typography
          variant="body2"
          color="textSecondary"
          align="center"
          style={{ marginTop: '10px' }}
        >
          Not registered?{' '}
          <Button variant="text" onClick={() => navigate('/register')}>
            Register
          </Button>
        </Typography>
      </Box>
    </Container>
  );
};

export default LoginPage;
