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
  AppBar,
  Toolbar,
  Divider,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabase } from './supabaseClient';

const API_BASE_URL = '/api';

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => authListener?.subscription?.unsubscribe();
  }, []);

  // Get token function
  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  // Fetch todos
  const fetchTodos = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/todos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodos(response.data || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
      setTodos([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTodos();
    } else {
      setTodos([]);
    }
  }, [user]);

  // Create a new todo
  const createTodo = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const token = await getToken();
      await axios.post(`${API_BASE_URL}/todos`, {
        title,
        description,
        completed: false,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTitle('');
      setDescription('');
      fetchTodos();
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
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTodos();
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  // Delete a todo
  const deleteTodo = async (id) => {
    try {
      const token = await getToken();
      await axios.delete(`${API_BASE_URL}/todos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  // Handle Magic Link
  const handleMagicLink = async () => {
    if (!email) {
      setMessage('Please enter your email address.');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setMessage(`✅ Magic link sent to ${email}. Check your inbox!`);
      setEmail('');
    } catch (error) {
      console.error('Magic link error:', error.message);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // Handle email/password auth
  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }
      if (result.error) throw result.error;
      setEmail('');
      setPassword('');
      setMessage(`✅ ${isSignUp ? 'Signed up' : 'Logged in'} successfully!`);
    } catch (error) {
      console.error('Auth error:', error.message);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // If not logged in, show auth form
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            {isSignUp ? 'Sign Up' : 'Log In'}
          </Typography>
          {message && (
            <Alert severity={message.startsWith('✅') ? 'success' : 'error'} sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}
          <Box component="form" onSubmit={handleAuth} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            {!isSignUp && (
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
                required
              />
            )}
            <Button type="submit" variant="contained" fullWidth sx={{ mb: 2 }}>
              {isSignUp ? 'Sign Up' : 'Log In'}
            </Button>
            <Divider sx={{ my: 2 }}>OR</Divider>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleMagicLink}
              sx={{ mb: 2 }}
            >
              Send Magic Link
            </Button>
            <Button
              variant="text"
              fullWidth
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage('');
              }}
            >
              {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Logged in: show todo app
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Todo App
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user.email}
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            My Todos
          </Typography>

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
            {todos.length === 0 ? (
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
    </>
  );
}

export default App;