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

const API_BASE_URL = 'http://localhost:8000';

interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const fetchTodos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/todos`);
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const createTodo = async (e: React.FormEvent) => {
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

  const toggleTodo = async (id: number, completed: boolean) => {
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

  const deleteTodo = async (id: number) => {
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
          Todo App (Full Stack Demo)
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
  );
}

export default App;