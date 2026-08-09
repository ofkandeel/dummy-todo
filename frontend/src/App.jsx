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

// API base URL (points to your local backend)
const API_BASE_URL = '/api';

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Fetch all todos
  const fetchTodos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/todos`);
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  // Create a new todo
  const createTodo = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await axios.post(`${API_BASE_URL}/todos`, {
        title,
        description,
        completed: false,
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
      await axios.put(`${API_BASE_URL}/todos/${id}`, {
        ...todo,
        completed: !completed,
      });
      fetchTodos();
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  // Delete a todo
  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/todos/${id}`);
      fetchTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Todo App (Vercel Test)
        </Typography>

        {/* Create Todo Form */}
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

        {/* Todo List */}
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
  );
}

export default App;