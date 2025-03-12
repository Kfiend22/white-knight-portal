// Users.js
import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Divider,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

function Users({ users, setUsers }) {
  const [openCreateUserDialog, setOpenCreateUserDialog] = useState(false);
  const [openEditUserDialog, setOpenEditUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({});

  // Users Section Handler Functions
  const handleRoleChange = (userId, role) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, [role]: !user[role] } : user
      )
    );
  };

  const handleEditUser = (user) => {
    setSelectedUser({ ...user });
    setOpenEditUserDialog(true);
  };

  const handleDeleteUser = (userId) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
  };

  const handleSaveUser = () => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === selectedUser.id ? selectedUser : user))
    );
    setOpenEditUserDialog(false);
    setSelectedUser(null);
  };

  const handleSaveNewUser = () => {
    if (
      newUser.firstName &&
      newUser.lastName &&
      newUser.username &&
      newUser.password
    ) {
      setUsers((prevUsers) => [
        ...prevUsers,
        {
          ...newUser,
          id: Date.now(),
          notifyNewJobAssigned: false,
          notifyJobDispatched: false,
        },
      ]);
      setOpenCreateUserDialog(false);
      setNewUser({});
    } else {
      alert('Please fill in all required fields');
    }
  };

  return (
    <Box mt={2}>
      <Paper elevation={3} sx={{ padding: 2 }}>
        <Typography variant="h6">Users</Typography>
        <Divider sx={{ my: 2 }} />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateUserDialog(true)}
          sx={{ mb: 2 }}
        >
          Create User
        </Button>

        {/* User Table Display */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell>Dispatcher</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Answering Service</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users &&
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Checkbox
                        checked={user.isAdmin}
                        onChange={() => handleRoleChange(user.id, 'isAdmin')}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={user.isDispatcher}
                        onChange={() =>
                          handleRoleChange(user.id, 'isDispatcher')
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={user.isDriver}
                        onChange={() => handleRoleChange(user.id, 'isDriver')}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={user.isAnsweringService}
                        onChange={() =>
                          handleRoleChange(user.id, 'isAnsweringService')
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleEditUser(user)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit User Dialog */}
      <Dialog
        open={openEditUserDialog}
        onClose={() => setOpenEditUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <>
              <TextField
                margin="dense"
                label="New Password"
                fullWidth
                type="password"
                value={selectedUser.newPassword || ''}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    newPassword: e.target.value,
                  })
                }
              />
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Notifications
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedUser.notifyNewJobAssigned || false}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        notifyNewJobAssigned: e.target.checked,
                      })
                    }
                  />
                }
                label="New Job Assigned"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedUser.notifyJobDispatched || false}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        notifyJobDispatched: e.target.checked,
                      })
                    }
                  />
                }
                label="Job Dispatched To"
              />
              {/* Additional notification options can be added here */}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditUserDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog
        open={openCreateUserDialog}
        onClose={() => setOpenCreateUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="First Name"
            fullWidth
            value={newUser.firstName || ''}
            onChange={(e) =>
              setNewUser({ ...newUser, firstName: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Last Name"
            fullWidth
            value={newUser.lastName || ''}
            onChange={(e) =>
              setNewUser({ ...newUser, lastName: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Phone"
            fullWidth
            value={newUser.phone || ''}
            onChange={(e) =>
              setNewUser({ ...newUser, phone: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Email"
            fullWidth
            value={newUser.email || ''}
            onChange={(e) =>
              setNewUser({ ...newUser, email: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Username"
            fullWidth
            value={newUser.username || ''}
            onChange={(e) =>
              setNewUser({ ...newUser, username: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Password"
            fullWidth
            type="password"
            value={newUser.password || ''}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
          />
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Roles
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={newUser.isAdmin || false}
                onChange={(e) =>
                  setNewUser({ ...newUser, isAdmin: e.target.checked })
                }
              />
            }
            label="Admin"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newUser.isDispatcher || false}
                onChange={(e) =>
                  setNewUser({ ...newUser, isDispatcher: e.target.checked })
                }
              />
            }
            label="Dispatcher"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newUser.isDriver || false}
                onChange={(e) =>
                  setNewUser({ ...newUser, isDriver: e.target.checked })
                }
              />
            }
            label="Driver"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newUser.isAnsweringService || false}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    isAnsweringService: e.target.checked,
                  })
                }
              />
            }
            label="Answering Service"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateUserDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveNewUser} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Users;
