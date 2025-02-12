import { useState } from 'react';
import {
  Container,
  Button,
  Typography,
  Box,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  ListSubheader,
  TextareaAutosize
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UndoIcon from '@mui/icons-material/Undo';
import html2pdf from 'html2pdf.js';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [revertedText, setRevertedText] = useState('');

  const navigate = useNavigate();

  const handleRevert = (text) => {
    setRevertedText(text); // Load the selected history record into the textarea
  };


const handleDownloadAsPDF = () => {
  if (!revertedText) return;

  const element = document.createElement('div');
  element.style.padding = '20px';
  element.innerHTML = `<h3></h3><p>${revertedText.replace(/\n/g, '<br/>')}</p>`;

  const options = {
    margin: 1,
    filename: 'edited_history.pdf',
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
  };

  html2pdf().from(element).set(options).save();
};
  

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please upload an image.');
      return;
    }
  
    if (!language || language === "") {
      alert('Please select a language.');
      return;
    }
  
    const formData = new FormData();
    formData.append('image', file);
    formData.append('language', language);
  
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/upload', formData);
      const correctedText = response.data.correctedText;
      navigate('/result', { state: { correctedText } });
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setLoading(false);
    }
  };  
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:4000/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.length === 0) {
        alert('No history is there.');
        setIsHistoryVisible(false);
      } else {
        setHistory(res.data);
        setIsHistoryVisible(true);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryRecord = async (recordId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to delete history.');
        return;
      }
  
      const res = await axios.delete(`http://localhost:4000/api/history/${recordId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Update history state to remove the deleted record
      const updatedHistory = history.filter((entry) => entry._id !== recordId);
      setHistory(updatedHistory);
  
      alert(res.data?.msg || 'Record deleted successfully!');
  
      // If history is empty after deletion, hide the history block
      if (updatedHistory.length === 0) {
        setIsHistoryVisible(false);
      }
    } catch (err) {
      console.error('Error deleting history record:', err.response?.data || err.message);
      alert(err.response?.data?.msg || 'An error occurred while deleting the record.');
    }
  };
  

  const clearHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to clear history.');
        return;
      }

      const res = await axios.delete('http://localhost:4000/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setHistory([]);
      setIsHistoryVisible(false);
      alert(res.data?.msg || 'History cleared successfully!');
    } catch (err) {
      console.error('Error clearing history:', err.response?.data || err.message);
      alert(err.response?.data?.msg || 'An error occurred while clearing history.');
    }
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
      case 'searchHistory':
        fetchHistory();
        break;
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
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: 2,
          backgroundColor: 'lightgray',
        }}
      >
        <IconButton onClick={toggleDrawer(true)}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ marginLeft: 2 }}>
          Upload Handwritten Image
        </Typography>
      </Box>

      <Drawer anchor="left" open={isDrawerOpen} onClose={toggleDrawer(false)}>
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
            <ListItem button onClick={() => handleMenuClick('searchHistory')}>
              <ListItemText primary="Search History" />
            </ListItem>
            <ListItem button onClick={() => handleMenuClick('logout')}>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {!isHistoryVisible && (
        <Container maxWidth="sm">
          <Box sx={{ mt: 5, textAlign: 'center' }}>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Select Language of the Handwritten image uploaded above</InputLabel>
                <Select
                  value={language}
                  onChange={handleLanguageChange}
                  label="Select Language of the Handwritten image uploaded above"
                >
                  <MenuItem value="">
                    <em>Select Language</em>
                  </MenuItem>
                  <MenuItem value="eng">English</MenuItem>
                  <MenuItem value="te">Telugu</MenuItem>
                  <MenuItem value="hi">Hindi</MenuItem>
                  <MenuItem value="ta">Tamil</MenuItem>
                  <MenuItem value="mal">Malayalam</MenuItem>
                  <MenuItem value="kan">Kannada</MenuItem>
                  <MenuItem value="mr">Marathi</MenuItem>
                </Select>
              </FormControl>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              sx={{ mt: 2 }}
            >
              Upload
            </Button>
            {loading && <CircularProgress sx={{ mt: 2 }} />}
          </Box>
        </Container>
      )}
      {isHistoryVisible && !revertedText && (
  <Box sx={{ mt: 4, textAlign: 'center' }}>
    <Typography variant="h5" gutterBottom>
      History
    </Typography>
    <List
      subheader={<ListSubheader>Previous Search History</ListSubheader>}
      sx={{ textAlign: 'left', mx: 'auto', maxWidth: '60%' }}
    >
      {history.map((entry) => (
        <ListItem key={entry._id} divider>
          <ListItemText primary={entry.correctedText} />
          <IconButton
            color="primary"
            onClick={() => handleRevert(entry.correctedText)}
            sx={{ mr: 1 }}
          >
            <UndoIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => deleteHistoryRecord(entry._id)}
          >
            <DeleteIcon />
          </IconButton>
        </ListItem>
      ))}
    </List>
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
      <Button variant="contained" color="error" onClick={clearHistory}>
        Clear History
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => setIsHistoryVisible(false)}
      >
        Close History
      </Button>
    </Box>
  </Box>
)}

{/* Edit History Record Section */}
{revertedText && (
  <Box sx={{ mt: 4, textAlign: 'center' }}>
    <Typography variant="h6" gutterBottom>
      Edit History Record
    </Typography>
    <TextareaAutosize
      minRows={10}
      value={revertedText}
      onChange={(e) => setRevertedText(e.target.value)}
      style={{
        width: '100%',
        padding: '10px',
        fontSize: '16px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        marginBottom: '20px',
      }}
    />
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleDownloadAsPDF}
      >
        Download as PDF
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => setRevertedText('')}
      >
        Close Edit History Record
      </Button>
    </Box>
  </Box>
)}

    </>
  );
};

export default UploadPage;
