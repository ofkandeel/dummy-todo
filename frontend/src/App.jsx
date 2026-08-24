// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Paper,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { SignIn, SignOutButton, useUser, useAuth } from '@clerk/clerk-react';

// Use Render backend directly in development
const API_BASE_URL = import.meta.env.DEV 
  ? 'https://dummy-todo-api.onrender.com' 
  : '/api';

function App() {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch todos with authentication
 const fetchTodos = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const token = await getToken();
      console.log('🔑 Token in fetchTodos:', token); // ← Add this line
      
      if (!token) {
        console.error('❌ No token in fetchTodos');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/todos`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Create a new todo
  const createTodo = async (e) => {
    e.preventDefault();
    if (!title.trim() || !isSignedIn) return;

    try {
      const token = await getToken();
      console.log('🔑 Token being sent:', token); // ← Add this line
      
      if (!token) {
        console.error('❌ No token found!');
        return;
      }
      
      await axios.post(`${API_BASE_URL}/todos`, {
        title,
        description,
        completed: false,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // ... rest of the code
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  // Toggle todo completion
  const toggleTodo = async (id, completed) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const token = await getToken();
      await axios.put(`${API_BASE_URL}/todos/${id}`, {
        ...todo,
        completed: !completed,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      await fetchTodos();
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  // Delete a todo
  const deleteTodo = async (id) => {
    try {
      const token = await getToken();
      await axios.delete(`${API_BASE_URL}/todos/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      await fetchTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [isSignedIn]);

  // If not signed in, show the sign-in page
  if (!isSignedIn) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Welcome to Todo App
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Please sign in to continue
          </Typography>
          <SignIn routing="hash" fallbackRedirectUrl="/" />
        </Paper>
      </Container>
    );
  }

  // If signed in, show the app
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">
            Todo App
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary">
              {user?.primaryEmailAddress?.emailAddress}
            </Typography>
            <SignOutButton>
              <Button variant="outlined" size="small">
                Sign Out
              </Button>
            </SignOutButton>
          </Box>
        </Box>

        <Box component="form" onSubmit={createTodo} sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="Title"
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" fullWidth>
            Add Todo
          </Button>
        </Box>

        <List>
          {loading ? (
            <Typography variant="body1" color="text.secondary" align="center">
              Loading...
            </Typography>
          ) : todos.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center">
              No todos yet. Add one above!
            </Typography>
          ) : (
            todos.map((todo) => (
              <ListItem key={todo.id} divider>
                <Checkbox
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                />
                <ListItemText
                  primary={todo.title}
                  secondary={todo.description}
                  sx={{
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    opacity: todo.completed ? 0.6 : 1,
                  }}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => deleteTodo(todo.id)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>
      </Paper>
    </Container>
  );
}

export default App;