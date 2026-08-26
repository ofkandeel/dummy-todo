// mobile/App.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';

// API base URL (your Render backend)
const API_BASE_URL = 'https://dummy-todo-api.onrender.com';

// Your Clerk JWT token
const HARDCODED_TOKEN = 'eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zSUJQSjYxNTJIY015cXNoRUN1UkVxNFV5TmsiLCJvaWF0IjoxNzg3NzI1NTE1LCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwczovL2R1bW15LXRvZG8tMi52ZXJjZWwuYXBwIiwiZXhwIjoxNzg3NzI1NTc1LCJmdmEiOlsxNDU0LC0xXSwiaWF0IjoxNzg3NzI1NTE1LCJpc3MiOiJodHRwczovL3NlY3VyZS1tdXR0LTMxNTIuY2xlcmsuYWNjb3VudHMuZGV2IiwibmJmIjoxNzg3NzI1NTA1LCJzaWQiOiJzZXNzXzNJT2FuQm11eUI4MlJkSUV5SmdiWVBSdWhiRCIsInN0cyI6ImFjdGl2ZSIsInN1YiI6InVzZXJfM0lCZGJxVHM3NmxyQ1ZDOVhuUG5LVnJmcWpZIiwidiI6Mn0.rMCD5Jh0N186rDb8XnA7nma5SgtwbndKLZ8oJHGwPfU-HjVqdHF8cWJHHfaBA1ckKkVkUk7RZDLcXnvGDIkHzqqaEuiKhGxJVn_JlGwphdUEcmTnQiim0bW710ba7leM6Epxa2uMdLNvdfxryHV7xsSUY8Oef2JZUftUMtD8YbK1nAAcLBgeomLD5jt7t_fR43CsYb_wEg3WMEMuAuPg-DSAqtnaad2xdGGnVPz_y5cjjC08Leadgo7_0Xyv7uBDs03T_cRR9tWJLrzr1EWy3wFvH9tz37RDM3dqi75muLfGFjyeayeYG7IJYWVfhg4qqbX_wPmotJNmqDmyGwVoNA';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/todos`, {
        headers: {
          Authorization: `Bearer ${HARDCODED_TOKEN}`,
        },
      });
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
      Alert.alert('Error', 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/todos`,
        {
          title,
          description,
          completed: false,
        },
        {
          headers: {
            Authorization: `Bearer ${HARDCODED_TOKEN}`,
          },
        }
      );
      setTitle('');
      setDescription('');
      setTodos((prev) => [...prev, response.data]);
    } catch (error) {
      console.error('Error creating todo:', error);
      Alert.alert('Error', 'Failed to create todo');
    }
  };

  const toggleTodo = async (id, completed) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    try {
      await axios.put(
        `${API_BASE_URL}/todos/${id}`,
        {
          ...todo,
          completed: !completed,
        },
        {
          headers: {
            Authorization: `Bearer ${HARDCODED_TOKEN}`,
          },
        }
      );
      setTodos((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t
        )
      );
    } catch (error) {
      console.error('Error updating todo:', error);
      Alert.alert('Error', 'Failed to update todo');
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/todos/${id}`, {
        headers: {
          Authorization: `Bearer ${HARDCODED_TOKEN}`,
        },
      });
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
      Alert.alert('Error', 'Failed to delete todo');
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const renderTodo = ({ item }) => (
    <View style={styles.todoItem}>
      <TouchableOpacity
        style={styles.todoContent}
        onPress={() => toggleTodo(item.id, item.completed)}
      >
        <Text
          style={[
            styles.todoTitle,
            item.completed && styles.todoCompleted,
          ]}
        >
          {item.title}
        </Text>
        <Text style={styles.todoDescription}>{item.description}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteTodo(item.id)}
      >
        <Text style={styles.deleteButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Todo App</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
        />
        <TouchableOpacity style={styles.addButton} onPress={createTodo}>
          <Text style={styles.addButtonText}>Add Todo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={todos}
          renderItem={renderTodo}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No todos yet. Add one above!</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  todoItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  todoCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  todoDescription: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
  },
});