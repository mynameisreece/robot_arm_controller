import React, { useState, useCallback } from 'react';
import { Button, Grid, Typography, Box, TextField } from '@mui/material';

// Custom hook for fetch with timeout
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
      } else if (error.message.includes('NetworkError')) {
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
  const [isLoading, setIsLoading] = useState(false); // To show loading state
  const [location, setLocation] = useState(''); // For the "Show Location" command input

  const buttonStyle = {
    fullWidth: true,
    disabled: isLoading,
    variant: 'contained',
  };

  const commandStyle = {
    ...buttonStyle,
    sx: {
      marginBottom: 2, // Add spacing between buttons
    },
  };

  const shutdownButtonStyle = {
    ...buttonStyle,
    sx: {
      marginTop: 2,
      marginBottom: 2,
      backgroundColor: '#FF0000',
      '&:hover': {
        backgroundColor: '#D40000',
      },
    },
  };

  // Handle button clicks (commands)
  const handleButtonClick = async (command, locationInput = '') => {
    setIsLoading(true); // Start loading
    setResponse(''); // Clear previous response

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort(); // Abort the fetch request after 5 seconds
    }, 5000);

    try {
      const body = command === 'show_location' ? { command, location: locationInput } : { command };
      const res = await fetch('http://localhost:5000/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId); // Clear timeout if request completes on time

      if (!res.ok) {
        throw new Error(`Server Error: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data.message || data.pose);
    } catch (error) {
      if (error.name === 'AbortError') {
        setResponse('Request timeout. The robot may not be available.');
      } else if (error.message.includes('NetworkError')) {
        setResponse('Network error. Please check your connection.');
      } else {
        setResponse(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const commands = [
    'print_pose', 'home_pose', 'globe_pose', "ready_pose",
    'release_gripper', 'grasp_gripper', 'sleep_pose',
  ];

  // Handle location submit
  const handleLocationSubmit = async () => {
    if (!location) {
      setResponse('Please enter a location.');
      return;
    }

    // Send location command with entered location
    await handleButtonClick('show_location', location);
  };

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
            Move Up
          </Button>
        </Grid>

        <Grid container item spacing={2} justifyContent="center" alignItems="center">
          <Grid item>
            <Button
              {...commandStyle}
              onClick={() => handleButtonClick('move_left')}
            >
              Move Left
            </Button>
          </Grid>
          <Grid item>
            <Button
              {...commandStyle}
              onClick={() => handleButtonClick('move_right')}
            >
              Move Right
            </Button>
          </Grid>
        </Grid>

        <Grid item>
          <Button
            {...commandStyle}
            onClick={() => handleButtonClick('move_down')}
          >
            Move Down
          </Button>
        </Grid>
      </Grid>

      {/* Additional command buttons */}
      <Grid container spacing={2} justifyContent="center" sx={{ marginTop: 3 }}>
        {commands.map((command) => (
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

      {/* Show Location */}
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

      {/* Response */}
      <Box sx={{ marginTop: 3 }}>
        <Typography variant="h6">
          {isLoading ? 'Loading...' : `Response: ${response}`}
        </Typography>
      </Box>
    </Box>
  );
};

export default App;

