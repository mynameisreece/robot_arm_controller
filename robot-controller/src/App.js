import React, { useState, useCallback } from 'react';
import { Button, Grid, Typography, Box, TextField, CircularProgress, Snackbar } from '@mui/material';

// Hook for fetch with timeout
const useTimeoutFetch = (url, options, timeout = 5000) => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');

  const fetchWithTimeout = useCallback(async () => {
    setIsLoading(true);
    setResponse('');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server Error: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data.message || data.pose);
    } catch (error) {
      if (error.name === 'AbortError') {
        setResponse('Request timed out');
      } else if (error.name === 'TypeError') {
        setResponse('Network error. Please check your connection.');
      } else {
        setResponse(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [url, options, timeout]);

  return { fetchWithTimeout, isLoading, response };
};

const App = () => {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [movementDistance, setMovementDistance] = useState(''); // For Movement Distance input
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const buttonStyle = {
    fullWidth: true,
    disabled: isLoading,
    variant: 'contained',
  };

  const commandStyle = {
    ...buttonStyle,
    sx: { marginBottom: 2 },
  };

  const shutdownButtonStyle = {
    ...buttonStyle,
    sx: {
      marginTop: 2,
      marginBottom: 2,
      backgroundColor: '#FF0000',
      '&:hover': { backgroundColor: '#D40000' },
    },
  };

  const handleButtonClick = async (command, locationInput = '') => {
    setIsLoading(true);
    setResponse('');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 5000);

    try {
      const body = {
        command,
        location: locationInput || undefined,
        distance: parseFloat(movementDistance) || undefined,
      };
      
      const res = await fetch('http://localhost:5000/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server Error: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data.message || data.pose);
      setSnackbarOpen(true);
    } catch (error) {
      if (error.name === 'AbortError') {
        setResponse('Request timeout. The robot may not be available.');
      } else if (error.name === 'TypeError') {
        setResponse('Network error. Please check your connection.');
      } else {
        setResponse(`Error: ${error.message}`);
      }
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSubmit = async () => {
    if (!location) {
      setResponse('Please enter a location.');
      setSnackbarOpen(true);
      return;
    }

    await handleButtonClick('show_location', location);
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Robot Control Panel
      </Typography>

      {/* Directional buttons */}
      <Grid container spacing={2} justifyContent="center" direction="column" alignItems="center">
        <Grid item>
          <Button
            {...commandStyle}
            onClick={() => handleButtonClick('move_up')}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Move Up'}
          </Button>
        </Grid>
        
        <Grid container item spacing={2} justifyContent="center" alignItems="center">
          <Grid item>
            <Button
              {...commandStyle}
              onClick={() => handleButtonClick('move_left')}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Move Left'}
            </Button>
          </Grid>
          <Grid item>
            <Button
              {...commandStyle}
              onClick={() => handleButtonClick('move_right')}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Move Right'}
            </Button>
          </Grid>
        </Grid>

        <Grid item>
          <Button
            {...commandStyle}
            onClick={() => handleButtonClick('move_down')}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Move Down'}
          </Button>
        </Grid>
      </Grid>

      {/* Additional command buttons */}
      <Grid container spacing={2} justifyContent="center" sx={{ marginTop: 3 }}>
        {['print_pose', 'home_pose', 'globe_pose', "ready_pose", 'release_gripper', 'grasp_gripper', 'sleep_pose'].map((command) => (
          <Grid item xs={6} sm={4} md={3} key={command}>
            <Button
              {...commandStyle}
              onClick={() => handleButtonClick(command)}
            >
              {command.replace('_', ' ').toUpperCase()}
            </Button>
          </Grid>
        ))}
      </Grid>

      {/* Show Location and Movement Distance fields */}
      <Grid container spacing={2} justifyContent="center" sx={{ marginTop: 3 }}>
        <Grid item xs={6}>
          <TextField
            label="Enter Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
            disabled={isLoading}
          />
        </Grid>
        <Grid item xs={6}>
          <Button
            {...commandStyle}
            onClick={handleLocationSubmit}
            disabled={isLoading}
          >
            Show Location
          </Button>
        </Grid>
      </Grid>

      <Grid container spacing={2} justifyContent="center" sx={{ marginTop: 3 }}>
        <Grid item xs={6}>
          <TextField
            label="Movement Distance"
            value={movementDistance}
            onChange={(e) => setMovementDistance(e.target.value)}
            fullWidth
            disabled={isLoading}
            type="number"
            inputProps={{ step: "0.1" }}
          />
        </Grid>
      </Grid>

      {/* Shutdown */}
      <Grid container spacing={2} justifyContent="center" direction="column" alignItems="center">
        <Grid item>
          <Button
            {...shutdownButtonStyle}
            onClick={() => handleButtonClick('shutdown')}
          >
            Shutdown
          </Button>
        </Grid>
      </Grid>

      {/* Snackbar for responses */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={response}
      />
    </Box>
  );
};

export default App;
