import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Button,
  Box,
  TextareaAutosize,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Drawer,
  IconButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import axios from 'axios';
import html2pdf from 'html2pdf.js';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Hook for navigation
  const { correctedText: initialText = '', userId = 'default' } = location.state || {}; // Fallbacks
  const [correctedText, setCorrectedText] = useState(initialText);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechPaused, setSpeechPaused] = useState(false);
  const isEnglishText = (text) => /^[\x00-\x7F]*$/.test(text);
  const saveToHistory = async () => {
    if (correctedText.trim()) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found. Please log in again.');
          alert('Session expired. Please log in again.');
          return; // Early exit
        }

        await axios.post(
          'http://localhost:4000/api/history',
          { correctedText },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert('Text saved to history successfully!');

        // Navigate back to the upload page
      } catch (err) {
        console.error('Error saving history:', err);
        if (err.response && err.response.status === 401) {
          alert('Unauthorized. Please log in again.');
        }
      }
    }
  };

  const handleTextChange = (event) => {
    setCorrectedText(event.target.value);
  };

  const handleDownloadAsPDF = () => {
    if (!correctedText) return;

    const element = document.createElement('div');
    element.style.padding = '20px';
    element.innerHTML = `<h3></h3><p>${correctedText.replace(/\n/g, '<br/>')}</p>`;

    const options = {
      margin: 1,
      filename: 'corrected_history.pdf',
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    html2pdf()
      .from(element)
      .set(options)
      .save();
  };

  const textToSpeech = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
  
      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find((voice) => voice.lang.startsWith('en'));
  
  
      const utterance = new SpeechSynthesisUtterance();
      utterance.voice = englishVoice;
      utterance.text = correctedText;
  
      utterance.onstart = () => {
        setIsSpeaking(true); // Start speaking
      };
  
      utterance.onend = () => {
        setIsSpeaking(false); // Reset state after speaking ends
        setSpeechPaused(false);
      };
  
      speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser.');
    }
  };
  
  

  const pauseSpeech = () => {
    if (speechSynthesis.speaking && !speechPaused) {
      speechSynthesis.pause();
      setSpeechPaused(true);
    }
  };

  const resumeSpeech = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setSpeechPaused(false);
    }
  };

  const stopSpeech = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeechPaused(false);
  };

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }
    setIsDrawerOpen(open);
  };

  const handleMenuClick = (action) => {
    switch (action) {
      case 'back':
        navigate(-1);
        break;
      case 'logout':
        localStorage.removeItem('token');
        navigate('/login');
        break;
      default:
        break;
    }
  };

  return (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      {/* Header */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          backgroundColor: 'lightgray',
          display: 'flex',
          alignItems: 'center',
          padding: 2,
        }}
      >
        <IconButton onClick={toggleDrawer(true)}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ marginLeft: 2 }}>
          Corrected Text Viewer
        </Typography>
      </Box>

      {/* Drawer */}
      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <List>
            <ListItem button onClick={() => handleMenuClick('back')}>
              <ListItemText primary="Back" />
            </ListItem>
            <ListItem button onClick={() => handleMenuClick('logout')}>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ marginTop: 10 }}>
        <Typography variant="h4" gutterBottom>
          Corrected Text
        </Typography>

        <TextareaAutosize
          minRows={10}
          placeholder="Edit your corrected text here..."
          value={correctedText}
          onChange={handleTextChange}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            marginBottom: '20px',
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
          <Button variant="contained" color="primary" onClick={handleDownloadAsPDF} sx={{ mt: 2 }}>
            Download as PDF
          </Button>
          <Button variant="outlined" color="secondary" onClick={saveToHistory} sx={{ mt: 2 }}>
            Save to History
          </Button>
          {isEnglishText(correctedText) && (
        <Button
          variant="contained"
          color="secondary"
          onClick={textToSpeech}
          sx={{ mt: 2 }}
        >
          Listen to Text
        </Button>
      )}
          {isSpeaking && (
          <>
            <Button
              variant="outlined"
              color="secondary"
              onClick={pauseSpeech}
              sx={{ mt: 2, mr: 2 }}
              disabled={speechPaused}
            >
              Pause
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              onClick={resumeSpeech}
              sx={{ mt: 2, mr: 2 }}
              disabled={!speechPaused}
            >
              Resume
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={stopSpeech}
              sx={{ mt: 2 }}
            >
              Stop
            </Button>
          </>
        )}
        </Box>
      </Box>
    </Box>
  );
};

export default ResultPage;